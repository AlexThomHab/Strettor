import {describe, it, expect, beforeEach} from 'vitest';
import {CounterpointValidator} from './CounterpointValidator';
import {Note} from '../models/note';
import {Rule, RuleIdEnum, Severity} from '../models/rule';

describe('CounterpointValidator — rule enabling/disabling', () => {
  let validator: CounterpointValidator;

  // A known-valid solution (D Dorian) reused from the brokenRules suite
  const dorianCF: Note[] = [
    new Note("D", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("A", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("C#", 3), new Note("D", 3)
  ];
  const validCP: Note[] = [
    new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("B", 3),
    new Note("C", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
    new Note("E", 4), new Note("D", 4)
  ];

  // CF and CP with identical pitches — violates:
  //   NoParallelUnisons, NoUnisonsInMiddle, NoVoiceOverlap, CoincidingClimax
  const unisonCF: Note[] = [new Note("C", 4), new Note("D", 4), new Note("E", 4)];
  const unisonCP: Note[] = [new Note("C", 4), new Note("D", 4), new Note("E", 4)];
  const unisonViolations = [
    RuleIdEnum.NoParallelUnisons,
    RuleIdEnum.NoUnisonsInMiddle,
    RuleIdEnum.NoVoiceOverlap,
    RuleIdEnum.CoincidingClimax,
  ];

  beforeEach(() => {
    validator = new CounterpointValidator();
  });

  describe('default rule state', () => {
    it('every rule has a numeric id', () => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      rules.forEach(r => expect(typeof r.rule.id).toBe('number'));
    });

    it('there are 17 rules defined', () => {
      const rules = (validator as any)._rules as Array<unknown>;
      expect(rules).toHaveLength(17);
    });
  });

  describe('isValidSolution', () => {
    it('passes a valid solution with no disabled rules', () => {
      expect(validator.isValidSolution(dorianCF, validCP, [])).toBe(true);
    });

    it('fails an invalid solution with no disabled rules', () => {
      expect(validator.isValidSolution(unisonCF, unisonCP, [])).toBe(false);
    });

    it('passes when every violated rule is disabled', () => {
      expect(
        validator.isValidSolution(unisonCF, unisonCP, unisonViolations)
      ).toBe(true);
    });

    it('still fails when only some violated rules are disabled', () => {
      // Disable only CoincidingClimax — the other three still fire
      expect(
        validator.isValidSolution(unisonCF, unisonCP, [RuleIdEnum.CoincidingClimax])
      ).toBe(false);
    });

    it('disabling an irrelevant rule has no effect', () => {
      // NoParallelFifths is not violated by unisonCP — disabling it changes nothing
      expect(
        validator.isValidSolution(unisonCF, unisonCP, [RuleIdEnum.NoParallelFifths])
      ).toBe(false);
    });

    it('disabling a rule does not affect a passing solution', () => {
      // Disabling an arbitrary rule on a valid solution should still pass
      expect(
        validator.isValidSolution(dorianCF, validCP, [RuleIdEnum.NoParallelFifths])
      ).toBe(true);
    });
  });

  describe('disabling specific rules by RuleId', () => {
    it('NoParallelUnisons — violation ignored when disabled', () => {
      // unisonCP has consecutive unisons; disable just that rule (plus the other co-violations)
      const withoutUnisons = [RuleIdEnum.NoUnisonsInMiddle, RuleIdEnum.NoVoiceOverlap, RuleIdEnum.CoincidingClimax];
      // Still fails because NoParallelUnisons is enabled
      expect(validator.isValidSolution(unisonCF, unisonCP, withoutUnisons)).toBe(false);
      // Now disable it too — should pass
      expect(validator.isValidSolution(unisonCF, unisonCP, [...withoutUnisons, RuleIdEnum.NoParallelUnisons])).toBe(true);
    });

    it('NoUnisonsInMiddle — violation ignored when disabled', () => {
      const withoutMiddle = [RuleIdEnum.NoParallelUnisons, RuleIdEnum.NoVoiceOverlap, RuleIdEnum.CoincidingClimax];
      expect(validator.isValidSolution(unisonCF, unisonCP, withoutMiddle)).toBe(false);
      expect(validator.isValidSolution(unisonCF, unisonCP, [...withoutMiddle, RuleIdEnum.NoUnisonsInMiddle])).toBe(true);
    });

    it('SameLength — mismatched lengths always blocked (early-return fires regardless)', () => {
      // getBrokenRules short-circuits on length mismatch before checking enabledRules
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("E", 5)];
      expect(validator.isValidSolution(cf, cp, [RuleIdEnum.SameLength])).toBe(false);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: RuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    it('NoParallelFifths is an Error', () => {
      expect(getRuleById(RuleIdEnum.NoParallelFifths).severity).toBe(Severity.Error);
    });

    it('NoParallelOctaves is an Error', () => {
      expect(getRuleById(RuleIdEnum.NoParallelOctaves).severity).toBe(Severity.Error);
    });

    it('NoUnisonsInMiddle is an Error', () => {
      expect(getRuleById(RuleIdEnum.NoUnisonsInMiddle).severity).toBe(Severity.Error);
    });

    it('FinalCadence is a Warning', () => {
      expect(getRuleById(RuleIdEnum.FinalCadence).severity).toBe(Severity.Warning);
    });

    it('LargeLeapsRecoverCorrectly is a Warning', () => {
      expect(getRuleById(RuleIdEnum.LargeLeapsRecoverCorrectly).severity).toBe(Severity.Warning);
    });

    it('CoincidingClimax is a Warning', () => {
      expect(getRuleById(RuleIdEnum.CoincidingClimax).severity).toBe(Severity.Warning);
    });

    it('NoExcessiveConsecutiveThirdsOrSixths is a Warning', () => {
      expect(getRuleById(RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths).severity).toBe(Severity.Warning);
    });

    it('NoExcessiveRepeatedNotes is a Warning', () => {
      expect(getRuleById(RuleIdEnum.NoExcessiveRepeatedNotes).severity).toBe(Severity.Warning);
    });
  });
});
