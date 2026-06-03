import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';
import { Severity } from '../../models/rule';
import { RuleIdEnum } from '../../data/rules.data';

// CP layout: cp[0]=opening, cp[2i-1]=suspension vs cf[i], cp[2i]=resolution vs cf[i], cp[2N-3]=final
// N=3 → CP length 4. N=4 → CP length 6.
describe('FourthSpeciesCounterpointValidator - getBrokenRules', () => {
  let validator: FourthSpeciesCounterpointValidator;

  // N=3 base
  const cantusFirmus: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

  // Valid 7-6 suspension: C5 (7th above D4) prepared as C5 (octave above C4), resolves to B4 (6th above D4)
  const validCp: Note[] = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];

  beforeEach(() => {
    validator = new FourthSpeciesCounterpointValidator();
  });


  it('returns empty array for a valid 7-6 suspension exercise', () => {
    let result = validator.getBrokenRules(cantusFirmus, validCp);
    expect(result).toHaveLength(0);
  });

  it('flags S4_CorrectLength (Error) when CP is wrong length', () => {
    const cp = [new Note("C", 5), new Note("B", 4)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_CorrectLength);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_CorrectLength)?.severity).toBe(Severity.Error);
  });

  it('flags S4_DissonanceMustBePrepared (Error) when suspension is a different pitch from the previous note', () => {
    // cp[1]=C5 is a seventh above D4 (dissonant) but cp[0]=G4 - not the same pitch, no tie
    const cp = [new Note("G", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_DissonanceMustBePrepared);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_DissonanceMustBePrepared)?.severity).toBe(Severity.Error);
  });

  it('flags S4_DissonanceMustResolveDownByStep (Error) when suspension resolves by leap (3 semitones)', () => {
    // C5 (seventh above D4) → A4: 3 semitones down, not a step
    const cp = [new Note("C", 5), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_DissonanceMustResolveDownByStep);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_DissonanceMustResolveDownByStep)?.severity).toBe(Severity.Error);
  });

  it('flags S4_No7_8SuspensionInLowerVoice (Error) when lower voice uses a seventh resolving to an octave', () => {
    // E4 is a minor seventh below D5 - tied and resolving to D4 (octave below D5): 7-8 forbidden
    const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
    const cpBelow: Note[] = [new Note("E", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const brokenRules = validator.getBrokenRules(cfAbove, cpBelow);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_No7_8SuspensionInLowerVoice);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_No7_8SuspensionInLowerVoice)?.severity).toBe(Severity.Error);
  });

  it('flags S4_ValidBeginningInterval (Error) when opening with a second', () => {
    // D4 over C4 = major second (2) - not in [0, 3, 4, 7, 12]
    const cp = [new Note("D", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_ValidBeginningInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_ValidBeginningInterval)?.severity).toBe(Severity.Error);
  });

  it('flags S4_ValidEndingInterval (Error) when ending on a fifth instead of unison or octave', () => {
    const cp = [...validCp];
    cp[cp.length - 1] = new Note("G", 4); // fifth above C4
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_ValidEndingInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_ValidEndingInterval)?.severity).toBe(Severity.Error);
  });

  it('flags S4_NoVoiceCrossing (Error) when CP drops below CF', () => {
    const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
    const cpBelow: Note[] = [new Note("C", 4), new Note("C", 4), new Note("B", 3), new Note("C", 4)];
    const brokenRules = validator.getBrokenRules(cfAbove, cpBelow);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_NoVoiceCrossing);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_NoVoiceCrossing)?.severity).toBe(Severity.Error);
  });

  it('flags S4_NoAugmentedOrDiminishedMelodicIntervals (Error) for a tritone in the melodic line', () => {
    // B4 → F5 = 6 semitones (tritone)
    const cp = [new Note("C", 5), new Note("B", 4), new Note("F", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals)?.severity).toBe(Severity.Error);
  });

  it('flags S4_FinalCadence (Warning) when the final note is not approached by step', () => {
    // G4 → G4 consonant suspension, F4 resolution. F4 → C5 = 7 semitones (perfect fifth) - not a step
    const cp = [new Note("G", 4), new Note("G", 4), new Note("F", 4), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_FinalCadence);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_FinalCadence)?.severity).toBe(Severity.Warning);
  });

  it('flags S4_Avoid9_8Suspensions (Warning) when a ninth resolves to an octave', () => {
    // E5 is a major ninth above D4 (compound), tied and resolving down by step to D5 (octave above D4)
    // Preparation: E5 above C4 = compound major third (16) ✓
    const cp = [new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cantusFirmus, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_Avoid9_8Suspensions);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_Avoid9_8Suspensions)?.severity).toBe(Severity.Warning);
  });

  it('flags S4_CoincidingClimax (Suggestion) when CF and CP both peak at the same position', () => {
    // CF=[C4,E4,C4]: CF max = E4 at idx 1
    // CP=[C5,E5,D5,C5]: CP max = E5 at cp indexOf = 1 (suspension position against cf[1])
    const cfWithPeak: Note[] = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
    const cpWithPeak: Note[] = [new Note("C", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5)];
    const brokenRules = validator.getBrokenRules(cfWithPeak, cpWithPeak);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S4_CoincidingClimax);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S4_CoincidingClimax)?.severity).toBe(Severity.Suggestion);
  });

  it('can return multiple broken rules simultaneously', () => {
    const cp = [new Note("D", 4), new Note("D", 4), new Note("C", 5), new Note("A", 4)];
    expect(validator.getBrokenRules(cantusFirmus, cp).length).toBeGreaterThan(1);
  });
});
