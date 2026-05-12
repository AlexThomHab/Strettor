export class Note {
  public noteValue : string;
  public pitchClass : number;

  constructor(noteValue : string , pitchClass : number) {
    this.noteValue = noteValue;
    this.pitchClass = pitchClass;
  }
}
