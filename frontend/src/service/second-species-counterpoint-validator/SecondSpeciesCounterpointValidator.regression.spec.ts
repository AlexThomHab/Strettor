import {describe, it, expect, beforeEach} from 'vitest';
import {Note} from '../../models/note';
import {Severity} from '../../models/rule';
import {RuleIdEnum} from '../../data/rules.data';
import {SecondSpeciesCounterpointValidator} from './SecondSpeciesCounterpointValidator';

describe('CounterpointValidator - regression', () => {

  let validator: SecondSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();
  });

  it('returns the correct broken rules for a CP with a dissonant downbeat, bad ending, and non-passing dissonance', () => {
    const cf = [new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4)];

    const cp = [new Note("D", 5), new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5),
      new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
      new Note("F", 5), new Note("D", 5), new Note("C", 5), new Note("D", 5),
      new Note("E", 5), new Note("B", 4), new Note("C", 5), new Note("A", 4),
      new Note("G", 4), new Note("B", 4), new Note("C", 5),
    ];

    const brokenRules = validator.getBrokenRules(cf, cp, []);

    expect(brokenRules).toHaveLength(3);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_DownbeatConsonance);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_ValidEndingInterval);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone);
    expect(brokenRules.every(r => r.severity === Severity.Error)).toBe(true);
  });

  it('returns the correct broken rules for a CP with additional parallel fifths and direct motion violations', () => {
    const cf = [new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4)];

    const cp = [new Note("D", 5), new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5),
      new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
      new Note("F", 5), new Note("D", 5), new Note("C", 5), new Note("D", 5),
      new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("A", 4),
      new Note("G", 4), new Note("B", 4), new Note("C", 5),
    ];

    const brokenRules = validator.getBrokenRules(cf, cp, []);

    expect(brokenRules).toHaveLength(5);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_DownbeatConsonance);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_ValidEndingInterval);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone);
    expect(brokenRules.every(r => r.severity === Severity.Error)).toBe(true);
  });
});
