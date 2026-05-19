import {Note} from '../models/note';

export const CANTUS_FIRMUS_LIST: Note[][] = [
  // D Dorian
  [new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4)],
  // E Phrygian
  [new Note("E", 4), new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("A", 4), new Note("G", 4), new Note("E", 4), new Note("F", 4), new Note("E", 4), new Note("E", 4)],
  // F Lydian
  [new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("F", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 5), new Note("A", 4), new Note("F", 4), new Note("G", 4), new Note("F", 4)],
  // G Mixolydian
  [new Note("G", 3), new Note("C", 4), new Note("B", 3), new Note("G", 3), new Note("C", 4), new Note("E", 4), new Note("G", 4), new Note("E", 4), new Note("C", 4), new Note("D", 4), new Note("A", 3), new Note("G", 3)],
  // A Aeolian
  [new Note("A", 3), new Note("C", 4), new Note("B", 3), new Note("D", 4), new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4), new Note("B", 3), new Note("A", 3)],
  // C Ionian
  [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("E", 4), new Note("A", 4), new Note("G", 4), new Note("E", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)],
];
