import {beforeEach, describe, expect, it} from 'vitest';
import {Note} from '../../models/note';
import {ThirdSpeciesCounterpointValidator} from './ThirdSpeciesCounterpointValidator';
import {Severity} from '../../models/rule';

describe('ThirdSpeciesCounterpointValidator', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  const cantusFirmus: Note[] = [
    new Note("D", 5), new Note("F", 5), new Note("E", 5), new Note("D", 5),
    new Note("G", 5), new Note("F", 5), new Note("A", 5), new Note("G", 5),
    new Note("F", 5), new Note("E", 5), new Note("D", 5)
  ];

  // Fux CP against the Dorian cantus firmus.
  // 10 full third-species bars of 4 notes, plus the final long note = 4N - 3.
  const fuxThirdSpeciesCp: Note[] = [
    new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4),
    new Note("A", 4), new Note("D", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("B", 4), new Note("G", 4), new Note("A", 4),
    new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4),
    new Note("E", 4), new Note("E", 5), new Note("B", 4), new Note("C", 5),
    new Note("D", 5), new Note("A", 4), new Note("D", 4), new Note("E", 4),
    new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("C", 5),
    new Note("D", 5), new Note("A", 4), new Note("D", 4), new Note("D", 5),
    new Note("C", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5),
    new Note("D", 5)
  ];

  // Mozart CP against the same Dorian cantus firmus.
  // The labels are intentionally the reverse of the earlier extraction:
  // this is the Mozart line according to the source file.
  const mozartThirdSpeciesCp: Note[] = [
    new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4),
    new Note("A", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("A", 4),
    new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("A", 4),
    new Note("B", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5),
    new Note("D", 5), new Note("A", 4), new Note("D", 4), new Note("E", 4),
    new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("C", 5),
    new Note("D", 5), new Note("D", 4), new Note("F", 4), new Note("G", 4),
    new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("A", 4),
    new Note("D", 5)
  ];

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

  describe('valid integration', () => {
    it('accepts Fux third species CP against the Dorian CF', () => {
      expect(fuxThirdSpeciesCp.length).toBe((cantusFirmus.length * 4) - 3);
      expect(validator.isValidSolution(cantusFirmus, fuxThirdSpeciesCp, [])).toBe(true);
      expect(validator.getBrokenRules(cantusFirmus, fuxThirdSpeciesCp).filter(x => x.severity == Severity.Error)).toHaveLength(0);
    });

    it('accepts Mozart third species CP against the same Dorian CF', () => {
      expect(mozartThirdSpeciesCp.length).toBe((cantusFirmus.length * 4) - 3);
      expect(validator.isValidSolution(cantusFirmus, mozartThirdSpeciesCp, [])).toBe(true);
      expect(validator.getBrokenRules(cantusFirmus, mozartThirdSpeciesCp)).toHaveLength(0);
    });
  });

  describe('checkValidThirdSpeciesLength', () => {
    it('returns false when CP is shorter than 4N - 3', () => {
      const cp = fuxThirdSpeciesCp.slice(0, fuxThirdSpeciesCp.length - 1);

      expect(cp.length).toBeLessThan((cantusFirmus.length * 4) - 3);
      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });

    it('returns false when CP is longer than 4N - 3', () => {
      const cp = [...fuxThirdSpeciesCp, new Note("C", 5)];

      expect(cp.length).toBeGreaterThan((cantusFirmus.length * 4) - 3);
      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });

    it('returns a boolean when CP has the correct length', () => {
      expect(fuxThirdSpeciesCp.length).toBe((cantusFirmus.length * 4) - 3);
      expect(typeof validator.isValidSolution(cantusFirmus, fuxThirdSpeciesCp, [])).toBe('boolean');
    });
  });

  describe('checkDownbeatConsonance', () => {
    it('returns false when a downbeat is dissonant', () => {
      const cp = [...fuxThirdSpeciesCp];

      // cantusFirmus[1] = F5. cp[4] = G5 creates a major second against F5.
      cp[4] = new Note("G", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkValidBeginningInterval', () => {
    it('returns false when beginning with a disallowed interval', () => {
      const cp = [...fuxThirdSpeciesCp];

      // cantusFirmus[0] = D5. F4 forms a sixth/tenth-style interval, not an allowed opening.
      cp[0] = new Note("F", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkValidEndingInterval', () => {
    it('returns false when ending on a fifth instead of a unison or octave', () => {
      const cp = [...fuxThirdSpeciesCp];

      // cantusFirmus final = D5. A4 forms a fifth.
      cp[cp.length - 1] = new Note("A", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });

    it('returns false when ending on a third instead of a unison or octave', () => {
      const cp = [...fuxThirdSpeciesCp];

      // cantusFirmus final = D5. F4/F5 forms a third/tenth-type ending.
      cp[cp.length - 1] = new Note("F", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkDissonancesMustBeNonHarmonic', () => {
    it('returns false when an off-beat dissonance is not a passing or neighbour tone', () => {
      const cp = [...fuxThirdSpeciesCp];

      // Against the first CF note D5, E5 is dissonant.
      // D4 -> E5 -> F4 is not a stepwise passing tone or neighbour motion.
      cp[1] = new Note("E", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkNoToneRepetition', () => {
    it('returns false when two consecutive notes are the same', () => {
      const cp = [...fuxThirdSpeciesCp];

      cp[1] = new Note("D", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelFifths', () => {
    it('returns false when consecutive downbeats form parallel fifths in the same direction', () => {
      const cp = [...fuxThirdSpeciesCp];

      // CF downbeats: D5 -> F5.
      // CP downbeats: A4 -> C5.
      // Both intervals are fifths/twelfths and both voices move up.
      cp[0] = new Note("A", 4);
      cp[4] = new Note("C", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });

    it('returns false when beat 4 to the next downbeat forms parallel fifths', () => {
      const cp = [...fuxThirdSpeciesCp];

      // Last quarter under D5 gives A4; next downbeat under F5 gives C5.
      // Both are fifths/twelfths and both voices move up into the next downbeat.
      cp[3] = new Note("A", 4);
      cp[4] = new Note("C", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkNoParallelOctaves', () => {
    it('returns false when consecutive downbeats form parallel octaves in the same direction', () => {
      const cp = [...fuxThirdSpeciesCp];

      // CF downbeats: D5 -> F5.
      // CP downbeats: D4 -> F4.
      // Both form octaves/double octaves and both voices move up.
      cp[0] = new Note("D", 4);
      cp[4] = new Note("F", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });

    it('returns false when beat 4 to the next downbeat forms parallel octaves', () => {
      const cp = [...fuxThirdSpeciesCp];

      // Last quarter under D5 gives D4; next downbeat under F5 gives F4.
      // Both form octaves/double octaves and both voices move up into the next downbeat.
      cp[3] = new Note("D", 4);
      cp[4] = new Note("F", 4);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkNoVoiceCrossing', () => {
    it('returns false when the lower CP crosses above the CF', () => {
      const cp = [...fuxThirdSpeciesCp];

      // CF[1] = F5. CP note at index 5 belongs to that CF bar.
      cp[5] = new Note("G", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkNoUnisonsOnInnerDownbeats', () => {
    it('returns false when an inner downbeat is a unison', () => {
      const cp = [...fuxThirdSpeciesCp];

      // cantusFirmus[1] = F5 and cp[4] is the matching inner downbeat.
      cp[4] = new Note("F", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });

  describe('checkFinalCadence', () => {
    it('returns false when the final note is approached by leap', () => {
      const cp = [...fuxThirdSpeciesCp];

      // A4 -> D5 is a fourth, so the final is not approached by step.
      cp[cp.length - 2] = new Note("A", 4);
      cp[cp.length - 1] = new Note("D", 5);

      expect(validator.isValidSolution(cantusFirmus, cp, [])).toBe(false);
    });
  });
});
