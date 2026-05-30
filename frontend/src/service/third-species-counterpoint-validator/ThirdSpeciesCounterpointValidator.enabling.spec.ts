import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note';
import { Rule, Severity } from '../../models/rule';
import { RuleIdEnum } from '../../data/rules.data';
import { ThirdSpeciesCounterpointValidator } from './ThirdSpeciesCounterpointValidator';

describe('ThirdSpeciesCounterpointValidator - rule enabling/disabling', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  // CF 3 notes → CP 9 notes
  const cf3: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

  // Known-valid CP
  const validCp: Note[] = [
    new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
    new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5),
  ];

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

  const brokenIds = (cf: Note[], cp: Note[], disabled: number[] = []) =>
    validator.getBrokenRules(cf, cp, disabled).map(r => r.id);



  describe('default rule state', () => {
    it('every rule has a numeric id', () => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      rules.forEach(r => expect(typeof r.rule.id).toBe('number'));
    });

    it('there are 20 rules defined', () => {
      const rules = (validator as any)._rules as Array<unknown>;
      expect(rules).toHaveLength(20);
    });
  });

  describe('isValidSolution', () => {
    it('passes a valid solution with no disabled rules', () => {
      expect(validator.isValidSolution(cf3, validCp, [])).toBe(true);
    });

    it('disabling a rule does not affect a passing solution', () => {
      expect(validator.isValidSolution(cf3, validCp, [RuleIdEnum.S3_FinalCadence])).toBe(true);
    });
  });

  describe('S3_CorrectLength - always enforced', () => {
    it('rejects when CP is too short even if rule is disabled', () => {
      const cp = [new Note("C", 5), new Note("B", 4)];
      expect(validator.isValidSolution(cf3, cp, [RuleIdEnum.S3_CorrectLength])).toBe(false);
    });

    it('rejects when CP is too long', () => {
      const cp = Array(12).fill(new Note("C", 5));
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('each rule fires and can be silenced individually', () => {
    it('S3_DownbeatConsonance - dissonant second on a downbeat', () => {
      const cp = [...validCp];
      cp[4] = new Note("E", 4); // major second above D4
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_DownbeatConsonance);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_DownbeatConsonance])).not.toContain(RuleIdEnum.S3_DownbeatConsonance);
    });

    it('S3_ValidBeginningInterval - third is not a valid opening', () => {
      const cp = [...validCp];
      cp[0] = new Note("E", 4); // major third
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_ValidBeginningInterval);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_ValidBeginningInterval])).not.toContain(RuleIdEnum.S3_ValidBeginningInterval);
    });

    it('S3_ValidEndingInterval - ending on a fifth is not allowed', () => {
      const cp = [...validCp];
      cp[8] = new Note("G", 4); // fifth above C4
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_ValidEndingInterval);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_ValidEndingInterval])).not.toContain(RuleIdEnum.S3_ValidEndingInterval);
    });

    it('S3_NoParallelFifthsBetweenDownbeats - downbeat fifths moving up', () => {
      const cp = [...validCp];
      cp[0] = new Note("G", 4);
      cp[4] = new Note("A", 4);
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats])).not.toContain(RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats);
    });

    it('S3_NoParallelOctavesBetweenDownbeats - downbeat octaves moving up', () => {
      const cp = [...validCp];
      cp[0] = new Note("C", 5);
      cp[4] = new Note("D", 5);
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats])).not.toContain(RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats);
    });

    it('S3_NoParallelFifthsBeat4ToDownbeat - beat-4 fifth then downbeat fifth in same direction', () => {
      const cp = [...validCp];
      cp[3] = new Note("G", 4);
      cp[4] = new Note("A", 4);
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat])).not.toContain(RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat);
    });

    it('S3_NoParallelOctavesBeat4ToDownbeat - beat-4 octave then downbeat octave in same direction', () => {
      const cp = [...validCp];
      cp[3] = new Note("C", 5);
      cp[4] = new Note("D", 5);
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat])).not.toContain(RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat);
    });

    it('S3_DissonancesMustBeNonHarmonic - off-beat dissonance not a passing tone', () => {
      const cp = [...validCp];
      cp[1] = new Note("D", 5); // dissonant ninth, direction changes → not PT
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_DissonancesMustBeNonHarmonic);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_DissonancesMustBeNonHarmonic])).not.toContain(RuleIdEnum.S3_DissonancesMustBeNonHarmonic);
    });

    it('S3_NoToneRepetition - immediate repeated note', () => {
      const cp = [...validCp];
      cp[1] = new Note("C", 5);
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoToneRepetition);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoToneRepetition])).not.toContain(RuleIdEnum.S3_NoToneRepetition);
    });

    it('S3_NoAugmentedOrDiminishedMelodicIntervals - tritone leap', () => {
      const cp = [...validCp];
      cp[3] = new Note("F", 4);
      cp[4] = new Note("B", 4); // F→B = tritone
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('S3_NoVoiceCrossing - CP dips below CF', () => {
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
        new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4),
        new Note("C", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_NoVoiceCrossing);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_NoVoiceCrossing])).not.toContain(RuleIdEnum.S3_NoVoiceCrossing);
    });

    it('S3_NoVoiceOverlap - CF next note leaps above current CP downbeat', () => {
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [
        new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4),
        new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4),
        new Note("C", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_NoVoiceOverlap);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_NoVoiceOverlap])).not.toContain(RuleIdEnum.S3_NoVoiceOverlap);
    });

    it('S3_NoUnisonsOnInnerDownbeats - unison on inner downbeat', () => {
      const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
        new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("B", 4),
        new Note("C", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_NoUnisonsOnInnerDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_NoUnisonsOnInnerDownbeats])).not.toContain(RuleIdEnum.S3_NoUnisonsOnInnerDownbeats);
    });

    it('S3_NoDirectMotionToPerfectOnDownbeats - direct motion into a fifth on a downbeat', () => {
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("C", 5),
        new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("A", 4),
        new Note("C", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats])).not.toContain(RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats);
    });

    it('S3_FinalCadence - final note approached by leap', () => {
      const cp = [...validCp];
      cp[7] = new Note("A", 4); // A4→C5 = 3 semitones, not a step
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_FinalCadence);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_FinalCadence])).not.toContain(RuleIdEnum.S3_FinalCadence);
    });

    it('S3_LargeLeapsRecoverCorrectly - large leap not recovered', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
        new Note("C", 5), new Note("G", 5), new Note("A", 5), new Note("G", 5),
        new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
        new Note("D", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_LargeLeapsRecoverCorrectly);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_LargeLeapsRecoverCorrectly])).not.toContain(RuleIdEnum.S3_LargeLeapsRecoverCorrectly);
    });

    it('S3_CoincidingClimax - CP and CF peak at the same downbeat index', () => {
      const cp = [...validCp];
      cp[4] = new Note("E", 5); // CF peaks at idx 1 (D4), CP downbeat max also at idx 1
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_CoincidingClimax);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_CoincidingClimax])).not.toContain(RuleIdEnum.S3_CoincidingClimax);
    });

    it('S3_NoExcessiveConsecutiveThirdsOrSixths - four consecutive thirds on downbeats', () => {
      const cf = [
        new Note("C", 4), new Note("D", 4), new Note("E", 4),
        new Note("F", 4), new Note("C", 4),
      ];
      const cp = [
        new Note("E", 4), new Note("D", 4), new Note("C", 4), new Note("D", 4),
        new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("E", 4),
        new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("F", 4),
        new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("G", 4),
        new Note("C", 5),
      ];
      expect(brokenIds(cf, cp)).toContain(RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths);
      expect(brokenIds(cf, cp, [RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths])).not.toContain(RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths);
    });

    it('S3_NoExcessivePitchRepetition - one pitch used more than a third of the time', () => {
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("B", 4),
        new Note("F", 4), new Note("C", 5), new Note("A", 4), new Note("C", 5),
        new Note("C", 5),
      ];
      expect(brokenIds(cf3, cp)).toContain(RuleIdEnum.S3_NoExcessivePitchRepetition);
      expect(brokenIds(cf3, cp, [RuleIdEnum.S3_NoExcessivePitchRepetition])).not.toContain(RuleIdEnum.S3_NoExcessivePitchRepetition);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: RuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    it('S3_CorrectLength is an Error',                              () => expect(getRuleById(RuleIdEnum.S3_CorrectLength).severity).toBe(Severity.Error));
    it('S3_DownbeatConsonance is an Error',                         () => expect(getRuleById(RuleIdEnum.S3_DownbeatConsonance).severity).toBe(Severity.Error));
    it('S3_ValidBeginningInterval is an Error',                     () => expect(getRuleById(RuleIdEnum.S3_ValidBeginningInterval).severity).toBe(Severity.Error));
    it('S3_ValidEndingInterval is an Error',                        () => expect(getRuleById(RuleIdEnum.S3_ValidEndingInterval).severity).toBe(Severity.Error));
    it('S3_NoParallelFifthsBetweenDownbeats is an Error',           () => expect(getRuleById(RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats).severity).toBe(Severity.Error));
    it('S3_NoParallelOctavesBetweenDownbeats is an Error',          () => expect(getRuleById(RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats).severity).toBe(Severity.Error));
    it('S3_NoParallelFifthsBeat4ToDownbeat is an Error',            () => expect(getRuleById(RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat).severity).toBe(Severity.Error));
    it('S3_NoParallelOctavesBeat4ToDownbeat is an Error',           () => expect(getRuleById(RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat).severity).toBe(Severity.Error));
    it('S3_DissonancesMustBeNonHarmonic is an Error',               () => expect(getRuleById(RuleIdEnum.S3_DissonancesMustBeNonHarmonic).severity).toBe(Severity.Error));
    it('S3_NoToneRepetition is an Error',                           () => expect(getRuleById(RuleIdEnum.S3_NoToneRepetition).severity).toBe(Severity.Error));
    it('S3_NoAugmentedOrDiminishedMelodicIntervals is an Error',    () => expect(getRuleById(RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals).severity).toBe(Severity.Error));
    it('S3_NoVoiceCrossing is an Error',                            () => expect(getRuleById(RuleIdEnum.S3_NoVoiceCrossing).severity).toBe(Severity.Error));
    it('S3_NoVoiceOverlap is an Error',                             () => expect(getRuleById(RuleIdEnum.S3_NoVoiceOverlap).severity).toBe(Severity.Error));
    it('S3_NoUnisonsOnInnerDownbeats is an Error',                  () => expect(getRuleById(RuleIdEnum.S3_NoUnisonsOnInnerDownbeats).severity).toBe(Severity.Error));
    it('S3_NoDirectMotionToPerfectOnDownbeats is an Error',         () => expect(getRuleById(RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats).severity).toBe(Severity.Error));
    it('S3_FinalCadence is a Warning',                              () => expect(getRuleById(RuleIdEnum.S3_FinalCadence).severity).toBe(Severity.Warning));
    it('S3_LargeLeapsRecoverCorrectly is a Suggestion',             () => expect(getRuleById(RuleIdEnum.S3_LargeLeapsRecoverCorrectly).severity).toBe(Severity.Suggestion));
    it('S3_CoincidingClimax is a Suggestion',                       () => expect(getRuleById(RuleIdEnum.S3_CoincidingClimax).severity).toBe(Severity.Suggestion));
    it('S3_NoExcessiveConsecutiveThirdsOrSixths is a Warning',      () => expect(getRuleById(RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths).severity).toBe(Severity.Warning));
    it('S3_NoExcessivePitchRepetition is a Warning',                () => expect(getRuleById(RuleIdEnum.S3_NoExcessivePitchRepetition).severity).toBe(Severity.Warning));
  });
});
