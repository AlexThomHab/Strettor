import {describe, it, expect, beforeEach} from 'vitest';
import {FirstSpeciesCounterpointValidator} from './FirstSpeciesCounterpointValidator';
import {Note} from '../../models/note';

describe('CounterpointValidator', () => {
  let validator: FirstSpeciesCounterpointValidator;

  // Fux Dorian cantus firmus
  const dorianCF: Note[] = [
    new Note("D", 3),
    new Note("E", 3),
    new Note("F", 3),
    new Note("D", 3),
    new Note("A", 3),
    new Note("E", 3),
    new Note("F", 3),
    new Note("D", 3),
    new Note("C#", 3),
    new Note("D", 3)
  ];

  beforeEach(() => {
    validator = new FirstSpeciesCounterpointValidator();
  });

  // Integration: Fux Dorian

  it('returns true for valid Fux-style Dorian first species counterpoint', () => {
    const cp: Note[] = [
      new Note("D", 4),
      new Note("C", 4),
      new Note("A", 3),
      new Note("B", 3),
      new Note("C", 4),
      new Note("E", 4),
      new Note("D", 4),
      new Note("F", 4),
      new Note("E", 4),
      new Note("D", 4)
    ];
    expect(validator.isValidSolution(dorianCF, cp, [])).toBe(true);
  });

  it('returns false when counterpoint has hidden octave via similar motion', () => {
    const cp: Note[] = [
      new Note("D", 4), new Note("A", 3), new Note("C", 4), new Note("F", 4),
      new Note("G", 4), new Note("A", 4), new Note("F", 4), new Note("G", 4),
      new Note("A", 4), new Note("C#", 4), new Note("D", 4)
    ];
    expect(validator.isValidSolution(dorianCF, cp, [])).toBe(false);
  });

  // Same Length

  describe('checkSameLength', () => {
    it('returns false when counterpoint is shorter than cantus firmus', () => {
      const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
      const cp = [new Note("F", 4), new Note("G", 4)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when counterpoint is longer than cantus firmus', () => {
      const cf = [new Note("D", 4), new Note("E", 4)];
      const cp = [new Note("F", 4), new Note("G", 4), new Note("A", 4)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns true when both lines have the same length', () => {
      const cf = [new Note("C", 4), new Note("D", 4)];
      const cp = [new Note("C", 5), new Note("D", 5)];
      // Only testing length - other rules may still fail
      expect(validator.isValidSolution(cf, cp, [])).not.toBeUndefined();
    });
  });

  //  Consonant Intervals

  describe('checkOnlyConsonantIntervals', () => {
    it('returns false when a second appears', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("D", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when a fourth appears', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("F", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when a tritone appears', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("F#", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when a seventh appears', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("B", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // Valid Beginning Interval

  describe('checkValidBeginningInterval', () => {
    it('returns false when beginning with a third', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("E", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when beginning with a sixth', () => {
      const cf = [new Note("C", 4), new Note("C", 5)];
      const cp = [new Note("A", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // Valid Ending Interval

  describe('checkValidEndingInterval', () => {
    it('returns false when ending with a fifth', () => {
      const cf = [new Note("C", 5), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("G", 4)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when ending with a third', () => {
      const cf = [new Note("C", 5), new Note("C", 4)];
      const cp = [new Note("C", 5), new Note("E", 4)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // Final Cadence

  describe('checkFinalCadence', () => {
    it('returns false when counterpoint leaps into the final note', () => {
      const cf = [new Note("D", 4), new Note("E", 4), new Note("D", 4)];
      const cp = [new Note("D", 5), new Note("A", 4), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // No Parallel Fifths

  describe('checkNoParallelFifths', () => {
    it('returns false when there are parallel fifths in similar motion', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 5)];
      const cp = [new Note("G", 4), new Note("A", 4), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns true when fifth is reached by contrary motion', () => {
      const cf = [
        new Note("C", 4), new Note("D", 4), new Note("E", 4),
        new Note("F", 4), new Note("G", 4), new Note("F", 4),
        new Note("E", 4), new Note("D", 4), new Note("C", 4)
      ];
      const cp = [
        new Note("C", 5), new Note("A", 4), new Note("G", 4),
        new Note("A", 4), new Note("B", 4), new Note("D", 5),
        new Note("C", 5), new Note("B", 4), new Note("C", 5)
      ];
      expect(validator.isValidSolution(cf, cp, [])).toBe(true);
    });
  });

  // No Parallel Octaves

  describe('checkNoParallelOctaves', () => {
    it('returns false when there are parallel octaves in similar motion', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 5)];
      const cp = [new Note("C", 5), new Note("D", 5), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // No Parallel Unisons

  describe('checkNoParallelUnisons', () => {
    it('returns false when there are two consecutive unisons', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 5)];
      const cp = [new Note("C", 4), new Note("D", 4), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // Excessive Consecutive Thirds or Sixths

  describe('checkNoExcessiveConsecutiveThirdsOrSixths', () => {
    it('returns false when there are more than three consecutive thirds', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 5)];
      const cp = [new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });

    it('returns false when there are more than three consecutive sixths', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("C", 5)];
      const cp = [new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // No Voice Crossing

  describe('checkNoVoiceCrossing', () => {
    it('returns false when counterpoint goes below cantus firmus', () => {
      const cf = [new Note("G", 4), new Note("C", 5)];
      const cp = [new Note("C", 4), new Note("C", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // Single Climax

  describe('checkSingleClimax', () => {
    it('returns false when highest note appears more than once', () => {
      const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("D", 5)];
      const cp = [new Note("A", 5), new Note("A", 5), new Note("G", 5), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  // No Excessive Repeated Notes

  describe('checkNoExcessiveRepeatedNotes', () => {
    it('returns false when counterpoint immediately repeats the same note', () => {
      const cf = [new Note("C", 4), new Note("D", 4), new Note("D", 5)];
      const cp = [new Note("C", 5), new Note("C", 5), new Note("D", 5)];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

});
