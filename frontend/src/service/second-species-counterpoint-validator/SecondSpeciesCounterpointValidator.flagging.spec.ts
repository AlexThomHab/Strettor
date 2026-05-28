import {beforeEach, describe, expect, it} from 'vitest';
import {Note} from '../../models/note';
import {Rule, Severity} from '../../models/rule';
import {SecondSpeciesCounterpointValidator} from './SecondSpeciesCounterpointValidator';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';
import {RuleIdEnum, SECOND_SPECIES_RULES} from '../../data/rules.data';

describe('Given Mozarts and Fuxs Counterpoint to Fuxs Dorian CF', () => {
  let validator: SecondSpeciesCounterpointValidator;

  const dorianCF = CANTUS_FIRMUS_LIST[0];

  const mozartsCounterpoint: Note[] = [new Note("A", 4), new Note("D", 5), new Note("A", 4),
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
  ]; //fux's solution in Paranassium. This however lacks a clear high point, too much motivic repetition etc. NO ERRORS ARE MADE ONLY WARNINGS AND SUGGESTIONS

  //we must address that these two solutions above each have their own issues. Each of them should return no errors tho and only be warning more concerend with style. E.g Mozart can have a tritone cause of the galant style and Fux, despite having a boring melody, succeeds in voice leading independence

  beforeEach(() => {
    validator = new SecondSpeciesCounterpointValidator();
  });

  it('Fux CP returns 0 errors', () => {
    let errors = validator.getBrokenRules(dorianCF, fuxsCounterpoint).filter(x => x.severity == Severity.Error);
    expect(errors).toHaveLength(0);
  });
  it('Mozarts Counterpoint', () => {
    let result = validator.getBrokenRules(dorianCF, mozartsCounterpoint);
    let errors = result.filter(x => x.severity == Severity.Error)
    let suggestions = result.filter(x => x.severity == Severity.Suggestion)
    let warnings = result.filter(x => x.severity == Severity.Warning)
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
    expect(suggestions).toHaveLength(3);
    expect(suggestions.map(r => r.id)).toContain(RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats);
    expect(suggestions.map(r => r.id)).toContain(RuleIdEnum.S2_LargeLeapsRecoverCorrectly);
    expect(suggestions.map(r => r.id)).toContain(RuleIdEnum.S2_CoincidingClimax);
  });

  it('flags mismatched length as Error', () => {
    const cf = [new Note("D", 4), new Note("E", 4), new Note("F", 4)];
    const cp = [new Note("F", 4), new Note("G", 4)];
    const broken = validator.getBrokenRules(cf, cp);
    expect(broken.map(r => r.description)).toContain('Counterpoint must be the correct length for the exercise');
    expect(broken.find(r => r.description === 'Counterpoint must be the correct length for the exercise')?.severity).toBe(Severity.Error);
  });

  it('flags dissonant interval as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0]
    let fuxsCounterpointWithError = fuxsCounterpoint;
    fuxsCounterpointWithError[2] = new Note("G", 4)
    fuxsCounterpointWithError;
    const brokenRules = validator.getBrokenRules(cf, fuxsCounterpointWithError);
    const errorIds = brokenRules.filter(r => r.severity === Severity.Error).map(r => r.id);
    expect(errorIds).toHaveLength(2);
    expect(errorIds).toContain(RuleIdEnum.S2_DissonantUpbeatMustBePassingTone);
    expect(errorIds).toContain(RuleIdEnum.S2_DownbeatConsonance);
  });

  it('flags invalid beginning interval as Error', () => {
    // D3 to E4 = 14 semitones, not in [0, 3, 4, 7, 12]
    const cp = [...mozartsCounterpoint];
    cp[0] = new Note("E", 4);
    const brokenRules = validator.getBrokenRules(dorianCF, cp);
    expect(brokenRules.map(r => r.description)).toContain('Begin on a unison, octave, fifth, or third above the cantus firmus');
    expect(brokenRules.find(r => r.description === 'Begin on a unison, octave, fifth, or third above the cantus firmus')?.severity).toBe(Severity.Error);
    const errorIds = brokenRules.filter(r => r.severity === Severity.Error).map(r => r.id);
    expect(errorIds).toHaveLength(2);
    expect(errorIds).toContain(RuleIdEnum.S2_DownbeatConsonance);
  });

  it('allows beginning on a third above (minor or major)', () => {
    // D3 to F3 = 3 semitones (minor third) - valid per Gran for CP above
    const cp = [...mozartsCounterpoint];
    cp[0] = new Note("F", 4);
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
    // D3 to A3 = 7 semitones (fifth) - no longer valid, per Gran must end on scale degree 1
    const cp = [...mozartsCounterpoint];
    cp[cp.length - 1] = new Note("A", 3);
    const broken = validator.getBrokenRules(dorianCF, cp);
    expect(broken.map(r => r.description)).toContain('Both voices must end on scale degree 1 (unison or octave)');
  });

  it('flags final cadence not approached by step as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Force a leap into the final note.
    cp[cp.length - 2] = new Note("A", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('Approach the final note by step with a proper cadence');
    expect(broken.find(r => r.description === 'Approach the final note by step with a proper cadence')?.severity).toBe(Severity.Error);
  });

  it('flags parallel perfect fifths as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Create consecutive fifths against the Dorian CF:
    // D3-A3 followed by E3-B3.
    cp[0] = new Note("A", 4);
    cp[2] = new Note("C", 5);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No parallel perfect fifths between consecutive downbeats');
    expect(broken.find(r => r.description === 'No parallel perfect fifths between consecutive downbeats')?.severity).toBe(Severity.Error);
  });

  it('flags parallel octaves as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Create consecutive octaves:
    // D3-D4 followed by E3-E4.
    cp[0] = new Note("D", 5);
    cp[2] = new Note("F", 5);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No parallel octaves between consecutive downbeats');
    expect(broken.find(r => r.description === 'No parallel octaves between consecutive downbeats')?.severity).toBe(Severity.Error);
  });

  it('flags parallel unisons as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Create consecutive unisons:
    // D3-D3 followed by E3-E3.
    cp[0] = new Note("D", 4);
    cp[2] = new Note("F", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No parallel unisons on consecutive downbeats');
    expect(broken.find(r => r.description === 'No parallel unisons on consecutive downbeats')?.severity).toBe(Severity.Error);
  });

  it('flags unison in a middle position as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Middle-position unison against F3.
    cp[2] = new Note("F", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('Unisons are only allowed on the upbeat, unless they are one the first or last note of the counterpoint');
    expect(broken.find(r => r.description === 'Unisons are only allowed on the upbeat, unless they are one the first or last note of the counterpoint')?.severity).toBe(Severity.Error);
  });
  //write a test for unisons only being on the first or last beat and upbeats
  it('flags simlar motion perfect interval as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Similar motion into a perfect fifth against E3-B3.
    cp[3] = new Note("C", 5);
    cp[4] = new Note("G", 5);
    cp[5] = new Note("E", 5);
    cp[6] = new Note("D", 5);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No approaching a perfect consonance on a downbeat by direct motion');
    expect(broken.find(r => r.description === 'No approaching a perfect consonance on a downbeat by direct motion')?.severity).toBe(Severity.Error);
  });

  it('flags dissonant melodic leap tritone as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // F4 to B4 = tritone.
    cp[3] = new Note("F", 4);
    cp[4] = new Note("B", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No dissonant melodic leaps (tritone, seventh, or larger than an octave)');
    expect(broken.find(r => r.description === 'No dissonant melodic leaps (tritone, seventh, or larger than an octave)')?.severity).toBe(Severity.Warning);
  });

  it('flags dissonant melodic leap seventh as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // C4 to B4 = major seventh.
    cp[1] = new Note("C", 4);
    cp[2] = new Note("B", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No dissonant melodic leaps (tritone, seventh, or larger than an octave)');
    expect(broken.find(r => r.description === 'No dissonant melodic leaps (tritone, seventh, or larger than an octave)')?.severity).toBe(Severity.Warning);
  });

  it('flags large leap not recovered as Warning', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // C4 to A4 is a large leap up, then A4 to B4 continues upward instead of recovering.
    cp[4] = new Note("C", 4);
    cp[5] = new Note("A", 4);
    cp[6] = new Note("B", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('Leaps larger than a third should be recovered by a step in the opposite direction');
    expect(broken.find(r => r.description === 'Leaps larger than a third should be recovered by a step in the opposite direction')?.severity).toBe(Severity.Suggestion);
  });

  it('flags coinciding climax as Warning', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Dorian CF highest note is A3 at index 4.
    // Force CP high point to occur at the same index.
    cp[4] = new Note("D", 5);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('Avoid coinciding high points with the cantus firmus');
    expect(broken.find(r => r.description === 'Avoid coinciding high points with the cantus firmus')?.severity).toBe(Severity.Suggestion);
  });

  it('flags more than 3 consecutive thirds as Warning', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Make several consecutive thirds above the Dorian CF.
    cp[0] = new Note("F", 4);  // third above D3
    cp[2] = new Note("A", 4);  // third above E3
    cp[4] = new Note("G", 4);  // third above F3
    cp[6] = new Note("F", 4);  // third above D3

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('Avoid more than 3 consecutive thirds or sixths on downbeats');
    expect(broken.find(r => r.description === 'Avoid more than 3 consecutive thirds or sixths on downbeats')?.severity).toBe(Severity.Warning);
  });

  it('flags voice crossing as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // CP goes below the CF at index 4.
    // CF[4] is A3, so F3 crosses below it.
    cp[4] = new Note("F", 3);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No voice crossing');
    expect(broken.find(r => r.description === 'No voice crossing')?.severity).toBe(Severity.Error);
  });

  it('flags voice overlap as Error', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Force CP to move below the previous CF note range.
    cp[1] = new Note("C", 3);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No voice overlap');
    expect(broken.find(r => r.description === 'No voice overlap')?.severity).toBe(Severity.Error);
  });

  it('flags overused tone repetition as Warning', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...mozartsCounterpoint];

    // Immediate repeated tone.
    cp[4] = new Note("E", 4);
    cp[5] = new Note("E", 4);

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.map(r => r.description)).toContain('No repeated notes - neither downbeat-to-upbeat nor upbeat-to-following-downbeat');
    expect(broken.find(r => r.description === 'No repeated notes - neither downbeat-to-upbeat nor upbeat-to-following-downbeat')?.severity).toBe(Severity.Error);
  });

  it('can return multiple broken rules simultaneously', () => {
    const cf = CANTUS_FIRMUS_LIST[0];
    const cp = [...fuxsCounterpoint];

    // Break several rules deliberately.
    cp[0] = new Note("F", 3);  // invalid opening interval if only unison/octave allowed
    cp[1] = new Note("F", 3);  // repetition
    cp[2] = new Note("B", 4);  // creates a harsh melodic leap

    const broken = validator.getBrokenRules(cf, cp);

    expect(broken.length).toBeGreaterThan(1);
  });
})
