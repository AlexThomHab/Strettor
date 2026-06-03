import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';

// Fourth species: syncopated counterpoint creating suspensions.
// CP layout: cp[0] = opening, for i=1..N-2: cp[2i-1] = suspension vs cf[i], cp[2i] = resolution vs cf[i], cp[2N-3] = final.
// CP length = ((N-2)*2)+2.
describe('FourthSpeciesCounterpointValidator', () => {
  let validator: FourthSpeciesCounterpointValidator;

  // N=3 → CP needs 4 notes
  const cf3: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

  // Valid 7-6 suspension above:
  //   cp[0]=C5 (octave above C4, valid opening)
  //   cp[1]=C5 tied → suspension: C5 is a minor seventh above D4 (dissonant)
  //                    prepared by cp[0]=C5 (consonant octave above C4), same pitch ✓
  //   cp[2]=B4       → resolves down by step (C5→B4 = 1 semitone), B4 is a major sixth above D4 ✓
  //   cp[3]=C5       → final octave above C4 ✓
  const validCp7_6: Note[] = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];

  // Valid 4-3 suspension above CF=[C4, G4, C4]:
  //   cp[1]=C5 is a perfect fourth above G4 (dissonant), prepared by cp[0]=C5 (octave above C4)
  //   cp[2]=B4 resolves down by step, major third above G4 ✓
  const cf4_3: Note[] = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
  const validCp4_3: Note[] = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];

  beforeEach(() => {
    validator = new FourthSpeciesCounterpointValidator();
  });

  describe('valid integration', () => {
    it('accepts a valid 7-6 suspension above', () => {
      expect(validator.isValidSolution(cf3, validCp7_6, [])).toBe(true);
      expect(validator.getBrokenRules(cf3, validCp7_6)).toHaveLength(0);
    });

    it('accepts a valid 4-3 suspension above', () => {
      expect(validator.isValidSolution(cf4_3, validCp4_3, [])).toBe(true);
      expect(validator.getBrokenRules(cf4_3, validCp4_3)).toHaveLength(0);
    });
  });

  describe('checkCorrectLength', () => {
    it('returns false when CP is shorter than ((N-2)*2)+2', () => {
      const cp = [new Note("C", 5), new Note("B", 4)];
      expect(cp.length).toBeLessThan(((cf3.length - 2) * 2) + 2);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when CP is longer than ((N-2)*2)+2', () => {
      const cp = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("C", 5)];
      expect(cp.length).toBeGreaterThan(((cf3.length - 2) * 2) + 2);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns a boolean when CP has the correct length', () => {
      expect(validCp7_6.length).toBe(((cf3.length - 2) * 2) + 2);
      expect(typeof validator.isValidSolution(cf3, validCp7_6, [])).toBe('boolean');
    });
  });

  describe('checkDissonanceMustBePrepared', () => {
    it('returns false when the suspension note is a different pitch from the preparation note', () => {
      // cp[1]=C5 is dissonant (7th above D4) but cp[0]=G4 (different pitch) - not properly tied
      const cp = [new Note("G", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('accepts a consonant suspension that does not require preparation', () => {
      // cp[1]=A4 is a fifth above D4 (consonant) - preparation rule does not apply
      const cp = [new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5)];
      expect(validator.getBrokenRules(cf3, cp).map(r => r.id)).not.toContain(300);
    });
  });

  describe('checkDissonanceMustResolveDownByStep', () => {
    it('returns false when a dissonant suspension resolves by a leap (3 semitones)', () => {
      // C5 seventh above D4 → A4 is 3 semitones down, not a step
      const cp = [new Note("C", 5), new Note("C", 5), new Note("A", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when a dissonant suspension does not move at all', () => {
      // C5 → C5: no resolution, stays on the dissonance
      const cp = [new Note("C", 5), new Note("C", 5), new Note("C", 5), new Note("C", 5)];
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNo7_8SuspensionInLowerVoice', () => {
    it('returns false when a lower voice forms a 7-8 suspension (seventh resolving to octave)', () => {
      // CF above, CP below. E4 is a minor seventh below D5, tied and resolving to D4 (octave below D5)
      const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      const cpBelow: Note[] = [new Note("E", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
      expect(validator.isValidSolution(cfAbove, cpBelow, [])).toBe(false);
    });
  });

  describe('checkValidBeginningInterval', () => {
    it('returns false when opening with a second', () => {
      const cp = [new Note("D", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      // D4 over C4 = major second (2) - not in [0, 3, 4, 7, 12]
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('allows opening with a third (unlike first species)', () => {
      // E4 over C4 = major third (4) - valid in fourth species
      const cp = [new Note("E", 4), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
      expect(validator.getBrokenRules(cf3, cp).map(r => r.id)).not.toContain(304);
    });
  });

  describe('checkValidEndingInterval', () => {
    it('returns false when ending on a fifth instead of unison or octave', () => {
      const cp = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("G", 4)];
      // G4 over C4 = fifth - must end on unison or octave
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkFinalCadence', () => {
    it('returns false when the final note is not approached by step', () => {
      // F4 to C5 = 7 semitones (perfect fifth) - not a step
      const cp = [new Note("G", 4), new Note("G", 4), new Note("F", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNoVoiceCrossing', () => {
    it('returns false when CP drops below CF', () => {
      const cfAbove: Note[] = [new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      const cpBelow: Note[] = [new Note("C", 4), new Note("C", 4), new Note("B", 3), new Note("C", 4)];
      // C4 < C5 at position 0
      expect(validator.isValidSolution(cfAbove, cpBelow, [])).toBe(false);
    });
  });

  describe('checkNoAugmentedOrDiminishedMelodicIntervals', () => {
    it('returns false when a tritone appears in the melodic line', () => {
      // B4 → F5 = 6 semitones (tritone)
      const cp = [new Note("C", 5), new Note("B", 4), new Note("F", 5), new Note("C", 5)];
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });
});
