import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note';
import { ThirdSpeciesCounterpointValidator } from './ThirdSpeciesCounterpointValidator';

describe('ThirdSpeciesCounterpointValidator - regression', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

  it('accepts a stepwise third species CP over a 3-note CF with no broken rules', () => {
    // CF: C4 D4 C4 (N=3) → CP needs 9 notes
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
      new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
      new Note("C", 5),
    ];

    expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    expect(validator.getBrokenRules(cf, cp)).toHaveLength(0);
  });

  it('accepts a third species CP over a 4-note CF with no broken rules', () => {
    // CF: C4 E4 D4 C4 (N=4) → CP needs 13 notes
    const cf = [new Note("C", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("A", 4), new Note("G", 4), new Note("E", 4),
      new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5),
      new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4),
      new Note("C", 5),
    ];

    expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    expect(validator.getBrokenRules(cf, cp)).toHaveLength(0);
  });
});
