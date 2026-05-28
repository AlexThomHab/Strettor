import {describe, it, expect, beforeEach} from 'vitest';
import {Note} from '../../models/note';
import {Rule, Severity} from '../../models/rule';
import {RuleIdEnum} from '../../data/rules.data';
import {SecondSpeciesCounterpointValidator} from './SecondSpeciesCounterpointValidator';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';

describe('SecondSpeciesCounterpointValidator - rule enabling/disabling', () => {
  let validator: SecondSpeciesCounterpointValidator;

  const dorianCF = CANTUS_FIRMUS_LIST[0]

  // 19-note CP (2*10-1): downbeats at even indices, upbeats at odd
  const fuxsValidCp: Note[] = [
    new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("D", 5),
    new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("A", 4),

    new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("B", 4),
    new Note("D", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5),
    new Note("D", 5),
  ];

  // CF: C4 D4 C4 (3 notes) -> CP needs 5 notes
  const badCF: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
  const badCP: Note[] = [
    new Note("C", 5), new Note("C", 5),
    new Note("D", 4), new Note("C", 5),
    new Note("C", 5)
  ];
  const disabledViolations = [
    RuleIdEnum.S2_NoToneRepetition,
    RuleIdEnum.S2_UnisonsOnlyOnUpbeats,
    RuleIdEnum.S2_CoincidingClimax,
    RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats,
    RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats,
    RuleIdEnum.S2_NoExcessivePitchRepetition,
    RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals,
    RuleIdEnum.S2_DissonantUpbeatMustBePassingTone,
    RuleIdEnum.S2_LargeLeapsRecoverCorrectly,

  ];

  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();
  });

  const brokenIds = (cf: Note[], cp: Note[], disabled: number[] = []) =>
    validator.getBrokenRules(cf, cp, disabled).map(r => r.id);

  describe('default rule state', () => {
    it('every rule has a numeric id', () => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      rules.forEach(r => expect(typeof r.rule.id).toBe('number'));
    });

    it('there are 21 rules defined', () => {
      const rules = (validator as any)._rules as Array<unknown>;
      expect(rules).toHaveLength(22);
    });
  });

  describe('isValidSolution', () => {
    it('passes a valid solution with no disabled rules', () => {
      expect(validator.isValidSolution(dorianCF, fuxsValidCp, [])).toBe(true);
    });

    it('fails an invalid solution with no disabled rules', () => {
      expect(validator.isValidSolution(badCF, badCP, [])).toBe(false);
    });

    it('passes when every violated rule is disabled', () => {
      expect(validator.isValidSolution(badCF, badCP, disabledViolations)).toBe(true);
    });

    it('still fails when only some violated rules are disabled', () => {
      expect(validator.isValidSolution(badCF, badCP, [RuleIdEnum.S2_NoToneRepetition])).toBe(false);
    });

    it('disabling an irrelevant rule has no effect on a failing solution', () => {
      expect(validator.isValidSolution(badCF, badCP, [RuleIdEnum.S2_FinalCadence])).toBe(false);
    });

    it('disabling a rule does not affect a passing solution', () => {
      expect(validator.isValidSolution(dorianCF, fuxsValidCp, [RuleIdEnum.S2_FinalCadence])).toBe(true);
    });
  });

  describe('S2_CorrectLength - always enforced', () => {
    it('rejects when CP is too short regardless of disabled rules', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [RuleIdEnum.S2_CorrectLength])).toBe(false);
    });

    it('rejects when CP is too long', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('each rule fires and can be silenced individually', () => {
    it('S2_DownbeatConsonance - fourth on a downbeat', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("F", 4), new Note("B", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_DownbeatConsonance);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_DownbeatConsonance])).not.toContain(RuleIdEnum.S2_DownbeatConsonance);
    });

    it('S2_ValidEndingInterval - ending on a fifth is not allowed', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("A", 4)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_ValidEndingInterval);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_ValidEndingInterval])).not.toContain(RuleIdEnum.S2_ValidEndingInterval);
    });

    it('S2_NoParallelFifthsBetweenDownbeats - consecutive downbeat fifths in same direction', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("G", 4), new Note("A", 4), new Note("A", 4), new Note("G", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoParallelFifthsBetweenDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoParallelFifthsBetweenDownbeats])).not.toContain(RuleIdEnum.S2_NoParallelFifthsBetweenDownbeats);
    });

    it('S2_NoParallelOctavesBetweenDownbeats - consecutive downbeat octaves in same direction', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("D", 5), new Note("C", 5), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats])).not.toContain(RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats);
    });

    it('S2_NoParallelFifthsUpbeatToDownbeat - fifth on upbeat then fifth on next downbeat same direction', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat])).not.toContain(RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat);
    });

    it('S2_NoParallelOctavesUpbeatToDownbeat - octave on upbeat then octave on next downbeat same direction', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("G", 4), new Note("C", 5), new Note("D", 5), new Note("C", 5), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoParallelOctavesUpbeatToDownbeat);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoParallelOctavesUpbeatToDownbeat])).not.toContain(RuleIdEnum.S2_NoParallelOctavesUpbeatToDownbeat);
    });

    it('S2_NoDirectMotionToPerfectOnDownbeats - both voices move into a fifth by direct motion', () => {
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("C", 5), new Note("G", 4)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats])).not.toContain(RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats);
    });

    it('S2_DissonantUpbeatMustBePassingTone - dissonant upbeat approached and left in opposite directions', () => {
      const cf = [new Note("C", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_DissonantUpbeatMustBePassingTone])).not.toContain(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone);
    });

    it('S2_NoToneRepetition - consecutive repeated note', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("C", 5), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoToneRepetition);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoToneRepetition])).not.toContain(RuleIdEnum.S2_NoToneRepetition);
    });

    it('S2_NoDissonantOutlineBetweenDownbeats - tritone outlined across adjacent downbeats', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 3), new Note("B", 4), new Note("E", 4), new Note("F", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats])).not.toContain(RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats);
    });

    it('S2_NoAugmentedOrDiminishedMelodicIntervals - tritone leap', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("F#", 4), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('S2_NoVoiceCrossing - counterpoint dips below cantus firmus', () => {
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 3), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoVoiceCrossing);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoVoiceCrossing])).not.toContain(RuleIdEnum.S2_NoVoiceCrossing);
    });

    it('S2_NoVoiceOverlap - CF next note leaps above current CP downbeat', () => {
      const cp = [new Note("E", 4), new Note("F", 4), new Note("F", 4), new Note("G", 4), new Note("C", 5)];
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoVoiceOverlap);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoVoiceOverlap])).not.toContain(RuleIdEnum.S2_NoVoiceOverlap);
    });

    it('S2_UnisonsOnlyOnUpbeats - unison on an inner downbeat', () => {
      const cp = [new Note("C", 5), new Note("D", 5), new Note("E", 4), new Note("D", 4), new Note("C", 5)];
      const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_UnisonsOnlyOnUpbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_UnisonsOnlyOnUpbeats])).not.toContain(RuleIdEnum.S2_UnisonsOnlyOnUpbeats);
    });

    it('S2_LargeLeapsRecoverCorrectly - large leap followed by step in same direction', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("G", 4), new Note("D", 5), new Note("E", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_LargeLeapsRecoverCorrectly);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_LargeLeapsRecoverCorrectly])).not.toContain(RuleIdEnum.S2_LargeLeapsRecoverCorrectly);
    });

    it('S2_FinalCadence - final note approached by a leap', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("A", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_FinalCadence);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_FinalCadence])).not.toContain(RuleIdEnum.S2_FinalCadence);
    });

    it('S2_CoincidingClimax - both voices peak at same downbeat index', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("E", 5), new Note("D", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_CoincidingClimax);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_CoincidingClimax])).not.toContain(RuleIdEnum.S2_CoincidingClimax);
    });

    it('S2_NoExcessiveConsecutiveThirdsOrSixths - four consecutive thirds on downbeats', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 4)];
      const cp = [
        new Note("E", 4), new Note("D", 4),
        new Note("F", 4), new Note("E", 4),
        new Note("G", 4), new Note("F", 4),
        new Note("A", 4), new Note("G", 4),
        new Note("C", 5)
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoExcessiveConsecutiveThirdsOrSixths);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoExcessiveConsecutiveThirdsOrSixths])).not.toContain(RuleIdEnum.S2_NoExcessiveConsecutiveThirdsOrSixths);
    });

    it('S2_NoExcessivePitchRepetition - one pitch exceeds a third of the counterpoint', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S2_NoExcessivePitchRepetition);
      expect(brokenIds(cf, cp, [RuleIdEnum.S2_NoExcessivePitchRepetition])).not.toContain(RuleIdEnum.S2_NoExcessivePitchRepetition);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: RuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    describe('Second species rule severities', () => {
      it('S2_CorrectLength is an Error', () => expect(getRuleById(RuleIdEnum.S2_CorrectLength).severity).toBe(Severity.Error));
      it('S2_DownbeatConsonance is an Error', () => expect(getRuleById(RuleIdEnum.S2_DownbeatConsonance).severity).toBe(Severity.Error));
      it('S2_ValidBeginningInterval is an Error', () => expect(getRuleById(RuleIdEnum.S2_ValidBeginningInterval).severity).toBe(Severity.Error));
      it('S2_ValidEndingInterval is an Error', () => expect(getRuleById(RuleIdEnum.S2_ValidEndingInterval).severity).toBe(Severity.Error));

      it('S2_NoParallelFifthsBetweenDownbeats is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoParallelFifthsBetweenDownbeats).severity).toBe(Severity.Error));
      it('S2_NoParallelOctavesBetweenDownbeats is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats).severity).toBe(Severity.Error));
      it('S2_NoParallelFifthsUpbeatToDownbeat is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat).severity).toBe(Severity.Error));
      it('S2_NoParallelOctavesUpbeatToDownbeat is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoParallelOctavesUpbeatToDownbeat).severity).toBe(Severity.Error));
      it('S2_NoDirectMotionToPerfectOnDownbeats is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats).severity).toBe(Severity.Error));

      it('S2_DissonantUpbeatMustBePassingTone is an Error', () => expect(getRuleById(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone).severity).toBe(Severity.Error));
      it('S2_NoToneRepetition is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoToneRepetition).severity).toBe(Severity.Error));
      it('S2_NoDissonantOutlineBetweenDownbeats is a Suggestion', () => expect(getRuleById(RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats).severity).toBe(Severity.Suggestion));
      it('S2_NoAugmentedOrDiminishedMelodicIntervals is a Warning', () => expect(getRuleById(RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals).severity).toBe(Severity.Warning));

      it('S2_NoVoiceCrossing is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoVoiceCrossing).severity).toBe(Severity.Error));
      it('S2_NoVoiceOverlap is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoVoiceOverlap).severity).toBe(Severity.Error));
      it('S2_UnisonsOnlyOnUpbeats is an Error', () => expect(getRuleById(RuleIdEnum.S2_UnisonsOnlyOnUpbeats).severity).toBe(Severity.Error));

      it('S2_LargeLeapsRecoverCorrectly is a Suggestion', () => expect(getRuleById(RuleIdEnum.S2_LargeLeapsRecoverCorrectly).severity).toBe(Severity.Suggestion));
      it('S2_FinalCadence is an Error', () => expect(getRuleById(RuleIdEnum.S2_FinalCadence).severity).toBe(Severity.Error));
      it('S2_CoincidingClimax is a Suggestion', () => expect(getRuleById(RuleIdEnum.S2_CoincidingClimax).severity).toBe(Severity.Suggestion));
      it('S2_NoExcessiveConsecutiveThirdsOrSixths is a Warning', () => expect(getRuleById(RuleIdEnum.S2_NoExcessiveConsecutiveThirdsOrSixths).severity).toBe(Severity.Warning));
      it('S2_NoExcessivePitchRepetition is a Warning', () => expect(getRuleById(RuleIdEnum.S2_NoExcessivePitchRepetition).severity).toBe(Severity.Warning));

      it('S2_NoParallelUnionsOnConsecutiveDownbeats is an Error', () => expect(getRuleById(RuleIdEnum.S2_NoParallelUnionsOnConsecutiveDownbeats).severity).toBe(Severity.Error));
    });
  })
})
