import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Severity } from '../../models/rule';
import { RuleIdEnum } from '../../data/rules.data';

// Fourth species CP length = ((N-2)*2)+2.
// For N=3: 4 notes. For N=4: 6 notes. For N=10: 18 notes.
describe('FourthSpeciesCounterpointValidator - getBrokenRules', () => {
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

  it('flags SameLength when CP is wrong length', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("B", 4)]; // needs 4
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.SameLength);
    expect(brokenRules.find(r => r.id === RuleIdEnum.SameLength)?.severity).toBe(Severity.Error);
  });

  it('flags OnlyConsonantIntervals when a suspension tone is dissonant at its downbeat position', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("E", 4), new Note("B", 4), new Note("C", 5)];
    // E4 over D4 = major second — dissonant suspension not properly resolved
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.OnlyConsonantIntervals);
    expect(brokenRules.find(r => r.id === RuleIdEnum.OnlyConsonantIntervals)?.severity).toBe(Severity.Error);
  });

  it('flags ValidBeginningInterval when opening is a seventh (not unison/third/fifth/octave)', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("B", 4), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.ValidBeginningInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.ValidBeginningInterval)?.severity).toBe(Severity.Error);
  });

  it('flags ValidEndingInterval when ending on a fifth instead of unison or octave', () => {
    const cp = [...validCP];
    cp[cp.length - 1] = new Note("A", 3);
    const brokenRules = validator.getBrokenRules(dorianCF, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.ValidEndingInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.ValidEndingInterval)?.severity).toBe(Severity.Error);
  });

  it('flags NoParallelFifths when consecutive fifths appear in the normalized form', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoParallelFifths);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoParallelFifths)?.severity).toBe(Severity.Error);
  });

  it('flags NoParallelOctaves when consecutive octaves appear in the normalized form', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoParallelOctaves);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoParallelOctaves)?.severity).toBe(Severity.Error);
  });

  it('flags NoParallelUnisons when consecutive unisons appear', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoParallelUnisons);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoParallelUnisons)?.severity).toBe(Severity.Error);
  });

  it('flags NoAugmentedOrDiminishedMelodicIntervals for a tritone leap in the melodic line', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("F#", 4), new Note("C", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals)?.severity).toBe(Severity.Error);
  });

  it('flags NoUnisonsInMiddle when a unison falls on an inner position', () => {
    const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("E", 4), new Note("C", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoUnisonsInMiddle);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoUnisonsInMiddle)?.severity).toBe(Severity.Error);
  });

  it('flags NoVoiceCrossing when CP drops below CF', () => {
    const cf = [new Note("G", 4), new Note("A", 4), new Note("G", 4)];
    const cp = [new Note("G", 5), new Note("C", 4), new Note("G", 5), new Note("G", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoVoiceCrossing);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoVoiceCrossing)?.severity).toBe(Severity.Error);
  });

  it('flags FinalCadence (Warning) when final note is not approached by step', () => {
    const cp = [...validCP];
    cp[cp.length - 1] = new Note("A", 3);
    const brokenRules = validator.getBrokenRules(dorianCF, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.FinalCadence);
    expect(brokenRules.find(r => r.id === RuleIdEnum.FinalCadence)?.severity).toBe(Severity.Warning);
  });

  it('flags LargeLeapsRecoverCorrectly (Warning) for a large leap not followed by step in opposite direction', () => {
    const cp = [...validCP];
    cp[4] = new Note("C", 5); // C5→E4 = large leap down, then E4→D4 same direction
    const brokenRules = validator.getBrokenRules(dorianCF, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.LargeLeapsRecoverCorrectly);
    expect(brokenRules.find(r => r.id === RuleIdEnum.LargeLeapsRecoverCorrectly)?.severity).toBe(Severity.Warning);
  });

  it('flags NoExcessiveConsecutiveThirdsOrSixths (Warning) for 4+ consecutive thirds', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 4)];
    const cp = [
      new Note("E", 4), new Note("F", 4),
      new Note("F", 4), new Note("G", 4),
      new Note("G", 4), new Note("A", 4),
      new Note("A", 4), new Note("C", 5)
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths);
    expect(brokenRules.find(r => r.id === RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths)?.severity).toBe(Severity.Warning);
  });

  it('flags NoExcessiveRepeatedNotes for an immediate note repetition', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.NoExcessiveRepeatedNotes);
  });

  it('can return multiple broken rules simultaneously', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("B", 4), new Note("B", 4), new Note("B", 4), new Note("G", 4)];
    expect(validator.getBrokenRules(cf, cp).length).toBeGreaterThan(1);
  });
});
