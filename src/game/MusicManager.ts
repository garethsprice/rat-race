import { MusicState } from '../types';

// Declare types for external libraries
declare const MidiPlayer: {
  Player: new (callback: (event: MidiEvent) => void) => MidiPlayerInstance;
};

declare const Soundfont: {
  instrument: (
    ctx: AudioContext,
    name: string
  ) => Promise<SoundfontInstrument>;
};

interface MidiEvent {
  name: string;
  noteName?: string;
  noteNumber?: number;
  velocity?: number;
}

interface MidiPlayerInstance {
  on(event: string, callback: () => void): void;
  loadArrayBuffer(buffer: ArrayBuffer): void;
  play(): void;
  stop(): void;
}

interface SoundfontInstrument {
  play(
    note: string,
    time: number,
    options?: { gain?: number }
  ): { stop: () => void };
}

interface ActiveNote {
  stop: () => void;
}

export class MusicManager {
  private state: MusicState = 'none';
  private enabled: boolean = false;
  private audioContext: AudioContext | null = null;
  private midiPlayer: MidiPlayerInstance | null = null;
  private instrument: SoundfontInstrument | null = null;
  private activeNotes: Map<number, ActiveNote> = new Map();
  private initialized: boolean = false;

  get musicState(): MusicState {
    return this.state;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.instrument = await Soundfont.instrument(
        this.audioContext,
        'acoustic_grand_piano'
      );
      this.initialized = true;
      console.log('Music initialized');
    } catch (e) {
      console.error('Failed to initialize music:', e);
    }
  }

  private stopAllNotes(): void {
    this.activeNotes.forEach((note) => {
      if (note && note.stop) note.stop();
    });
    this.activeNotes.clear();
  }

  private async playMidi(
    filename: string,
    loop: boolean = false,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.instrument || !this.audioContext) return;

    if (this.midiPlayer) {
      this.midiPlayer.stop();
      this.stopAllNotes();
    }

    try {
      const response = await fetch(filename);
      const arrayBuffer = await response.arrayBuffer();

      this.midiPlayer = new MidiPlayer.Player((event: MidiEvent) => {
        if (event.name === 'Note on' && event.velocity && event.velocity > 0) {
          const note = this.instrument!.play(
            event.noteName!,
            this.audioContext!.currentTime,
            { gain: (event.velocity / 127) * 0.5 }
          );
          this.activeNotes.set(event.noteNumber!, note);
        } else if (
          event.name === 'Note off' ||
          (event.name === 'Note on' && event.velocity === 0)
        ) {
          const note = this.activeNotes.get(event.noteNumber!);
          if (note) {
            note.stop();
            this.activeNotes.delete(event.noteNumber!);
          }
        }
      });

      this.midiPlayer.on('endOfFile', () => {
        this.stopAllNotes();
        if (loop && this.enabled) {
          this.midiPlayer!.play();
        } else if (onEnd) {
          onEnd();
        }
      });

      this.midiPlayer.loadArrayBuffer(arrayBuffer);
      this.midiPlayer.play();
      console.log('Playing:', filename, loop ? '(looping)' : '');
    } catch (e) {
      console.error('Failed to play MIDI:', e);
    }
  }

  startIntro(): void {
    if (!this.enabled || this.state === 'intro') return;
    this.state = 'intro';
    this.playMidi('/music/TellIntr.mid', false, () => {
      if (this.enabled && (this.state === 'intro' || this.state === 'loop')) {
        this.startLoop();
      }
    });
  }

  startLoop(): void {
    if (!this.enabled) return;
    this.state = 'loop';
    this.playMidi('/music/TellLoop.mid', true);
  }

  startEnd(): void {
    if (!this.enabled || this.state === 'end' || this.state === 'finished')
      return;
    this.state = 'end';
    this.playMidi('/music/TellEnd.mid', false, () => {
      this.state = 'finished';
    });
  }

  stop(): void {
    if (this.midiPlayer) {
      this.midiPlayer.stop();
      this.stopAllNotes();
    }
  }

  toggle(raceStarted: boolean, allFinished: boolean): boolean {
    this.enabled = !this.enabled;

    if (this.enabled) {
      this.initialize().then(() => {
        if (allFinished) {
          this.state = 'finished';
        } else if (raceStarted) {
          this.startLoop();
        } else {
          this.startIntro();
        }
      });
    } else {
      this.stop();
      this.state = 'none';
    }

    return this.enabled;
  }
}
