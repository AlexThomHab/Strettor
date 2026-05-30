import { beforeEach, describe, expect, it } from 'vitest';
import { Note } from '../../models/note';
import { Severity } from '../../models/rule';
import { ThirdSpeciesCounterpointValidator } from './ThirdSpeciesCounterpointValidator';
import { RuleIdEnum } from '../../data/rules.data';

describe('ThirdSpeciesCounterpointValidator - getBrokenRules flagging', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  // CF 3 notes → CP 9 notes (4*3-3)
  // Beat layout: cp[0..3] vs CF[0], cp[4..7] vs CF[1], cp[8] = final
  const cf3: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];

  // Known-valid CP for cf3 — used as mutation base
  const validCp: Note[] = [
    new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
    new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
    new Note("C", 5),
  ];

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

  it('returns empty array for a valid CP', () => {
    expect(validator.getBrokenRules(cf3, validCp)).toHaveLength(0);
  });



  it('flags S3_CorrectLength when CP is the wrong length', () => {
    const cp = [new Note("C", 5), new Note("B", 4)];
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_CorrectLength);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_CorrectLength)?.severity).toBe(Severity.Error);
  });

  it('flags S3_DownbeatConsonance when a downbeat is dissonant', () => {
    const cp = [...validCp];
    cp[4] = new Note("E", 4); // E4 vs D4 = major second (dissonant)
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_DownbeatConsonance);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_DownbeatConsonance)?.severity).toBe(Severity.Error);
  });

  it('flags S3_ValidBeginningInterval when opening is a third (only unison/fifth/octave allowed)', () => {
    const cp = [...validCp];
    cp[0] = new Note("E", 4); // major third above C4
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_ValidBeginningInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_ValidBeginningInterval)?.severity).toBe(Severity.Error);
  });

  it('flags S3_ValidEndingInterval when ending on a fifth', () => {
    const cp = [...validCp];
    cp[8] = new Note("G", 4); // fifth above C4
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_ValidEndingInterval);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_ValidEndingInterval)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoParallelFifthsBetweenDownbeats when downbeat fifths move in same direction', () => {
    // CF: C4→D4 up. CP downbeats: G4(fifth)→A4(fifth) up → parallel fifths
    const cp = [...validCp];
    cp[0] = new Note("G", 4);
    cp[4] = new Note("A", 4);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoParallelOctavesBetweenDownbeats when downbeat octaves move in same direction', () => {
    // CF: C4→D4 up. CP downbeats: C5(octave)→D5(octave) up → parallel octaves
    const cp = [...validCp];
    cp[0] = new Note("C", 5);
    cp[4] = new Note("D", 5);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoParallelFifthsBeat4ToDownbeat when beat-4 and next downbeat form parallel fifths', () => {
    // cp[3]=G4 (fifth vs C4), cp[4]=A4 (fifth vs D4), CF moves up
    const cp = [...validCp];
    cp[3] = new Note("G", 4);
    cp[4] = new Note("A", 4);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoParallelOctavesBeat4ToDownbeat when beat-4 and next downbeat form parallel octaves', () => {
    // cp[3]=C5 (octave vs C4), cp[4]=D5 (octave vs D4), CF moves up
    const cp = [...validCp];
    cp[3] = new Note("C", 5);
    cp[4] = new Note("D", 5);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat)?.severity).toBe(Severity.Error);
  });

  it('flags S3_DissonancesMustBeNonHarmonic when off-beat dissonance is not a passing/neighbour tone', () => {
    // cp[1]=D5: ninth above C4 (dissonant). C5→D5→A4 changes direction — not a passing tone
    const cp = [...validCp];
    cp[1] = new Note("D", 5);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_DissonancesMustBeNonHarmonic);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_DissonancesMustBeNonHarmonic)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoToneRepetition when consecutive notes are identical', () => {
    const cp = [...validCp];
    cp[1] = new Note("C", 5); // same as cp[0]
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoToneRepetition);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoToneRepetition)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoAugmentedOrDiminishedMelodicIntervals for a tritone leap', () => {
    // F4→B4 = 6 semitones = tritone
    const cp = [...validCp];
    cp[3] = new Note("F", 4);
    cp[4] = new Note("B", 4);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoVoiceCrossing when CP dips below CF', () => {
    const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
      new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("D", 4), // D4 < G4 → crossing
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoVoiceCrossing);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoVoiceCrossing)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoVoiceOverlap when CF next note leaps above current CP downbeat', () => {
    // CF[0]=C4, CF[1]=G4. CP downbeat cp[0]=E4. cfNext(G4=55) > cpCurrentDown(E4=52) → overlap
    const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
    const cp = [
      new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("A", 4),
      new Note("G", 4), new Note("A", 4), new Note("B", 4), new Note("A", 4),
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoVoiceOverlap);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoVoiceOverlap)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoUnisonsOnInnerDownbeats when an inner downbeat is a unison', () => {
    // CF[1]=E4, cp[4]=E4 → unison on inner downbeat
    const cf = [new Note("C", 4), new Note("E", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
      new Note("E", 4), new Note("F", 4), new Note("G", 4), new Note("B", 4),
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoUnisonsOnInnerDownbeats);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoUnisonsOnInnerDownbeats)?.severity).toBe(Severity.Error);
  });

  it('flags S3_NoDirectMotionToPerfectOnDownbeats when both voices approach a fifth by similar motion', () => {
    // CF: C4→G4 (up). CP prev downbeat→next downbeat: C5→D5 (up). D5 vs G4 = 7 (fifth, perfect)
    const cf = [new Note("C", 4), new Note("G", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("C", 5),
      new Note("D", 5), new Note("C", 5), new Note("B", 4), new Note("A", 4),
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats)?.severity).toBe(Severity.Error);
  });



  it('flags S3_FinalCadence (Warning) when final note is approached by leap', () => {
    // A4→C5 = 3 semitones, not a step (>2)
    const cp = [...validCp];
    cp[7] = new Note("A", 4);
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_FinalCadence);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_FinalCadence)?.severity).toBe(Severity.Warning);
  });

  it('flags S3_LargeLeapsRecoverCorrectly (Suggestion) when large leap is not recovered by step in opposite direction', () => {
    // C5→G5 = 7 (large leap up), G5→A5 = 2 (step up, same direction → not recovered)
    const cf = [new Note("C", 4), new Note("D", 4), new Note("C", 4), new Note("C", 4)];
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("A", 4), new Note("G", 4),
      new Note("C", 5), new Note("G", 5), new Note("A", 5), new Note("G", 5), // G→A same direction
      new Note("F", 5), new Note("E", 5), new Note("D", 5), new Note("E", 5),
      new Note("D", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_LargeLeapsRecoverCorrectly);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_LargeLeapsRecoverCorrectly)?.severity).toBe(Severity.Suggestion);
  });

  it('flags S3_CoincidingClimax (Suggestion) when CF and CP both peak at the same downbeat index', () => {
    // CF max = D4 at idx 1. Force CP max to also be at idx 1 (cp[4])
    const cp = [...validCp];
    cp[4] = new Note("E", 5); // highest CP note lands on downbeat idx 1, same as CF peak
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_CoincidingClimax);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_CoincidingClimax)?.severity).toBe(Severity.Suggestion);
  });

  it('flags S3_NoExcessiveConsecutiveThirdsOrSixths (Warning) for 4+ consecutive thirds on downbeats', () => {
    // CF: C4, D4, E4, F4, C4 (5 notes → CP 17 notes). All downbeats are thirds above CF.
    const cf = [
      new Note("C", 4), new Note("D", 4), new Note("E", 4),
      new Note("F", 4), new Note("C", 4),
    ];
    // Downbeats: E4(3rd over C4), F4(3rd over D4), G4(3rd over E4), A4(3rd over F4), C5(octave over C4)
    const cp = [
      new Note("E", 4), new Note("D", 4), new Note("C", 4), new Note("D", 4),
      new Note("F", 4), new Note("E", 4), new Note("D", 4), new Note("E", 4),
      new Note("G", 4), new Note("F", 4), new Note("E", 4), new Note("F", 4),
      new Note("A", 4), new Note("G", 4), new Note("F", 4), new Note("G", 4),
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths)?.severity).toBe(Severity.Warning);
  });

  it('flags S3_NoExcessivePitchRepetition (Warning) when one pitch exceeds one-third of the CP', () => {
    // Repeat C5 4 times in a 9-note CP: 4/9 > 1/3
    const cp = [
      new Note("C", 5), new Note("B", 4), new Note("C", 5), new Note("B", 4),
      new Note("F", 4), new Note("C", 5), new Note("A", 4), new Note("C", 5),
      new Note("C", 5),
    ];
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_NoExcessivePitchRepetition);
    expect(brokenRules.find(r => r.id === RuleIdEnum.S3_NoExcessivePitchRepetition)?.severity).toBe(Severity.Warning);
  });

  describe('S3_NotaCambiata', () => {
    // Nota cambiata figure: C5(beat1) → B4(beat2, dissonant vs C4) → G4(leap down major third) → A4(step up)
    // B4 vs C4 = 11 semitones (major seventh) — dissonant, treated by nota cambiata
    const cfWithCambiata: Note[] = [new Note("C", 4), new Note("D", 4), new Note("C", 4)];
    const cpWithCambiata: Note[] = [
      new Note("C", 5), new Note("B", 4), new Note("G", 4), new Note("A", 4),
      new Note("F", 4), new Note("G", 4), new Note("A", 4), new Note("B", 4),
      new Note("C", 5),
    ];

    it('accepts a nota cambiata figure when the rule is enabled', () => {
      const brokenRules = validator.getBrokenRules(cfWithCambiata, cpWithCambiata, []);
      expect(brokenRules.map(r => r.id)).not.toContain(RuleIdEnum.S3_DissonancesMustBeNonHarmonic);
    });

    it('rejects a nota cambiata figure when the rule is disabled', () => {
      const brokenRules = validator.getBrokenRules(cfWithCambiata, cpWithCambiata, [RuleIdEnum.S3_NotaCambiata]);
      expect(brokenRules.map(r => r.id)).toContain(RuleIdEnum.S3_DissonancesMustBeNonHarmonic);
    });

    it('S3_NotaCambiata is a Suggestion', () => {
      const rules = (validator as any)._rules as Array<{ rule: { id: number; severity: any } }>;
      const rule = rules.find(r => r.rule.id === RuleIdEnum.S3_NotaCambiata)!.rule;
      expect(rule.severity).toBe(Severity.Suggestion);
    });
  });

  it('can return multiple broken rules simultaneously', () => {
    const cp = [...validCp];
    cp[0] = new Note("E", 4); // bad beginning interval
    cp[1] = new Note("E", 4); // tone repetition
    cp[4] = new Note("E", 4); // dissonant downbeat
    const brokenRules = validator.getBrokenRules(cf3, cp);
    expect(brokenRules.length).toBeGreaterThan(1);
  });
});
