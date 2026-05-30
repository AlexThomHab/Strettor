import {beforeEach, describe, expect, it} from 'vitest';
import {FirstSpeciesCounterpointValidator} from './FirstSpeciesCounterpointValidator';
import {Note} from '../../models/note';
import {Severity} from '../../models/rule';

describe('CounterpointValidator - regression', () => {
  let validator: FirstSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new FirstSpeciesCounterpointValidator();
  });

  it('accepts a compound 12 (fifth + octave, 19 semitones) as consonant - regression for missing interval', () => {
    // E5 above E4 = 12 semitones (octave). G5 above C4 = 19 semitones (compound fifth).
    // Bug: 19 was not in the consonance list, causing false dissonance errors.
    const cf: Note[] = [
      new Note("E", 4), new Note("C", 4), new Note("D", 4), new Note("C", 4),
      new Note("A", 3), new Note("A", 4), new Note("G", 4), new Note("E", 4),
      new Note("F", 4), new Note("E", 4),
    ];
    const cp: Note[] = [
      new Note("E", 5), new Note("G", 5), new Note("D", 5), new Note("E", 5),
      new Note("F", 5), new Note("E", 5), new Note("B", 4), new Note("C", 5),
      new Note("D", 5), new Note("E", 5),
    ];

    expect(validator.getBrokenRules(cf, cp).filter(x => x.severity == Severity.Error)).toHaveLength(0);
  });

  it('accepts a valid A-minor first species counterpoint', () => {
    const cf: Note[] = [
      new Note("A", 3), new Note("C", 4), new Note("B", 3), new Note("D", 4),
      new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("E", 4),
      new Note("D", 4), new Note("C", 4), new Note("B", 3), new Note("A", 3),
    ];
    const cp: Note[] = [
      new Note("C", 5), new Note("A", 4), new Note("G", 4), new Note("B", 4),
      new Note("C", 5), new Note("G", 5), new Note("F", 5), new Note("C", 5),
      new Note("D", 5), new Note("E", 5), new Note("G", 4), new Note("A", 4),
    ];

    expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    expect(validator.getBrokenRules(cf, cp)).toHaveLength(0);
  });
});
