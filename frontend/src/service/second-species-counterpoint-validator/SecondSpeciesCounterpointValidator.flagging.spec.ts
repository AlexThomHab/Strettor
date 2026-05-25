import {describe, it, expect, beforeEach} from 'vitest';
import {Note} from '../../models/note';
import {Severity} from '../../models/rule';
import {SecondSpeciesCounterpointValidator} from './SecondSpeciesCounterpointValidator';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';

describe('CounterpointValidator - getBrokenRules', () => {
  let validator: SecondSpeciesCounterpointValidator;

  const dorianCF = CANTUS_FIRMUS_LIST[0];

  const mozartsCounterpoint: Note[] =  [new Note("A", 4), new Note("D", 5), new Note("A", 4),
    new Note("B", 4), new Note("C", 5), new Note("G", 4), new Note("F", 4), new Note("A", 4), new Note("B", 4),
    new Note("G", 4), new Note("A", 4), new Note("C", 5), new Note("F", 5), new Note("C", 5), new Note("B", 4),
    new Note("E", 5), new Note("D", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("D", 5),
  ]; //mozarts counterpoint. outlines a tritone however

  const fuxsCounterpoint: Note[] = [
    new Note("A", 4), new Note("D", 5), new Note("A", 4), new Note("B", 4),
    new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("D", 5),
    new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("A", 4),

    new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("B", 4),
    new Note("D", 5), new Note("A", 4), new Note("B", 4), new Note("C", 5),
    new Note("D", 5),
  ]; //fux's solution in Paranassium. This however lacks a clear high point, too much motivic repetition etc.

  //we must address that these two solutions above each have their own issues. Each of them should return no errors tho and only be warning more concerend with style. E.g Mozart can have a tritone cause of the galant style and Fux, despite having a boring melody, succeeds in voice leading independence

  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();
  });

  it('returns empty array for a valid solution', () => {
    let brokenRules = validator.getBrokenRules(dorianCF, mozartsCounterpoint);
    expect(brokenRules).toHaveLength(0);
  });

  it('flags mismatched length as Error', () => {
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
    const cp = [new Note("F", 4), new Note("G", 4)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Counterpoint must match cantus firmus length');
    expect(broken.find(r => r.description === 'Counterpoint must match cantus firmus length')?.severity).toBe(Severity.Error);
  });

  it('flags dissonant interval as Error', () => {
    // F4 against B4 = tritone (6 semitones) at position 2
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("C", 5), new Note("B", 4), new Note("G", 4), new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No harmonic dissonances (fourths are dissonant in two-voice exercises but constant in three-voice exercise between upper voices)');
    expect(broken.find(r => r.description === 'No harmonic dissonances (fourths are dissonant in two-voice exercises but constant in three-voice exercise between upper voices)')?.severity).toBe(Severity.Error);
  });

  it('flags invalid beginning interval as Error', () => {
    // D3 to E4 = 14 semitones, not in [0, 3, 4, 7, 12]
    const cp = [...mozartsCounterpoint];
    cp[0] = new Note("E", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Begin on a unison, octave, fifth, or third above the cantus firmus');
    expect(broken.find(r => r.description === 'Begin on a unison, octave, fifth, or third above the cantus firmus')?.severity).toBe(Severity.Error);
  });

  it('allows beginning on a third above (minor or major)', () => {
    // D3 to F3 = 3 semitones (minor third) — valid per Gran for CP above
    const cp = [...mozartsCounterpoint];
    cp[0] = new Note("F", 3);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).not.toContain('Begin on a unison, octave, fifth, or third above the cantus firmus');
  });

  it('flags invalid ending interval as Error', () => {
    // D3 to E4 = 14 semitones, not in [0, 12]
    const cp = [...mozartsCounterpoint];
    cp[cp.length - 1] = new Note("E", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Both voices must end on scale degree 1 (unison or octave)');
    expect(broken.find(r => r.description === 'Both voices must end on scale degree 1 (unison or octave)')?.severity).toBe(Severity.Error);
  });

  it('flags ending on a fifth as Error (both voices must end on scale degree 1)', () => {
    // D3 to A3 = 7 semitones (fifth) — no longer valid, per Gran must end on scale degree 1
    const cp = [...mozartsCounterpoint];
    cp[cp.length - 1] = new Note("A", 3);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Both voices must end on scale degree 1 (unison or octave)');
  });

  it('flags final cadence not approached by step as Warning', () => {
    // A4 to D4 = 5 semitones leap to final note
    const cp = [...mozartsCounterpoint];
    cp[cp.length - 2] = new Note("A", 4);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Approach the final note by step');
    expect(broken.find(r => r.description === 'Approach the final note by step')?.severity).toBe(Severity.Warning);
  });

  it('flags parallel perfect fifths as Error', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("D", 5), new Note("F", 5), new Note("E", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No parallel perfect fifths');
    expect(broken.find(r => r.description === 'No parallel perfect fifths')?.severity).toBe(Severity.Error);
  });

  it('flags parallel octaves as Error', () => {
    const cf = [new Note("C", 4), new Note("D", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("G", 5), new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No parallel octaves');
    expect(broken.find(r => r.description === 'No parallel octaves')?.severity).toBe(Severity.Error);
  });

  it('flags parallel unisons as Error', () => {
    const cf = [new Note("C", 4), new Note("E", 4), new Note("E", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("E", 4), new Note("E", 4), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No parallel unisons');
    expect(broken.find(r => r.description === 'No parallel unisons')?.severity).toBe(Severity.Error);
  });

  it('flags unison in a middle position as Error', () => {
    // CF: C4 E4 G4 E4 C4, CP: C5 E4 G5 B4 C5 — E4/E4 unison at position 1 (middle)
    const cf = [new Note("C", 4), new Note("E", 4), new Note("G", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("E", 4), new Note("G", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Unisons are only permitted at the first and last note');
    expect(broken.find(r => r.description === 'Unisons are only permitted at the first and last note')?.severity).toBe(Severity.Error);
  });

  it('flags hidden perfect interval as Error', () => {
    // CF: C4→G4 (up 7), CP: A4→D5 (leap up) — similar motion into a perfect fifth
    const cf = [new Note("C", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("A", 4), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("B", 4), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No approaching a perfect consonance by direct motion');
    expect(broken.find(r => r.description === 'No approaching a perfect consonance by direct motion')?.severity).toBe(Severity.Error);
  });

  it('flags dissonant melodic leap (tritone) as Error', () => {
    // F4→B4 = 6 semitones = tritone in CP melody
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("F", 4),
      new Note("B", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('No dissonant melodic leaps (sevenths, tritone, or larger than octave)');
    expect(broken.find(r => r.description === 'No dissonant melodic leaps (sevenths, tritone, or larger than octave)')?.severity).toBe(Severity.Error);
  });

  it('flags dissonant melodic leap (seventh) as Error', () => {
    // C4→B4 = 11 semitones = major seventh in CP melody
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("B", 4), new Note("B", 3),
      new Note("C", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('No dissonant melodic leaps (sevenths, tritone, or larger than octave)');
  });

  it('flags large leap not recovered as Warning', () => {
    // C4→A4 leap up, then A4→B4 still going up — no recovery
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("B", 3),
      new Note("C", 4), new Note("A", 4), new Note("B", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Leaps larger than a third should be recovered by a step in the opposite direction');
    expect(broken.find(r => r.description === 'Leaps larger than a third should be recovered by a step in the opposite direction')?.severity).toBe(Severity.Warning);
  });

  it('flags coinciding climax as Warning', () => {
    // CF peaks at index 2 (F3), CP also peaks at index 2 (D5)
    const cf = [new Note("C", 3), new Note("E", 3), new Note("F", 3), new Note("E", 3), new Note("D", 3), new Note("C", 3)];
    const cp = [new Note("C", 5), new Note("B", 4), new Note("D", 5), new Note("B", 4), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid coinciding high points with the cantus firmus');
    expect(broken.find(r => r.description === 'Avoid coinciding high points with the cantus firmus')?.severity).toBe(Severity.Warning);
  });

  it('flags more than 3 consecutive thirds as Warning', () => {
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("C", 5), new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("C", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Avoid more than 3 consecutive thirds or sixths');
    expect(broken.find(r => r.description === 'Avoid more than 3 consecutive thirds or sixths')?.severity).toBe(Severity.Warning);
  });

  it('flags voice crossing as Error', () => {
    // CP[1]=C4 goes below CF[1]=E4
    const cf = [new Note("C", 4), new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("C", 4)];
    const cp = [new Note("D", 5), new Note("C", 4), new Note("G", 4), new Note("A", 4), new Note("E", 5), new Note("E", 5), new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("C", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No voice crossing');
    expect(broken.find(r => r.description === 'No voice crossing')?.severity).toBe(Severity.Error);
  });

  it('flags voice overlap as Error', () => {
    const cf = [new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4), new Note("G", 4), new Note("G", 4)];
    const cp = [new Note("D", 5), new Note("F", 4), new Note("D", 5), new Note("F", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5), new Note("D", 5), new Note("D", 5)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('No voice overlap');
    expect(broken.find(r => r.description === 'No voice overlap')?.severity).toBe(Severity.Error);
  });

  it('flags overused tone repetition as Warning', () => {
    // cp[4] and cp[5] are both E4 — immediate repeat
    const cp = [
      new Note("D", 4), new Note("C", 4), new Note("A", 3), new Note("B", 3),
      new Note("E", 4), new Note("E", 4), new Note("D", 4), new Note("F", 4),
      new Note("E", 4), new Note("D", 4)
    ];
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Avoid overusing tone repetition');
    expect(broken.find(r => r.description === 'Avoid overusing tone repetition')?.severity).toBe(Severity.Warning);
  });

  it('can return multiple broken rules simultaneously', () => {
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
    const cp = [new Note("F", 4), new Note("G", 4), new Note("B", 3)];
    expect(validator.getBrokenRules(cf, cp).length).toBeGreaterThan(1);
  });
});
