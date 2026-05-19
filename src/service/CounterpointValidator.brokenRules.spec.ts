import {describe, it, expect, beforeEach} from 'vitest';
import {CounterpointValidator} from './CounterpointValidator';
import {Note} from '../models/note';
import {Severity} from '../models/rule';

describe('CounterpointValidator - getBrokenRules', () => {
  let validator: CounterpointValidator;

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

  beforeEach(() => {
    validator = new CounterpointValidator();
  });

  // --- Valid solution ---

  it('returns empty array for a valid solution', () => {
    expect(validator.getBrokenRules(dorianCF, validCP)).toHaveLength(0);
  });

  // --- Same length ---

  it('flags mismatched length as Error', () => {
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
    const cp = [new Note("F", 4), new Note("G", 4)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Counterpoint must match cantus firmus length');
    expect(broken.find(r => r.description === 'Counterpoint must match cantus firmus length')?.severity).toBe(Severity.Error);
  });

  // --- Only consonant intervals ---

  it('flags dissonant interval as Error', () => {
    // F4 against B4 = tritone (6 semitones), dissonant
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("G", 4), new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    // F4(CF pos 2) vs B4(CP pos 2) = 6 semitones = tritone
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Use consonant intervals only');
    expect(broken.find(r => r.description === 'Use consonant intervals only')?.severity).toBe(Severity.Error);
  });

  // --- Beginning interval ---

  it('flags invalid beginning interval as Error', () => {
    // D3 to E4 = 14 semitones (major 9th), not in [0, 7, 12]
    const cp = [...validCP];
    cp[0] = new Note("E", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Begin with a perfect consonance');
    expect(broken.find(r => r.description === 'Begin with a perfect consonance')?.severity).toBe(Severity.Error);
  });

  // --- Ending interval ---

  it('flags invalid ending interval as Error', () => {
    // D3 to E4 = 14 semitones (major 9th), not in [0, 4, 7, 12]
    const cp = [...validCP];
    cp[cp.length - 1] = new Note("E", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('End with a perfect consonance');
    expect(broken.find(r => r.description === 'End with a perfect consonance')?.severity).toBe(Severity.Error);
  });

  // --- Final cadence ---

  it('flags final cadence not approached by step as Error', () => {
    // A4 to D4 = 5 semitones leap, violates step approach to final note
    const cp = [...validCP];
    cp[cp.length - 2] = new Note("A", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Final cadence must approach by step');
    expect(broken.find(r => r.description === 'Final cadence must approach by step')?.severity).toBe(Severity.Error);
  });

  // --- Parallel fifths ---

  it('flags parallel fifths as Error', () => {
    // CF: C4→D4, CP: G4→A4 — both move up by step, both perfect fifths
    const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("F", 5), new Note("E", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid parallel perfect fifths');
    expect(broken.find(r => r.description === 'Avoid parallel perfect fifths')?.severity).toBe(Severity.Error);
  });

  // --- Parallel octaves ---

  it('flags parallel octaves as Error', () => {
    // CF: C4→D4, CP: C5→D5 — both move up, both octaves apart
    const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("G", 5), new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid parallel octaves');
    expect(broken.find(r => r.description === 'Avoid parallel octaves')?.severity).toBe(Severity.Error);
  });

  // --- Parallel unisons ---

  it('flags parallel unisons as Error', () => {
    // Positions 1 and 2: CF=E4, CP=E4 then CF=E4, CP=E4 — two consecutive unisons
    const cf = [new Note("C", 4), new Note("E", 4), new Note("E", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("E", 4), new Note("E", 4), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid parallel unisons');
    expect(broken.find(r => r.description === 'Avoid parallel unisons')?.severity).toBe(Severity.Error);
  });

  // --- Hidden perfect intervals ---

  it('flags hidden perfect interval as Error', () => {
    // CF: C4→G4 (up 7), CP: A4→D5 (up 5, a leap) — similar motion into a perfect fifth
    const cf = [new Note("C", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("A", 4), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("B", 4), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid hidden perfect intervals');
    expect(broken.find(r => r.description === 'Avoid hidden perfect intervals')?.severity).toBe(Severity.Error);
  });

  // --- Excessive consecutive thirds or sixths ---

  it('flags more than 3 consecutive thirds as Warning', () => {
    // CF positions 1-4: E4, F4, G4, A4 — CP: G4, A4, B4, C5 — four consecutive minor/major thirds
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid more than 3 consecutive thirds or sixths');
    expect(broken.find(r => r.description === 'Avoid more than 3 consecutive thirds or sixths')?.severity).toBe(Severity.Warning);
  });

  // --- Motion preference ---

  it('flags too much similar motion as Warning', () => {
    // CP mirrors the direction of dorianCF at every step — 100% similar motion
    const cp = [
      new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("E", 4),
      new Note("G", 4), new Note("D", 4), new Note("E", 4), new Note("D", 4),
      new Note("C", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Prefer contrary or oblique motion');
    expect(broken.find(r => r.description === 'Prefer contrary or oblique motion')?.severity).toBe(Severity.Warning);
  });

  // --- Large leaps ---

  it('flags large leap not recovered by step in opposite direction as Error', () => {
    // C4→A4 = 9 semitones (leap up), then A4→B4 = 2 semitones (still going up — wrong direction)
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("B", 3),
      new Note("C", 4), new Note("A", 4), new Note("B", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Large leaps must recover by step in opposite direction');
    expect(broken.find(r => r.description === 'Large leaps must recover by step in opposite direction')?.severity).toBe(Severity.Error);
  });

  // --- Augmented or diminished melodic intervals ---

  it('flags tritone in CP melody as Error', () => {
    // F4→B4 = 6 semitones = tritone in counterpoint melody
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("F", 4),
      new Note("B", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Avoid augmented or diminished melodic intervals');
    expect(broken.find(r => r.description === 'Avoid augmented or diminished melodic intervals')?.severity).toBe(Severity.Error);
  });

  // --- Singable melody ---

  it('flags unsingable melody as Warning', () => {
    // CP alternates by a seventh repeatedly — all leaps, 3+ consecutive
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("D", 5), new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("D", 5), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Melody must be singable (mostly steps)');
    expect(broken.find(r => r.description === 'Melody must be singable (mostly steps)')?.severity).toBe(Severity.Warning);
  });

  // --- No voice crossing ---

  it('flags voice crossing as Error', () => {
    // CP[1]=C4 goes below CF[1]=E4
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("D", 5), new Note("C", 4), new Note("G", 4), new Note("A", 4), new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No voice crossing');
    expect(broken.find(r => r.description === 'No voice crossing')?.severity).toBe(Severity.Error);
  });

  // --- No voice overlap ---

  it('flags voice overlap as Error', () => {
    // CP[1]=F4 drops below current CF[0]=G4 — voice overlap
    const cf = [new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("G", 4)];
    const cp = [new Note("D", 5), new Note("F", 4), new Note("D", 5), new Note("F", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("D", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No voice overlap');
    expect(broken.find(r => r.description === 'No voice overlap')?.severity).toBe(Severity.Error);
  });

  // --- No excessive repeated notes ---

  it('flags immediate repeated note as Warning', () => {
    // cp[4] and cp[5] are both E4
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("B", 3),
      new Note("E", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Avoid excessive repeated notes');
    expect(broken.find(r => r.description === 'Avoid excessive repeated notes')?.severity).toBe(Severity.Warning);
  });

  // --- Multiple rules broken at once ---

  it('can return multiple broken rules simultaneously', () => {
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
    const cp = [new Note("F", 4), new Note("G", 4), new Note("B", 3)];
    expect(validator.getBrokenRules(cf, cp).length).toBeGreaterThan(1);
  });
});
