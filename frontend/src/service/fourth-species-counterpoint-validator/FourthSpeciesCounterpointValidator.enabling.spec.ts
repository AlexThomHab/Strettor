import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Rule, Severity } from '../../models/rule';
import { RuleIdEnum } from '../../data/rules.data';

describe('FourthSpeciesCounterpointValidator - rule enabling/disabling', () => {
  let validator: FourthSpeciesCounterpointValidator;

  const dorianCF: Note[] = [
    new Note("D", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("A", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("C#", 3), new Note("D", 3)
  ];

  const validCP: Note[] = [
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

  beforeEach(() => {
    validator = new FourthSpeciesCounterpointValidator();
  });

  const brokenIds = (cf: Note[], cp: Note[], disabled: number[] = []) =>
    validator.getBrokenRules(cf, cp, disabled).map(r => r.id);

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

    it('disabling a rule does not affect a passing solution', () => {
      expect(validator.isValidSolution(dorianCF, validCP, [RuleIdEnum.FinalCadence])).toBe(true);
    });
  });

  describe('SameLength - always enforced', () => {
    it('rejects a CP that is too short even if the rule is disabled', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [RuleIdEnum.SameLength])).toBe(false);
    });
  });

  describe('each rule fires and can be silenced individually', () => {
    it('OnlyConsonantIntervals - dissonant at a downbeat position', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 4), new Note("B", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.OnlyConsonantIntervals);
      expect(brokenIds(cf, cp, [RuleIdEnum.OnlyConsonantIntervals])).not.toContain(RuleIdEnum.OnlyConsonantIntervals);
    });

    it('ValidBeginningInterval - seventh is not a valid opening', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("B", 4), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.ValidBeginningInterval);
      expect(brokenIds(cf, cp, [RuleIdEnum.ValidBeginningInterval])).not.toContain(RuleIdEnum.ValidBeginningInterval);
    });

    it('ValidEndingInterval - ending on a fifth', () => {
      const cp = [...validCP];
      cp[cp.length - 1] = new Note("A", 3);
      expect(brokenIds(dorianCF, cp)).toContain(RuleIdEnum.ValidEndingInterval);
      expect(brokenIds(dorianCF, cp, [RuleIdEnum.ValidEndingInterval])).not.toContain(RuleIdEnum.ValidEndingInterval);
    });

    it('NoParallelFifths - consecutive fifths in normalized form', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoParallelFifths);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoParallelFifths])).not.toContain(RuleIdEnum.NoParallelFifths);
    });

    it('NoParallelOctaves - consecutive octaves', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoParallelOctaves);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoParallelOctaves])).not.toContain(RuleIdEnum.NoParallelOctaves);
    });

    it('NoParallelUnisons - consecutive unisons', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoParallelUnisons);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoParallelUnisons])).not.toContain(RuleIdEnum.NoParallelUnisons);
    });

    it('NoAugmentedOrDiminishedMelodicIntervals - tritone leap', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("F#", 4), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('NoUnisonsInMiddle - unison at an inner position', () => {
      const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 4), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoUnisonsInMiddle);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoUnisonsInMiddle])).not.toContain(RuleIdEnum.NoUnisonsInMiddle);
    });

    it('NoVoiceCrossing - CP dips below CF', () => {
      const cf = [new Note("G", 4), new Note("A", 4), new Note("G", 4)];
      const cp = [new Note("G", 5), new Note("C", 4), new Note("G", 5), new Note("G", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoVoiceCrossing);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoVoiceCrossing])).not.toContain(RuleIdEnum.NoVoiceCrossing);
    });

    it('FinalCadence - final note not approached by step', () => {
      const cp = [...validCP];
      cp[cp.length - 1] = new Note("A", 3);
      expect(brokenIds(dorianCF, cp)).toContain(RuleIdEnum.FinalCadence);
      expect(brokenIds(dorianCF, cp, [RuleIdEnum.FinalCadence])).not.toContain(RuleIdEnum.FinalCadence);
    });

    it('NoExcessiveRepeatedNotes - immediate note repetition', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.NoExcessiveRepeatedNotes);
      expect(brokenIds(cf, cp, [RuleIdEnum.NoExcessiveRepeatedNotes])).not.toContain(RuleIdEnum.NoExcessiveRepeatedNotes);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: RuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    it('SameLength is an Error',                              () => expect(getRuleById(RuleIdEnum.SameLength).severity).toBe(Severity.Error));
    it('OnlyConsonantIntervals is an Error',                  () => expect(getRuleById(RuleIdEnum.OnlyConsonantIntervals).severity).toBe(Severity.Error));
    it('ValidBeginningInterval is an Error',                  () => expect(getRuleById(RuleIdEnum.ValidBeginningInterval).severity).toBe(Severity.Error));
    it('ValidEndingInterval is an Error',                     () => expect(getRuleById(RuleIdEnum.ValidEndingInterval).severity).toBe(Severity.Error));
    it('NoParallelFifths is an Error',                        () => expect(getRuleById(RuleIdEnum.NoParallelFifths).severity).toBe(Severity.Error));
    it('NoParallelOctaves is an Error',                       () => expect(getRuleById(RuleIdEnum.NoParallelOctaves).severity).toBe(Severity.Error));
    it('NoParallelUnisons is an Error',                       () => expect(getRuleById(RuleIdEnum.NoParallelUnisons).severity).toBe(Severity.Error));
    it('NoHiddenPerfectIntervals is an Error',                () => expect(getRuleById(RuleIdEnum.NoHiddenPerfectIntervals).severity).toBe(Severity.Error));
    it('NoAugmentedOrDiminishedMelodicIntervals is an Error', () => expect(getRuleById(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals).severity).toBe(Severity.Error));
    it('NoUnisonsInMiddle is an Error',                       () => expect(getRuleById(RuleIdEnum.NoUnisonsInMiddle).severity).toBe(Severity.Error));
    it('NoVoiceCrossing is an Error',                         () => expect(getRuleById(RuleIdEnum.NoVoiceCrossing).severity).toBe(Severity.Error));
    it('NoVoiceOverlap is an Error',                          () => expect(getRuleById(RuleIdEnum.NoVoiceOverlap).severity).toBe(Severity.Error));
    it('FinalCadence is a Warning',                           () => expect(getRuleById(RuleIdEnum.FinalCadence).severity).toBe(Severity.Warning));
    it('LargeLeapsRecoverCorrectly is a Warning',             () => expect(getRuleById(RuleIdEnum.LargeLeapsRecoverCorrectly).severity).toBe(Severity.Warning));
    it('CoincidingClimax is a Suggestion',                    () => expect(getRuleById(RuleIdEnum.CoincidingClimax).severity).toBe(Severity.Suggestion));
    it('NoExcessiveConsecutiveThirdsOrSixths is a Warning',   () => expect(getRuleById(RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths).severity).toBe(Severity.Warning));
    it('NoExcessiveRepeatedNotes is a Warning',               () => expect(getRuleById(RuleIdEnum.NoExcessiveRepeatedNotes).severity).toBe(Severity.Warning));
  });
});
