import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Rule, Severity } from '../../models/rule';
import { RuleIdEnum } from '../../data/rules.data';

describe('FourthSpeciesCounterpointValidator - rule enabling/disabling', () => {
  let validator: FourthSpeciesCounterpointValidator;

  // Haydn Dorian CF (11 notes) → CP needs ((11-2)*2)+2 = 20 notes
  const dorainCF: Note[] = [
    new Note("D", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4),
    new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("G", 4),
    new Note("F", 4), new Note("E", 4), new Note("D", 4)
  ];

  // Fux's suspension exercise above the Haydn CF - all consonant suspensions, no 7-8, valid ending
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

  // N=3 CF for targeted per-rule tests
  const cantusFirmus3Note: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

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

    it('there are 11 rules defined', () => {
      const rules = (validator as any)._rules as Array<unknown>;
      expect(rules).toHaveLength(11);
    });
  });

  describe('isValidSolution', () => {
    it('passes Fux fourth species exercise with no disabled rules', () => {
      expect(validator.isValidSolution(dorainCF, fuxCp, [])).toBe(true);
    });

    it('disabling a rule does not affect a passing solution', () => {
      expect(validator.isValidSolution(dorainCF, fuxCp, [RuleIdEnum.S4_FinalCadence])).toBe(true);
    });
  });

  describe('S4_CorrectLength - always enforced', () => {
    it('rejects wrong-length CP even when rule is disabled', () => {
      const cp = [new Note("C", 5), new Note("B", 4)];
      expect(validator.isValidSolution(cantusFirmus3Note, cp, [RuleIdEnum.S4_CorrectLength])).toBe(false);
    });
  });

  describe('each rule fires and can be silenced individually', () => {
    it('S4_DissonanceMustBePrepared - suspension is a different pitch from preparation note', () => {
      const cp = [new Note("G", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_DissonanceMustBePrepared);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_DissonanceMustBePrepared])).not.toContain(RuleIdEnum.S4_DissonanceMustBePrepared);
    });

    it('S4_DissonanceMustResolveDownByStep - suspension resolves by leap (3 semitones)', () => {
      const cp = [new Note("C", 5), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_DissonanceMustResolveDownByStep);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_DissonanceMustResolveDownByStep])).not.toContain(RuleIdEnum.S4_DissonanceMustResolveDownByStep);
    });

    it('S4_No7_8SuspensionInLowerVoice - seventh resolving to octave in lower voice', () => {
      const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      const cpBelow: Note[] = [new Note("E", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
      expect(brokenIds(cfAbove, cpBelow)).toContain(RuleIdEnum.S4_No7_8SuspensionInLowerVoice);
      expect(brokenIds(cfAbove, cpBelow, [RuleIdEnum.S4_No7_8SuspensionInLowerVoice])).not.toContain(RuleIdEnum.S4_No7_8SuspensionInLowerVoice);
    });

    it('S4_ValidBeginningInterval - opening with a second', () => {
      const cp = [new Note("D", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_ValidBeginningInterval);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_ValidBeginningInterval])).not.toContain(RuleIdEnum.S4_ValidBeginningInterval);
    });

    it('S4_ValidEndingInterval - ending on a fifth', () => {
      const cp = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("G", 4)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_ValidEndingInterval);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_ValidEndingInterval])).not.toContain(RuleIdEnum.S4_ValidEndingInterval);
    });

    it('S4_NoVoiceCrossing - CP drops below CF', () => {
      const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      const cpBelow: Note[] = [new Note("C", 4), new Note("C", 4), new Note("B", 3), new Note("C", 4)];
      expect(brokenIds(cfAbove, cpBelow)).toContain(RuleIdEnum.S4_NoVoiceCrossing);
      expect(brokenIds(cfAbove, cpBelow, [RuleIdEnum.S4_NoVoiceCrossing])).not.toContain(RuleIdEnum.S4_NoVoiceCrossing);
    });

    it('S4_NoAugmentedOrDiminishedMelodicIntervals - tritone in the melodic line', () => {
      const cp = [new Note("C", 5), new Note("B", 4), new Note("F", 5), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('S4_FinalCadence - final note not approached by step', () => {
      const cp = [new Note("G", 4), new Note("G", 4), new Note("F", 4), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_FinalCadence);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_FinalCadence])).not.toContain(RuleIdEnum.S4_FinalCadence);
    });

    it('S4_Avoid9_8Suspensions - ninth resolving to octave', () => {
      const cp = [new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5)];
      expect(brokenIds(cantusFirmus3Note, cp)).toContain(RuleIdEnum.S4_Avoid9_8Suspensions);
      expect(brokenIds(cantusFirmus3Note, cp, [RuleIdEnum.S4_Avoid9_8Suspensions])).not.toContain(RuleIdEnum.S4_Avoid9_8Suspensions);
    });

    it('S4_CoincidingClimax - CP and CF both peak at the same index', () => {
      const cfPeak: Note[] = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      const cpPeak: Note[] = [new Note("C", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5)];
      expect(brokenIds(cfPeak, cpPeak)).toContain(RuleIdEnum.S4_CoincidingClimax);
      expect(brokenIds(cfPeak, cpPeak, [RuleIdEnum.S4_CoincidingClimax])).not.toContain(RuleIdEnum.S4_CoincidingClimax);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: RuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    it('S4_CorrectLength is an Error',                              () => expect(getRuleById(RuleIdEnum.S4_CorrectLength).severity).toBe(Severity.Error));
    it('S4_DissonanceMustBePrepared is an Error',                   () => expect(getRuleById(RuleIdEnum.S4_DissonanceMustBePrepared).severity).toBe(Severity.Error));
    it('S4_DissonanceMustResolveDownByStep is an Error',            () => expect(getRuleById(RuleIdEnum.S4_DissonanceMustResolveDownByStep).severity).toBe(Severity.Error));
    it('S4_No7_8SuspensionInLowerVoice is an Error',                () => expect(getRuleById(RuleIdEnum.S4_No7_8SuspensionInLowerVoice).severity).toBe(Severity.Error));
    it('S4_ValidBeginningInterval is an Error',                     () => expect(getRuleById(RuleIdEnum.S4_ValidBeginningInterval).severity).toBe(Severity.Error));
    it('S4_ValidEndingInterval is an Error',                        () => expect(getRuleById(RuleIdEnum.S4_ValidEndingInterval).severity).toBe(Severity.Error));
    it('S4_NoVoiceCrossing is an Error',                            () => expect(getRuleById(RuleIdEnum.S4_NoVoiceCrossing).severity).toBe(Severity.Error));
    it('S4_NoAugmentedOrDiminishedMelodicIntervals is an Error',    () => expect(getRuleById(RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals).severity).toBe(Severity.Error));
    it('S4_FinalCadence is a Warning',                              () => expect(getRuleById(RuleIdEnum.S4_FinalCadence).severity).toBe(Severity.Warning));
    it('S4_Avoid9_8Suspensions is a Warning',                       () => expect(getRuleById(RuleIdEnum.S4_Avoid9_8Suspensions).severity).toBe(Severity.Warning));
    it('S4_CoincidingClimax is a Suggestion',                       () => expect(getRuleById(RuleIdEnum.S4_CoincidingClimax).severity).toBe(Severity.Suggestion));
  });
});
