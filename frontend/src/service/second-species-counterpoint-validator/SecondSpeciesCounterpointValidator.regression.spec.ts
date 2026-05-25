import {describe, it, expect, beforeEach} from 'vitest';
import {Note} from '../../models/note';
import {Rule, Severity} from '../../models/rule';
import {RuleIdEnum} from '../../data/rules.data';
import {SecondSpeciesCounterpointValidator} from './SecondSpeciesCounterpointValidator';

describe('CounterpointValidator - regression', () => {

  let validator: SecondSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();

  });
  it('returns false when highest note appears more than once', () => {
    const cf = [new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4)]

    const cp = [new Note("D", 5), new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5), new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
      new Note("F", 5),
      new Note("D", 5),
      new Note("C", 5),
      new Note("D", 5),
      new Note("E", 5),
      new Note("B", 4),
      new Note("C", 5),
      new Note("A", 4),
      new Note("G", 4),
      new Note("B", 4),
      new Note("C", 5),];

    let brokenRules = validator.getBrokenRules(cf, cp, []);
    let expectedResult: Rule[] = [
      new Rule(
        101,
        "All downbeats must form a consonant interval with the cantus firmus",
        Severity.Error
      ),
      new Rule(
        103,
        "Both voices must end on scale degree 1 (unison or octave)",
        Severity.Error
      ),
      new Rule(
        109,
        "Dissonances may only appear on upbeats as passing tones (approached and left by step in the same direction)",
        Severity.Error
      )
    ];
    expect(brokenRules).toStrictEqual(expectedResult)
  });
  it('returns false when highest note appears more than once', () => {
    const cf = [new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4)]

    const cp = [new Note("D", 5), new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5), new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
      new Note("F", 5),
      new Note("D", 5),
      new Note("C", 5),
      new Note("D", 5),
      new Note("E", 5),
      new Note("D", 5),
      new Note("C", 5),
      new Note("A", 4),
      new Note("G", 4),
      new Note("B", 4),
      new Note("C", 5),];

    let brokenRules = validator.getBrokenRules(cf, cp, []);

    let expectedResult: Rule[] = [
      new Rule(
        101,
        "All downbeats must form a consonant interval with the cantus firmus",
        Severity.Error
      ),
      new Rule(
        103,
        "Both voices must end on scale degree 1 (unison or octave)",
        Severity.Error
      ),
      new Rule(
        106,
        "No parallel perfect fifths from an upbeat to the following downbeat",
        Severity.Error
      ),
      new Rule(
        108,
        "No approaching a perfect consonance on a downbeat by direct motion",
        Severity.Error
      ),
      new Rule(
        109,
        "Dissonances may only appear on upbeats as passing tones (approached and left by step in the same direction)",
        Severity.Error
      )
    ];

    expect(brokenRules).toStrictEqual(expectedResult)

  })
})
