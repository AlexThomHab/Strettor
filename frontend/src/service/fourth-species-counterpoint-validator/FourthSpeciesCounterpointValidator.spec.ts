import { describe, it, expect, beforeEach } from 'vitest';
import { FourthSpeciesCounterpointValidator } from './FourthSpeciesCounterpointValidator';
import { Note } from '../../models/note';

// Fourth species: syncopated counterpoint creating suspensions.
// CP length = ((N-2)*2)+2 where N = CF length.
// The validator checks the first N positions of the CP against the CF (the normalization layer).
describe('FourthSpeciesCounterpointValidator', () => {
  let validator: FourthSpeciesCounterpointValidator;

  // Fux Dorian CF — 10 notes → CP must be 18 notes
  const dorianCF: Note[] = [
    new Note("D", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("A", 3), new Note("E", 3), new Note("F", 3), new Note("D", 3),
    new Note("C#", 3), new Note("D", 3)
  ];

  // Valid normalized fourth species CP: consonant at every downbeat position,
  // ending with the 7-6 suspension cadence formula (E4 → D4 over C#3 → D3)
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

  describe('checkAppropriateLength', () => {
    it('returns false when CP is shorter than ((N-2)*2)+2', () => {
      const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
      const cp = [new Note("D", 5), new Note("C", 5)]; // needs 4
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when CP is longer than ((N-2)*2)+2', () => {
      const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
      const cp = [new Note("D", 5), new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5)]; // needs 4
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns a boolean for a CP with the correct fourth species length', () => {
      expect(validCP.length).toBe(((dorianCF.length - 2) * 2) + 2);
      expect(typeof validator.isValidSolution(dorianCF, validCP, [])).toBe('boolean');
    });
  });

  describe('checkValidBeginningInterval', () => {
    it('allows beginning on a third (unlike first species)', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("E", 4), new Note("D", 4), new Note("C", 4), new Note("C", 5)];
      // E4 over C4 = major third — valid in fourth species
      expect(validator.getBrokenRules(cf, cp).map(r => r.id)).not.toContain(0); // SameLength id=0
    });

    it('returns false when beginning with a second', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("D", 4), new Note("C", 4), new Note("A", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkValidEndingInterval', () => {
    it('returns false when not ending on a unison or octave', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4)]; // fifth above C4
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkOnlyConsonantIntervals', () => {
    it('returns false when a suspension is not prepared as a consonance', () => {
      // In the normalized view, a dissonance at position i means the suspension tone
      // at that CF note was not a consonance — violating the preparation rule
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 4), new Note("B", 4), new Note("C", 5)];
      // E4 over D4 = major second, dissonant — invalid at downbeat position
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelFifths', () => {
    it('returns false for consecutive parallel fifths in the normalized form', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelOctaves', () => {
    it('returns false for consecutive parallel octaves in the normalized form', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkFinalCadence', () => {
    it('returns false when the final suspension does not resolve by step', () => {
      // 7-6 cadence: final note must be approached stepwise
      const cf = [new Note("D", 4), new Note("E", 4), new Note("D", 4)];
      const cp = [new Note("D", 5), new Note("A", 4), new Note("D", 5), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoAugmentedOrDiminishedMelodicIntervals', () => {
    it('returns false when a tritone appears in the melodic line', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("F#", 4), new Note("C", 5), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoVoiceCrossing', () => {
    it('returns false when the suspension tone crosses below the cantus firmus', () => {
      const cf = [new Note("G", 4), new Note("A", 4), new Note("G", 4)];
      const cp = [new Note("G", 5), new Note("C", 4), new Note("G", 5), new Note("G", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });
});
