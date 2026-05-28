import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note';
import { ThirdSpeciesCounterpointValidator } from './ThirdSpeciesCounterpointValidator';

describe('ThirdSpeciesCounterpointValidator', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  // CF length 3 → CP needs 4*3-3 = 9 notes
  // Beat layout: cp[0..3] against CF[0], cp[4..7] against CF[1], cp[8] = final
  const cf3: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

  // Valid CP: all downbeats consonant, off-beat dissonances are passing tones
  //   cp[0]=C5 (unison, valid start)
  //   cp[1]=B4 (passing: C5→B4→A4 stepwise down)
  //   cp[2]=A4 (consonant sixth)
  //   cp[3]=G4 (consonant fifth)
  //   cp[4]=F4 (consonant third above D4)
  //   cp[5]=G4 (passing: F4→G4→A4 stepwise up — G4 is fourth above D4, dissonant but PT)
  //   cp[6]=A4 (consonant fifth)
  //   cp[7]=B4 (consonant sixth)
  //   cp[8]=C5 (octave, valid end, approached by step)
  const validCp3: Note[] = [
    new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
    new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5),
  ];

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

  describe('valid integration', () => {
    it('accepts a valid third species CP against a 3-note CF', () => {
      expect(validator.isValidSolution(cf3, validCp3, [])).toBe(true);
      expect(validator.getBrokenRules(cf3, validCp3)).toHaveLength(0);
    });
  });

  describe('checkValidThirdSpeciesLength', () => {
    it('returns false when CP is shorter than 4N-3', () => {
      const cp = [new Note("C", 5), new Note("B", 4), new Note("A", 4)];
      expect(cp.length).toBeLessThan((cf3.length * 4) - 3);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when CP is longer than 4N-3', () => {
      const cp = Array(12).fill(new Note("C", 5));
      expect(cp.length).toBeGreaterThan((cf3.length * 4) - 3);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns a boolean when CP has the correct length', () => {
      expect(validCp3.length).toBe((cf3.length * 4) - 3);
      expect(typeof validator.isValidSolution(cf3, validCp3, [])).toBe('boolean');
    });
  });

  describe('checkDownbeatConsonance', () => {
    it('returns false when a downbeat is dissonant', () => {
      const cp = [...validCp3];
      cp[4] = new Note("E", 4); // E4 vs D4 = major second (dissonant)
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkValidBeginningInterval', () => {
    it('returns false when beginning with a third (only unison/fifth/octave allowed)', () => {
      const cp = [...validCp3];
      cp[0] = new Note("E", 4); // major third above C4 — not allowed in 3rd species
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkValidEndingInterval', () => {
    it('returns false when ending on a fifth', () => {
      const cp = [...validCp3];
      cp[8] = new Note("G", 4); // fifth above C4 — must end on unison or octave
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when ending on a third', () => {
      const cp = [...validCp3];
      cp[8] = new Note("E", 4); // third above C4
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkDissonancesMustBeNonHarmonic', () => {
    it('returns false when an off-beat dissonance is not a passing or neighbour tone', () => {
      const cp = [...validCp3];
      // cp[1] = D5: ninth above C4 (dissonant). C5→D5 then D5→A4 changes direction — not a PT
      cp[1] = new Note("D", 5);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNoToneRepetition', () => {
    it('returns false when two consecutive notes are the same', () => {
      const cp = [...validCp3];
      cp[1] = new Note("C", 5); // same as cp[0]
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelFifths', () => {
    it('returns false when consecutive downbeats form parallel fifths in the same direction', () => {
      // CF: C4→D4 (up). CP downbeat: G4→A4 (both fifths, both up)
      const cp = [...validCp3];
      cp[0] = new Note("G", 4); // fifth above C4
      cp[4] = new Note("A", 4); // fifth above D4
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when beat-4 to next downbeat form parallel fifths', () => {
      // cp[3]=G4 (fifth vs C4), cp[4]=A4 (fifth vs D4), CF moves up
      const cp = [...validCp3];
      cp[3] = new Note("G", 4);
      cp[4] = new Note("A", 4);
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelOctaves', () => {
    it('returns false when consecutive downbeats form parallel octaves in the same direction', () => {
      const cp = [...validCp3];
      cp[0] = new Note("C", 5); // octave above C4
      cp[4] = new Note("D", 5); // octave above D4, both moving up
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });

    it('returns false when beat-4 to next downbeat form parallel octaves', () => {
      const cp = [...validCp3];
      cp[3] = new Note("C", 5); // octave above C4
      cp[4] = new Note("D", 5); // octave above D4, both up
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });

  describe('checkNoVoiceCrossing', () => {
    it('returns false when CP dips below CF at any beat', () => {
      // CF[1]=D4. Any off-beat CP note below D4 triggers voice crossing
      const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
        new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), // D4 < G4
        new Note("C", 5),
      ];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkNoUnisonsOnInnerDownbeats', () => {
    it('returns false when an inner downbeat is a unison', () => {
      // CF[1]=E4, cp[4]=E4 → unison on inner downbeat
      const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
      const cp = [
        new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
        new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("B", 4),
        new Note("C", 5),
      ];
      expect(validator.isValidSolution(cf, cp, [])).toBe(false);
    });
  });

  describe('checkFinalCadence', () => {
    it('returns false when the final note is approached by leap', () => {
      const cp = [...validCp3];
      cp[7] = new Note("A", 4); // A4→C5 = 3 semitones, not a step (>2)
      expect(validator.isValidSolution(cf3, cp, [])).toBe(false);
    });
  });
});
