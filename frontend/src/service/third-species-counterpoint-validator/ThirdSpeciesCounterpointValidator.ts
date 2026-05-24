import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule} from '../../models/rule';
import {RuleIdEnum, THIRD_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

export class ThirdSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Beat layout: for CF note i, the 4 CP beats are cp[4i], cp[4i+1], cp[4i+2], cp[4i+3].
  // The last CF note has only one CP note (the final cadence): cp[4*(N-1)].
  // Total CP length: 4N - 3.

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => boolean; rule: Rule }> = [
    { check: this.checkCorrectLength.bind(this),                           rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_CorrectLength)! },
    { check: this.checkDownbeatConsonance.bind(this),                      rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_DownbeatConsonance)! },
    { check: this.checkValidBeginningInterval.bind(this),                  rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_ValidBeginningInterval)! },
    { check: this.checkValidEndingInterval.bind(this),                     rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_ValidEndingInterval)! },
    { check: this.checkNoParallelFifthsBetweenDownbeats.bind(this),        rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoParallelFifthsBetweenDownbeats)! },
    { check: this.checkNoParallelOctavesBetweenDownbeats.bind(this),       rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoParallelOctavesBetweenDownbeats)! },
    { check: this.checkNoParallelFifthsBeat4ToDownbeat.bind(this),         rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoParallelFifthsBeat4ToDownbeat)! },
    { check: this.checkNoParallelOctavesBeat4ToDownbeat.bind(this),        rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoParallelOctavesBeat4ToDownbeat)! },
    { check: this.checkDissonancesMustBeNonHarmonic.bind(this),            rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_DissonancesMustBeNonHarmonic)! },
    { check: this.checkNoToneRepetition.bind(this),                        rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoToneRepetition)! },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this), rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoAugmentedOrDiminishedMelodicIntervals)! },
    { check: this.checkNoVoiceCrossing.bind(this),                         rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoVoiceCrossing)! },
    { check: this.checkNoVoiceOverlap.bind(this),                          rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoVoiceOverlap)! },
    { check: this.checkNoUnisonsOnInnerDownbeats.bind(this),               rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoUnisonsOnInnerDownbeats)! },
    { check: this.checkNoDirectMotionToPerfectOnDownbeats.bind(this),      rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats)! },
    { check: this.checkFinalCadence.bind(this),                            rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_FinalCadence)! },
    { check: this.checkLargeLeapsRecoverCorrectly.bind(this),              rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_LargeLeapsRecoverCorrectly)! },
    { check: this.checkCoincidingClimax.bind(this),                        rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_CoincidingClimax)! },
    { check: this.checkNoExcessiveConsecutiveThirdsOrSixths.bind(this),    rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoExcessiveConsecutiveThirdsOrSixths)! },
    { check: this.checkNoExcessivePitchRepetition.bind(this),              rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoExcessivePitchRepetition)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): Rule[] {
    if (counterpoint.length !== (4 * cantusFirmus.length) - 3) {
      return [this._rules[0].rule];
    }
    const enabledRules = this._rules.filter(x => !disabledRuleIDs.includes(x.rule.id));
    return enabledRules
      .filter(r => !r.check(cantusFirmus, counterpoint))
      .map(r => r.rule);
  }

  // Helpers

  private getAbsolutePitch(note: Note): number {
    return (note.pitchClass * 12) + this._chromaticScale.indexOf(note.noteValue);
  }

  private getMelodicInterval(noteA: Note, noteB: Note): number {
    return Math.abs(this.getAbsolutePitch(noteB) - this.getAbsolutePitch(noteA));
  }

  private getMotionDirection(noteA: Note, noteB: Note): number {
    const diff = this.getAbsolutePitch(noteB) - this.getAbsolutePitch(noteA);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
    return 0;
  }

  private isPerfectInterval(interval: number): boolean {
    return [0, 7, 12, 19, 24].includes(interval);
  }

  private isConsonantInterval(interval: number): boolean {
    return [0, 3, 4, 7, 8, 9, 12, 15, 16].includes(interval);
  }

  private isStep(noteA: Note, noteB: Note): boolean {
    return this.getMelodicInterval(noteA, noteB) <= 2;
  }

  // Returns true if cp[i] functions as a valid non-harmonic tone:
  // passing tone, neighbour tone, or part of a double-neighbour figure.
  private isValidNonHarmonicTone(cp: Note[], i: number): boolean {
    if (i <= 0 || i >= cp.length - 1) return false;
    const prev = cp[i - 1];
    const curr = cp[i];
    const next = cp[i + 1];

    // Passing tone: stepwise motion in the same direction through the dissonance
    if (this.isStep(prev, curr) && this.isStep(curr, next) &&
        this.getMotionDirection(prev, curr) === this.getMotionDirection(curr, next) &&
        this.getMotionDirection(prev, curr) !== 0) {
      return true;
    }

    // Neighbour tone: step away and immediately return to the same pitch
    if (this.isStep(prev, curr) && this.isStep(curr, next) &&
        this.getAbsolutePitch(prev) === this.getAbsolutePitch(next)) {
      return true;
    }

    // Double-neighbour figure: [P, X, Y, P] where P is the same pitch at beats 1 and 4,
    // all moves are steps, and the inner pair moves in opposite directions from the outer pair.
    // The dissonance may be at beat 2 (beatInMeasure === 1) or beat 3 (beatInMeasure === 2).
    const beatInMeasure = i % 4;
    if (beatInMeasure === 1 || beatInMeasure === 2) {
      const b1Idx = i - beatInMeasure;
      const b4Idx = b1Idx + 3;
      if (b4Idx < cp.length) {
        const b1 = cp[b1Idx];
        const b2 = cp[b1Idx + 1];
        const b3 = cp[b1Idx + 2];
        const b4 = cp[b4Idx];
        if (this.getAbsolutePitch(b1) === this.getAbsolutePitch(b4) &&
            this.isStep(b1, b2) && this.isStep(b2, b3) && this.isStep(b3, b4) &&
            this.getMotionDirection(b1, b2) !== 0 &&
            this.getMotionDirection(b1, b2) !== this.getMotionDirection(b3, b4)) {
          return true;
        }
      }
    }

    return false;
  }

  // Error rules

  private checkCorrectLength(cf: Note[], cp: Note[]): boolean {
    return cp.length === (4 * cf.length) - 3;
  }

  private checkDownbeatConsonance(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (!this.isConsonantInterval(interval)) return false;
    }
    return true;
  }

  private checkValidBeginningInterval(cf: Note[], cp: Note[]): boolean {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[0], cp[0]);
    return [0, 7, 12].includes(interval);
  }

  private checkValidEndingInterval(cf: Note[], cp: Note[]): boolean {
    const lastCFIdx = cf.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[lastCFIdx], cp[4 * lastCFIdx]);
    return [0, 12].includes(interval);
  }

  private checkNoParallelFifthsBetweenDownbeats(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1   = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i]);
      const i2   = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i], cp[4 * i + 4]);
      if (i1 === 7 && i2 === 7 && cfDir === cpDir) return false;
    }
    return true;
  }

  private checkNoParallelOctavesBetweenDownbeats(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1    = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i]);
      const i2    = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i], cp[4 * i + 4]);
      if ([12, 24].includes(i1) && [12, 24].includes(i2) && cfDir === cpDir) return false;
    }
    return true;
  }

  // Parallel fifths from beat 4 of measure i to beat 1 of measure i+1
  private checkNoParallelFifthsBeat4ToDownbeat(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      const beat4Interval      = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i + 3]);
      const nextDownbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i + 3], cp[4 * i + 4]);
      if (beat4Interval === 7 && nextDownbeatInterval === 7 && cfDir === cpDir) return false;
    }
    return true;
  }

  // Parallel octaves from beat 4 of measure i to beat 1 of measure i+1
  private checkNoParallelOctavesBeat4ToDownbeat(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      const beat4Interval        = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i + 3]);
      const nextDownbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i + 3], cp[4 * i + 4]);
      if ([12, 24].includes(beat4Interval) && [12, 24].includes(nextDownbeatInterval) && cfDir === cpDir) return false;
    }
    return true;
  }

  // Off-beat dissonances (beats 2, 3, 4 of each measure) must be valid non-harmonic tones
  private checkDissonancesMustBeNonHarmonic(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      for (let beat = 1; beat <= 3; beat++) {
        const cpIdx = 4 * i + beat;
        const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[cpIdx]);
        if (!this.isConsonantInterval(interval) && !this.isValidNonHarmonicTone(cp, cpIdx)) {
          return false;
        }
      }
    }
    return true;
  }

  private checkNoToneRepetition(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cp.length - 1; i++) {
      if (this.getAbsolutePitch(cp[i]) === this.getAbsolutePitch(cp[i + 1])) return false;
    }
    return true;
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cp.length - 1; i++) {
      const interval = this.getMelodicInterval(cp[i], cp[i + 1]);
      if (interval === 6)  return false; // tritone
      if (interval === 10) return false; // minor seventh
      if (interval === 11) return false; // major seventh
      if (interval > 12)   return false; // larger than octave
    }
    return true;
  }

  // Voice crossing at every beat: CP must stay above the CF note of that measure
  private checkNoVoiceCrossing(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length; i++) {
      const cfPitch = this.getAbsolutePitch(cf[i]);
      const beatCount = (i === cf.length - 1) ? 1 : 4;
      for (let beat = 0; beat < beatCount; beat++) {
        if (this.getAbsolutePitch(cp[4 * i + beat]) < cfPitch) return false;
      }
    }
    return true;
  }

  // Voice overlap checked downbeat-to-downbeat
  private checkNoVoiceOverlap(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cf.length - 1; i++) {
      const cpNextDownbeat = this.getAbsolutePitch(cp[4 * i + 4]);
      const cfCurrent      = this.getAbsolutePitch(cf[i]);
      const cfNext         = this.getAbsolutePitch(cf[i + 1]);
      const cpCurrentDown  = this.getAbsolutePitch(cp[4 * i]);
      if (cpNextDownbeat < cfCurrent) return false;
      if (cfNext > cpCurrentDown)     return false;
    }
    return true;
  }

  // Unisons are only permitted on the first and last note (inner downbeats excluded)
  private checkNoUnisonsOnInnerDownbeats(cf: Note[], cp: Note[]): boolean {
    for (let i = 1; i < cf.length - 1; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (interval === 0) return false;
    }
    return true;
  }

  // Hidden 5ths/8ths: approaching a perfect interval on a downbeat by similar motion
  // (measured from the previous downbeat)
  private checkNoDirectMotionToPerfectOnDownbeats(cf: Note[], cp: Note[]): boolean {
    for (let i = 1; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (!this.isPerfectInterval(interval) || interval === 0) continue;
      const cfDir = this.getMotionDirection(cf[i - 1],     cf[i]);
      const cpDir = this.getMotionDirection(cp[4 * (i - 1)], cp[4 * i]);
      if (cfDir === cpDir && cfDir !== 0) return false;
    }
    return true;
  }

  // Warning rules

  private checkFinalCadence(cf: Note[], cp: Note[]): boolean {
    const lastIdx = 4 * (cf.length - 1);
    if (lastIdx < 1) return true;
    return this.getMelodicInterval(cp[lastIdx - 1], cp[lastIdx]) <= 2;
  }

  private checkLargeLeapsRecoverCorrectly(cf: Note[], cp: Note[]): boolean {
    for (let i = 0; i < cp.length - 2; i++) {
      const leap = this.getMelodicInterval(cp[i], cp[i + 1]);
      if (leap > 4) {
        const leapDir     = this.getMotionDirection(cp[i],     cp[i + 1]);
        const recoveryDir = this.getMotionDirection(cp[i + 1], cp[i + 2]);
        const recoveryStep = this.getMelodicInterval(cp[i + 1], cp[i + 2]);
        if (recoveryDir === leapDir || recoveryStep > 2) return false;
      }
    }
    return true;
  }

  // Climax compared on downbeats only
  private checkCoincidingClimax(cf: Note[], cp: Note[]): boolean {
    const cfPitches         = cf.map(n => this.getAbsolutePitch(n));
    const cpDownbeatPitches = cf.map((_, i) => this.getAbsolutePitch(cp[4 * i]));
    const cfClimaxIdx       = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIdx       = cpDownbeatPitches.indexOf(Math.max(...cpDownbeatPitches));
    return cfClimaxIdx !== cpClimaxIdx;
  }

  // Consecutive thirds or sixths measured on downbeats only
  private checkNoExcessiveConsecutiveThirdsOrSixths(cf: Note[], cp: Note[]): boolean {
    const thirds = [3, 4, 15, 16];
    const sixths = [8, 9];
    let thirdCount = 0;
    let sixthCount = 0;
    for (let i = 0; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (thirds.includes(interval))      { thirdCount++; sixthCount = 0; }
      else if (sixths.includes(interval)) { sixthCount++; thirdCount = 0; }
      else                                { thirdCount = 0; sixthCount = 0; }
      if (thirdCount > 3 || sixthCount > 3) return false;
    }
    return true;
  }

  private checkNoExcessivePitchRepetition(cf: Note[], cp: Note[]): boolean {
    const pitches = cp.map(n => this.getAbsolutePitch(n));
    const counts  = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const count of counts.values()) {
      if (count / cp.length > 1 / 3) return false;
    }
    return true;
  }
}
