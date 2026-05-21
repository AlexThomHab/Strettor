import {describe, it, expect, beforeEach} from 'vitest';
import {CounterpointValidator} from './CounterpointValidator';
import {Note} from '../models/note';
import {Rule, FirstSpeciesRuleIdEnum, Severity} from '../models/rule';

describe('CounterpointValidator — rule enabling/disabling', () => {
  let validator: CounterpointValidator;

  // A known-valid solution (D Dorian)
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

  // Identical CF and CP — violates: NoParallelUnisons, NoUnisonsInMiddle, NoVoiceOverlap, CoincidingClimax
  const unisonCF: Note[] = [new Note("C", 4), new Note("D", 4), new Note("E", 4)];
  const unisonCP: Note[] = [new Note("C", 4), new Note("D", 4), new Note("E", 4)];
  const unisonViolations = [
    FirstSpeciesRuleIdEnum.NoParallelUnisons,
    FirstSpeciesRuleIdEnum.NoUnisonsInMiddle,
    FirstSpeciesRuleIdEnum.NoVoiceOverlap,
    FirstSpeciesRuleIdEnum.CoincidingClimax,
  ];

  beforeEach(() => {
    validator = new CounterpointValidator();
  });

  // Returns the ids of every broken rule for a given CF/CP pair
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

    it('fails an invalid solution with no disabled rules', () => {
      expect(validator.isValidSolution(unisonCF, unisonCP, [])).toBe(false);
    });

    it('passes when every violated rule is disabled', () => {
      expect(validator.isValidSolution(unisonCF, unisonCP, unisonViolations)).toBe(true);
    });

    it('still fails when only some violated rules are disabled', () => {
      expect(validator.isValidSolution(unisonCF, unisonCP, [FirstSpeciesRuleIdEnum.CoincidingClimax])).toBe(false);
    });

    it('disabling an irrelevant rule has no effect', () => {
      expect(validator.isValidSolution(unisonCF, unisonCP, [FirstSpeciesRuleIdEnum.NoParallelFifths])).toBe(false);
    });

    it('disabling a rule does not affect a passing solution', () => {
      expect(validator.isValidSolution(dorianCF, validCP, [FirstSpeciesRuleIdEnum.NoParallelFifths])).toBe(true);
    });
  });

  describe('disabling specific rules by RuleId', () => {
    it('NoParallelUnisons — violation ignored when disabled', () => {
      const others = [FirstSpeciesRuleIdEnum.NoUnisonsInMiddle, FirstSpeciesRuleIdEnum.NoVoiceOverlap, FirstSpeciesRuleIdEnum.CoincidingClimax];
      expect(validator.isValidSolution(unisonCF, unisonCP, others)).toBe(false);
      expect(validator.isValidSolution(unisonCF, unisonCP, [...others, FirstSpeciesRuleIdEnum.NoParallelUnisons])).toBe(true);
    });

    it('NoUnisonsInMiddle — violation ignored when disabled', () => {
      const others = [FirstSpeciesRuleIdEnum.NoParallelUnisons, FirstSpeciesRuleIdEnum.NoVoiceOverlap, FirstSpeciesRuleIdEnum.CoincidingClimax];
      expect(validator.isValidSolution(unisonCF, unisonCP, others)).toBe(false);
      expect(validator.isValidSolution(unisonCF, unisonCP, [...others, FirstSpeciesRuleIdEnum.NoUnisonsInMiddle])).toBe(true);
    });

    it('SameLength — mismatched lengths always blocked regardless of disabled rules', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("E", 5)];
      expect(validator.isValidSolution(cf, cp, [FirstSpeciesRuleIdEnum.SameLength])).toBe(false);
    });
  });

  describe('each rule fires and can be silenced individually', () => {
    it('OnlyConsonantIntervals — fourth at a middle position', () => {
      // D4 to G4 = 5 semitones (perfect fourth — dissonant in first species)
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("G", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.OnlyConsonantIntervals);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.OnlyConsonantIntervals])).not.toContain(FirstSpeciesRuleIdEnum.OnlyConsonantIntervals);
    });

    it('ValidBeginningInterval — major second above is not a valid opening', () => {
      // D4 over C4 = 2 semitones
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("D", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.ValidBeginningInterval);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.ValidBeginningInterval])).not.toContain(FirstSpeciesRuleIdEnum.ValidBeginningInterval);
    });

    it('ValidEndingInterval — ending on a perfect fifth is not allowed', () => {
      // G4 over C4 = 7 semitones
      const cf = [new Note("C", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("G", 4)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.ValidEndingInterval);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.ValidEndingInterval])).not.toContain(FirstSpeciesRuleIdEnum.ValidEndingInterval);
    });

    it('NoParallelFifths — two consecutive fifths moving in the same direction', () => {
      // C4/G4 = 7, D4/A4 = 7, both up
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("G", 4), new Note("A", 4), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoParallelFifths);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoParallelFifths])).not.toContain(FirstSpeciesRuleIdEnum.NoParallelFifths);
    });

    it('NoParallelOctaves — two consecutive octaves moving in the same direction', () => {
      // C4/C5 = 12, D4/D5 = 12, both up
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("D", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoParallelOctaves);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoParallelOctaves])).not.toContain(FirstSpeciesRuleIdEnum.NoParallelOctaves);
    });

    it('NoHiddenPerfectIntervals — leaping to a perfect fifth by direct motion', () => {
      // G4→C5 is a leap (5 semitones); F4/C5 = 7 (perfect fifth); both voices move up
      const cf = [new Note("C", 4), new Note("F", 4), new Note("C", 4)];
      const cp = [new Note("G", 4), new Note("C", 5), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoHiddenPerfectIntervals);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoHiddenPerfectIntervals])).not.toContain(FirstSpeciesRuleIdEnum.NoHiddenPerfectIntervals);
    });

    it('NoAugmentedOrDiminishedMelodicIntervals — tritone leap (6 semitones)', () => {
      // C4 to F#4 = 6 semitones
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("F#", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('NoAugmentedOrDiminishedMelodicIntervals — minor seventh leap (10 semitones)', () => {
      // C4 to A#4 = 10 semitones
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("A#", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals])).not.toContain(FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
    });

    it('NoUnisonsInMiddle — unison at an inner position', () => {
      // E4/E4 = 0 at index 1
      const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("E", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoUnisonsInMiddle);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoUnisonsInMiddle])).not.toContain(FirstSpeciesRuleIdEnum.NoUnisonsInMiddle);
    });

    it('NoVoiceCrossing — counterpoint dips below cantus firmus', () => {
      // F4 (53) < G4 (55) at index 1
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("F", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoVoiceCrossing);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoVoiceCrossing])).not.toContain(FirstSpeciesRuleIdEnum.NoVoiceCrossing);
    });

    it('NoVoiceOverlap — cantus firmus leaps above where counterpoint just was', () => {
      // cfNext G4 (55) > cpCurrent E4 (52)
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("A", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoVoiceOverlap);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoVoiceOverlap])).not.toContain(FirstSpeciesRuleIdEnum.NoVoiceOverlap);
    });

    it('FinalCadence — final note approached by a leap', () => {
      // E4 → C5 = 8 semitones
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 4), new Note("E", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.FinalCadence);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.FinalCadence])).not.toContain(FirstSpeciesRuleIdEnum.FinalCadence);
    });

    it('LargeLeapsRecoverCorrectly — large leap followed by a step in the same direction', () => {
      // E4→A4 = 9 (large leap up), A4→B4 = 2 (step up — same direction as leap)
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.LargeLeapsRecoverCorrectly);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.LargeLeapsRecoverCorrectly])).not.toContain(FirstSpeciesRuleIdEnum.LargeLeapsRecoverCorrectly);
    });

    it('CoincidingClimax — both voices peak at the same index', () => {
      // CF max at G4 (idx 1), CP max at D5 (idx 1) — same position
      const cf = [new Note("C", 4), new Note("G", 4), new Note("E", 4)];
      const cp = [new Note("E", 4), new Note("D", 5), new Note("A", 4)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.CoincidingClimax);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.CoincidingClimax])).not.toContain(FirstSpeciesRuleIdEnum.CoincidingClimax);
    });

    it('NoExcessiveConsecutiveThirdsOrSixths — four consecutive thirds', () => {
      // intervals: 4, 3, 3, 4, 12 — four thirds in a row then an octave
      const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths])).not.toContain(FirstSpeciesRuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths);
    });

    it('NoExcessiveRepeatedNotes — same note on consecutive beats', () => {
      // E4 appears twice in a row
      const cf = [new Note("C", 4), new Note("C", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("E", 4), new Note("C", 5)];
      expect(brokenIds(cf, cp)).toContain(FirstSpeciesRuleIdEnum.NoExcessiveRepeatedNotes);
      expect(brokenIds(cf, cp, [FirstSpeciesRuleIdEnum.NoExcessiveRepeatedNotes])).not.toContain(FirstSpeciesRuleIdEnum.NoExcessiveRepeatedNotes);
    });
  });

  describe('rule severity', () => {
    const getRuleById = (id: FirstSpeciesRuleIdEnum): Rule => {
      const rules = (validator as any)._rules as Array<{ rule: Rule }>;
      return rules.find(r => r.rule.id === id)!.rule;
    };

    it('SameLength is an Error',                              () => expect(getRuleById(FirstSpeciesRuleIdEnum.SameLength).severity).toBe(Severity.Error));
    it('OnlyConsonantIntervals is an Error',                  () => expect(getRuleById(FirstSpeciesRuleIdEnum.OnlyConsonantIntervals).severity).toBe(Severity.Error));
    it('ValidBeginningInterval is an Error',                  () => expect(getRuleById(FirstSpeciesRuleIdEnum.ValidBeginningInterval).severity).toBe(Severity.Error));
    it('ValidEndingInterval is an Error',                     () => expect(getRuleById(FirstSpeciesRuleIdEnum.ValidEndingInterval).severity).toBe(Severity.Error));
    it('NoParallelFifths is an Error',                        () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoParallelFifths).severity).toBe(Severity.Error));
    it('NoParallelOctaves is an Error',                       () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoParallelOctaves).severity).toBe(Severity.Error));
    it('NoParallelUnisons is an Error',                       () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoParallelUnisons).severity).toBe(Severity.Error));
    it('NoHiddenPerfectIntervals is an Error',                () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoHiddenPerfectIntervals).severity).toBe(Severity.Error));
    it('NoAugmentedOrDiminishedMelodicIntervals is an Error', () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals).severity).toBe(Severity.Error));
    it('NoUnisonsInMiddle is an Error',                       () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoUnisonsInMiddle).severity).toBe(Severity.Error));
    it('NoVoiceCrossing is an Error',                         () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoVoiceCrossing).severity).toBe(Severity.Error));
    it('NoVoiceOverlap is an Error',                          () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoVoiceOverlap).severity).toBe(Severity.Error));
    it('FinalCadence is a Warning',                           () => expect(getRuleById(FirstSpeciesRuleIdEnum.FinalCadence).severity).toBe(Severity.Warning));
    it('LargeLeapsRecoverCorrectly is a Warning',             () => expect(getRuleById(FirstSpeciesRuleIdEnum.LargeLeapsRecoverCorrectly).severity).toBe(Severity.Warning));
    it('CoincidingClimax is a Warning',                       () => expect(getRuleById(FirstSpeciesRuleIdEnum.CoincidingClimax).severity).toBe(Severity.Warning));
    it('NoExcessiveConsecutiveThirdsOrSixths is a Warning',   () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths).severity).toBe(Severity.Warning));
    it('NoExcessiveRepeatedNotes is a Warning',               () => expect(getRuleById(FirstSpeciesRuleIdEnum.NoExcessiveRepeatedNotes).severity).toBe(Severity.Warning));
  });
});
