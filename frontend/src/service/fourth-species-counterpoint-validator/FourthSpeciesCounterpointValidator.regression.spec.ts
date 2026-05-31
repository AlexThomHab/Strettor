import { beforeEach, describe, expect, it } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Severity } from '../../models/rule';

describe('FourthSpeciesCounterpointValidator - regression', () => {
  let validator: FourthSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new FourthSpeciesCounterpointValidator();
  });

  it('accepts a valid normalized fourth species CP over Haydn Dorian CF with no errors', () => {
    // Haydn Dorian CF (11 notes) — as referenced in the Gran lecture as the basis for Beethoven's suspension exercise
    // CP length = ((11-2)*2)+2 = 20 notes
    const haydnCF: Note[] = [
      new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4),
      new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("E", 4), new Note("D", 4)
    ];

    // Normalized reduction of a valid fourth species exercise above this CF.
    // Downbeat positions must be consonant; ending must be unison or octave.
    const cp: Note[] = [
      new Note("D", 5), new Note("C", 5),
      new Note("A", 4), new Note("B", 4),
      new Note("C", 5), new Note("B", 4),
      new Note("A", 4), new Note("B", 4),
      new Note("C", 5), new Note("B", 4),
      new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("G", 4),
      new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("E", 4),
      new Note("C#", 4), new Note("D", 4)
    ];

    expect(cp.length).toBe(((haydnCF.length - 2) * 2) + 2);
    expect(validator.getBrokenRules(haydnCF, cp).filter(x => x.severity === Severity.Error)).toHaveLength(0);
  });

  it('accepts a valid normalized fourth species CP over the Fux Dorian CF with no errors', () => {
    // Fux Dorian CF (10 notes) → CP length = ((10-2)*2)+2 = 18
    const dorianCF: Note[] = [
      new Note("D", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
      new Note("A", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
      new Note("C#", 3), new Note("D", 3)
    ];

    const cp: Note[] = [
      new Note("D", 4), new Note("C", 4),
      new Note("A", 3), new Note("B", 3),
      new Note("C", 4), new Note("E", 4),
      new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4),
      new Note("C", 4), new Note("B", 3),
      new Note("A", 3), new Note("B", 3),
      new Note("C", 4), new Note("B", 3),
      new Note("A", 3), new Note("D", 4)
    ];

    expect(cp.length).toBe(((dorianCF.length - 2) * 2) + 2);
    expect(validator.isValidSolution(dorianCF, cp, [])).toBe(true);
    expect(validator.getBrokenRules(dorianCF, cp).filter(x => x.severity === Severity.Error)).toHaveLength(0);
  });
});
