import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note';
import { SecondSpeciesCounterpointValidator } from './SecondSpeciesCounterpointValidator';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';

describe('SecondSpeciesCounterpointValidator', () => {
  let validator: SecondSpeciesCounterpointValidator;

  const dorianCF = CANTUS_FIRMUS_LIST[0]

  const fuxsCounterpoint: Note[] = [
    new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("D", 5),
    new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("A", 4),

    new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("B", 4),
    new Note("D", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5),
    new Note("D", 5),
  ];
  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();
  });

  describe('valid second species integration', () => {
    it( 'returns true for valid Fux-style Dorian second species counterpoint', () => {
      const fuxsCounterpoint: Note[] = [
        new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("B", 4),
        new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("D", 5),
        new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("A", 4),

        new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("B", 4),
        new Note("D", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5),
        new Note("D", 5),
      ];

      expect(fuxsCounterpoint.length).toBe((dorianCF.length * 2) - 1);
      expect(validator.isValidSolution(dorianCF, fuxsCounterpoint, [])).toBe(true);
    });
  });

  describe('checkValidSecondSpeciesLength', () => {
    it('returns false when counterpoint is shorter than second species requires', () => {
      const cf = [
        new Note("D", 4),
        new Note("E", 4),
        new Note("F", 4)
      ];

      // Expected length is 5.
      const cp = [
        new Note("D", 5),
        new Note("C", 5),
        new Note("A", 4),
        new Note("B", 4)
      ];

      expect(cp.length).toBeLessThan((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when counterpoint is longer than second species requires', () => {
      const cf = [
        new Note("D", 4),
        new Note("E", 4),
        new Note("F", 4)
      ];

      // Expected length is 5.
      const cp = [
        new Note("D", 5),
        new Note("C", 5),
        new Note("A", 4),
        new Note("B", 4),
        new Note("C", 5),
        new Note("D", 5)
      ];

      expect(cp.length).toBeGreaterThan((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns a boolean when counterpoint has the correct second species length', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),
        new Note("B", 4),
        new Note("A", 4),
        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(typeof validator.isValidSolution(cf, cp, [])).toBe("boolean");
    });
  });

  describe('checkDownbeatsAreConsonant', () => {
    it('returns false when a dissonance appears on a downbeat', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat: octave above C, valid
        new Note("C", 5),

        // Upbeat
        new Note("B", 4),

        // Downbeat: E above D = second, invalid on a downbeat
        new Note("E", 4),

        // Upbeat
        new Note("F", 4),

        // Final
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkUpbeatDissonanceTreatment', () => {
    it('returns false when an upbeat dissonance is not approached and left by step in the same direction', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat: octave above C
        new Note("C", 5),

        // Upbeat: D above C = ninth, dissonant
        // It is not a passing tone because it does not pass stepwise in the same direction.
        new Note("D", 5),

        // Downbeat: A above D = fifth
        new Note("A", 4),

        // Upbeat
        new Note("F", 4),

        // Final
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when a dissonant upbeat is approached by leap', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat
        new Note("G", 4),

        // Upbeat: B above C = seventh, dissonant
        // G to B is a leap, so this is not a valid passing tone.
        new Note("B", 4),

        // Downbeat
        new Note("A", 4),

        // Upbeat
        new Note("F", 4),

        // Final
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkValidBeginningInterval', () => {
    it('returns false when beginning with a third', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Beginning third above C
        new Note("E", 4),
        new Note("F", 4),
        new Note("A", 4),
        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when beginning with a sixth', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Beginning sixth above C
        new Note("A", 4),
        new Note("G", 4),
        new Note("F", 4),
        new Note("D", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkValidEndingInterval', () => {
    it('returns false when ending with a fifth', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),
        new Note("B", 4),
        new Note("A", 4),
        new Note("F", 4),

        // Final fifth above C
        new Note("G", 4)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when ending with a third', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),
        new Note("B", 4),
        new Note("A", 4),
        new Note("F", 4),

        // Final third above C
        new Note("E", 4)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkFinalCadence', () => {
    it('returns false when counterpoint leaps into the final note', () => {
      const cf = [
        new Note("D", 4),
        new Note("E", 4),
        new Note("D", 4)
      ];

      const cp = [
        new Note("D", 5),
        new Note("C", 5),
        new Note("A", 4),
        new Note("A", 4),

        // Leaps into final D
        new Note("D", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelFifths', () => {
    it('returns false when parallel fifths occur from upbeat to following downbeat', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),

        // Upbeat fifth above C
        new Note("G", 4),

        // Following downbeat fifth above D
        new Note("A", 4),

        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when parallel fifths occur on consecutive downbeats', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat fifth above C
        new Note("G", 4),

        new Note("F", 4),

        // Downbeat fifth above D
        new Note("A", 4),

        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelOctaves', () => {
    it('returns false when parallel octaves occur from upbeat to following downbeat', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("G", 4),

        // Upbeat octave above C
        new Note("C", 5),

        // Following downbeat octave above D
        new Note("D", 5),

        new Note("B", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when parallel octaves occur on consecutive downbeats', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat octave above C
        new Note("C", 5),

        new Note("B", 4),

        // Downbeat octave above D
        new Note("D", 5),

        new Note("B", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelUnisons', () => {
    it('returns false when consecutive downbeats form unisons', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        // Downbeat unison
        new Note("C", 4),

        new Note("E", 4),

        // Consecutive downbeat unison
        new Note("D", 4),

        new Note("B", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoToneRepetition', () => {
    it('returns false when counterpoint repeats from downbeat to upbeat', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),

        // Repeated note
        new Note("C", 5),

        new Note("A", 4),
        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when counterpoint repeats from upbeat to following downbeat', () => {
      const cf = [
        new Note("C", 4),
        new Note("D", 4),
        new Note("C", 4)
      ];

      const cp = [
        new Note("C", 5),

        // Repeated into next downbeat
        new Note("A", 4),
        new Note("A", 4),

        new Note("F", 4),
        new Note("C", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoVoiceCrossing', () => {
    it('returns false when counterpoint goes below cantus firmus', () => {
      const cf = [
        new Note("G", 4),
        new Note("A", 4),
        new Note("G", 4)
      ];

      const cp = [
        new Note("G", 5),

        // Counterpoint drops below the cantus
        new Note("C", 4),

        new Note("C", 5),
        new Note("B", 4),
        new Note("G", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkSingleClimax', () => {
    it('returns false when highest note appears more than once', () => {
      const cf = [
        new Note("D", 4),
        new Note("E", 4),
        new Note("D", 4)
      ];

      const cp = [
        // Highest note appears here
        new Note("A", 5),

        new Note("G", 5),

        // Highest note appears again
        new Note("A", 5),

        new Note("F", 5),
        new Note("D", 5)
      ];

      expect(cp.length).toBe((cf.length * 2) - 1);
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });
});
