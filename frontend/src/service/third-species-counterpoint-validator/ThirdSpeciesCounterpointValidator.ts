import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule, Severity} from '../../models/rule';
import {RuleIdEnum, THIRD_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

export class ThirdSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  private _currentDisabledRules: number[] = [];

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
    { check: this.checkNoUnisonsOnInnerDownbeats.bind(this),               rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoUnisonsOnInnerDownbeats)! },
    { check: this.checkNoDirectMotionToPerfectOnDownbeats.bind(this),      rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoDirectMotionToPerfectOnDownbeats)! },
    { check: this.checkFinalCadence.bind(this),                            rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_FinalCadence)! },
    { check: this.checkCoincidingClimax.bind(this),                        rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_CoincidingClimax)! },
    { check: this.checkNoExcessivePitchRepetition.bind(this),              rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NoExcessivePitchRepetition)! },
    { check: () => true,                                                    rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NotaCambiata)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).filter(x => x.severity === Severity.Error).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): Rule[] {
    this._currentDisabledRules = disabledRuleIDs;
    if (counterpoint.length !== (4 * cantusFirmus.length) - 3) {
      return [this._rules[0].rule];
    }
    const enabledRules = this._rules.filter(x => !disabledRuleIDs.includes(x.rule.id));
    let brokenRules = [];

    for (const rule of enabledRules) {
      if (!rule.check(cantusFirmus, counterpoint)) {
        brokenRules.push(rule.rule);
      }
    }
    return brokenRules
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
    return [0, 3, 4, 7, 8, 9, 12, 15, 16, 19].includes(interval);
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
    // Nota cambiata: beat 2 only, only when the rule is enabled
    if (i % 4 === 1 && i + 2 < cp.length && !this._currentDisabledRules.includes(RuleIdEnum.S3_NotaCambiata)) {
      const afterNext = cp[i + 2];
      const leapInterval   = this.getMelodicInterval(curr, next);
      const steppedDown    = this.isStep(prev, curr) && this.getMotionDirection(prev, curr) === -1;
      const leapsDownThird = this.getMotionDirection(curr, next) === -1 && (leapInterval === 3 || leapInterval === 4);
      const stepsUp        = this.isStep(next, afterNext) && this.getMotionDirection(next, afterNext) === 1;
      if (steppedDown && leapsDownThird && stepsUp) return true;
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
      if (!this.isConsonantInterval(interval))
        return false;
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
  //problem is what would happen if they were in unison need to think about weather counterpoint will be above or below CF. this will be a field on an exercise object
  private checkNoVoiceCrossing(cf: Note[], cp: Note[]): boolean {
    const isAbove = this.getAbsolutePitch(cp[0]) >= this.getAbsolutePitch(cf[0]);

    for (let i = 0; i < cf.length; i++) {
      const cfPitch = this.getAbsolutePitch(cf[i]);
      const beatCount = (i === cf.length - 1) ? 1 : 4;
      for (let beat = 0; beat < beatCount; beat++) {
        const cpPitch = this.getAbsolutePitch(cp[4 * i + beat]);
        if (isAbove && cpPitch < cfPitch) return false;
        if (!isAbove && cpPitch > cfPitch) return false;
      }
    }
    return true;
  }

  // Voice overlap checked downbeat-to-downbeat

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
    outer: for (let i = 1; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (!this.isPerfectInterval(interval) || interval === 0) continue;

      const cfDir = this.getMotionDirection(cf[i - 1], cf[i]);
      if (cfDir === 0) continue;

      const prevMeasureStart = 4 * (i - 1);

      // From beat 2 onward - if any inner beat approaches the downbeat
      // in contrary motion to the CF, the hidden interval is excused
      for (let beat = 1; beat <= 3; beat++) {
        const cpDir = this.getMotionDirection(cp[prevMeasureStart + beat], cp[4 * i]);
        if (cpDir !== 0 && cpDir !== cfDir) continue outer;
      }

      // No contrary approach found anywhere - fall back to checking from the previous downbeat
      const cpDirOverall = this.getMotionDirection(cp[prevMeasureStart], cp[4 * i]);
      if (cpDirOverall === cfDir) return false;
    }
    return true;
  }

  // Warning rules

  private checkFinalCadence(cf: Note[], cp: Note[]): boolean {
    const lastIdx = 4 * (cf.length - 1);
    if (lastIdx < 1) return true;
    return this.getMelodicInterval(cp[lastIdx - 1], cp[lastIdx]) <= 2;
  }

  // Returns true if three consecutive notes outline a major or minor triad.
  // Used to permit triadic arpeggiation as a valid melodic gesture without requiring stepwise recovery.
  // A triad is identified by pitch class: for each note as a candidate root, check whether
  // the other two notes complete a major (root + 4 + 7) or minor (root + 3 + 7) triad.
  private isArpeggiatingTriad(notes: Note[]): boolean {
    if (notes.length < 3) return false;
    const pcs = notes.slice(0, 3).map(n => this.getAbsolutePitch(n) % 12);
    if (new Set(pcs).size !== 3) return false;
    const pcSet = new Set(pcs);
    for (const root of pcSet) {
      if (pcSet.has((root + 4) % 12) && pcSet.has((root + 7) % 12)) return true; // major
      if (pcSet.has((root + 3) % 12) && pcSet.has((root + 7) % 12)) return true; // minor
    }
    return false;
  }

  // Climax compared on downbeats only
  private checkCoincidingClimax(cf: Note[], cp: Note[]): boolean {
    const cfPitches         = cf.map(n => this.getAbsolutePitch(n));
    const cpDownbeatPitches = cf.map((_, i) => this.getAbsolutePitch(cp[4 * i]));
    const cfClimaxIdx       = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIdx       = cpDownbeatPitches.indexOf(Math.max(...cpDownbeatPitches));
    return cfClimaxIdx !== cpClimaxIdx;
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
