import {Note} from '../models/note';

export class IntervalCalculator {

  private chromaticScale: Array<string> = ["C", "C#", "D", "D#",
    "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  constructor() {
  }

  public calculateSemitoneInterval(noteA: Note, noteB: Note): number {

    var highestNote = this.getHighestNote(noteA, noteB);
    var lowestNote = this.getLowestNote(noteA, noteB);

    var initialInterval = this.chromaticScale.indexOf(highestNote.noteValue) - this.chromaticScale.indexOf(lowestNote.noteValue);

    var octaveOffset = highestNote.pitchClass - lowestNote.pitchClass;
    if (initialInterval < 0){
      initialInterval = 12 + initialInterval;
      octaveOffset = 0;
    }
    octaveOffset = octaveOffset * 12;

    var result = initialInterval + octaveOffset;
    return result;
  }
  public getNameOfInterval(semitones: number): string {
    const intervalNames: Array<string> = [
      "Perfect Unison", "Minor Second", "Major Second", "Minor Third", "Major Third", "Perfect Fourth",
      "Tritone", "Perfect Fifth", "Minor Sixth", "Major Sixth", "Minor Seventh", "Major Seventh", "Octave",
      "Minor Ninth", "Major Ninth", "Minor Tenth", "Major Tenth"
    ];

    if (semitones < 0 || semitones > 16) {
      return "Unknown Interval";
    }

    return intervalNames[semitones];
  }
  private getNoteValue(note: Note): number {
    return (note.pitchClass * 12) + this.chromaticScale.indexOf(note.noteValue);
  }

  private getHighestNote(noteA: Note, noteB: Note): Note {
    return this.getNoteValue(noteA) >= this.getNoteValue(noteB) ? noteA : noteB;
  }

  private getLowestNote(noteA: Note, noteB: Note): Note {
    return this.getNoteValue(noteA) <= this.getNoteValue(noteB) ? noteA : noteB;
  }
}
