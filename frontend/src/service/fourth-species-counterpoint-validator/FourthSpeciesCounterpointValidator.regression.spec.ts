import { beforeEach, describe, expect, it } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Severity } from '../../models/rule';

describe('FourthSpeciesCounterpointValidator - regression', () => {
  let validator: FourthSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new FourthSpeciesCounterpointValidator();
  });

  it('accepts Fux fourth species exercise above the fux Dorian CF with no errors', () => {
    // Haydn Dorian CF — 11 notes → CP needs ((11-2)*2)+2 = 20 notes
    // Fux's solution uses all consonant suspensions, referenced in the Gran lecture.
    const fuxDorianCF: Note[] = [
      new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4),
      new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("E", 4), new Note("D", 4)
    ];
//F = cf, sus = G
    const fuxCp: Note[] = [
      new Note("A", 4), new Note("A", 4),
      new Note("D", 5), new Note("D", 5),
      new Note("C", 5), new Note("C", 5),
      new Note("B", 4), new Note("B", 4),
      new Note("G", 4), new Note("A", 4),
      new Note("C", 5), new Note("C", 5),
      new Note("F", 5), new Note("F", 5),
      new Note("E", 5), new Note("E", 5),
      new Note("D", 5), new Note("D", 5),
      new Note("C", 5), new Note("D", 5)
    ];

    expect(fuxCp.length).toBe(((fuxDorianCF.length - 2) * 2) + 2);
    expect(validator.isValidSolution(fuxDorianCF, fuxCp, [])).toBe(true);
    expect(validator.getBrokenRules(fuxDorianCF, fuxCp).filter(r => r.severity === Severity.Error)).toHaveLength(0);
  });

  it('accepts a valid 7-6 suspension exercise over a 3-note CF with no broken rules', () => {
    // C5 tied → dissonant seventh above D4, resolves down by step to B4 (major sixth above D4)
    const cf: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp: Note[] = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];

    expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    expect(validator.getBrokenRules(cf, cp)).toHaveLength(0);
  });

  it('accepts a valid 4-3 suspension exercise over a 3-note CF with no broken rules', () => {
    // C5 tied → dissonant fourth above G4, resolves down by step to B4 (major third above G4)
    const cf: Note[] = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
    const cp: Note[] = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];

    expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    expect(validator.getBrokenRules(cf, cp)).toHaveLength(0);
  });
  it('does not accept a counterpoint over the dorian cantus firmus with a 2nd that does not resolve downward', () => {
    // Haydn Dorian CF — 11 notes → CP needs ((11-2)*2)+2 = 20 notes
    // Fux's solution uses all consonant suspensions, referenced in the Gran lecture.
    const fuxDorianCF: Note[] = [
      new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4),
      new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("E", 4), new Note("D", 4)
    ];
    const cp: Note[] = [
      new Note("A", 4), new Note("A", 4),
      new Note("D", 5), new Note("D", 5),
      new Note("C", 5), new Note("C", 5),
      new Note("B", 4), new Note("B", 4),
      new Note("G", 4), new Note("G", 4),
      new Note("A", 4), new Note("A", 4),
      new Note("F", 5), new Note("F", 5),
      new Note("E", 5), new Note("E", 5),
      new Note("D", 5), new Note("D", 5),
      new Note("C", 5), new Note("D", 5)
    ];
    expect(cp.length).toBe(((fuxDorianCF.length - 2) * 2) + 2);
    expect(validator.isValidSolution(fuxDorianCF, cp, [])).toBe(false);
    let result = validator.getBrokenRules(fuxDorianCF, cp).filter(r => r.severity === Severity.Error);
    expect(result).toHaveLength(1);
    expect(result.filter(r => r.description === "A dissonant suspension must resolve down by step to a consonance")).toHaveLength(1);
  });
})
