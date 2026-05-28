import {describe, it, expect, beforeEach} from 'vitest';
import {FirstSpeciesCounterpointValidator} from './FirstSpeciesCounterpointValidator';
import {Note} from '../../models/note';
import {Rule, Severity} from '../../models/rule';
import {RuleIdEnum} from '../../data/rules.data';
import {
  SecondSpeciesCounterpointValidator
} from '../second-species-counterpoint-validator/SecondSpeciesCounterpointValidator';

describe('CounterpointValidator - regression', () => {
  let validator: FirstSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new FirstSpeciesCounterpointValidator();
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
