import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule, Severity} from '../../models/rule';
import {BrokenRule} from '../../models/broken-rule';
import {RuleIdEnum, THIRD_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

class checkRuleResponse {
  passed: boolean;
  counterpointIndex?: number;
  constructor(passed: boolean, counterpointIndex?: number) {
    this.passed = passed;
    this.counterpointIndex = counterpointIndex;
  }
}

export class ThirdSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  private _currentDisabledRules: number[] = [];

  // Beat layout: for CF note i, the 4 CP beats are cp[4i], cp[4i+1], cp[4i+2], cp[4i+3].
  // The last CF note has only one CP note (the final cadence): cp[4*(N-1)].
  // Total CP length: 4N - 3.

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => checkRuleResponse; rule: Rule }> = [
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
    { check: () => new checkRuleResponse(true),                            rule: THIRD_SPECIES_RULES.find(r => r.id === RuleIdEnum.S3_NotaCambiata)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs)
      .filter(x => x.severity === Severity.Error).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): BrokenRule[] {
    this._currentDisabledRules = disabledRuleIDs;
    if (counterpoint.length !== (4 * cantusFirmus.length) - 3) {
      return [new BrokenRule(counterpoint.length, this._rules[0].rule)];
    }
    const brokenRules: BrokenRule[] = [];
    for (const { check, rule } of this._rules) {
      if (disabledRuleIDs.includes(rule.id)) continue;
      const response = check(cantusFirmus, counterpoint);
      if (!response.passed) brokenRules.push(new BrokenRule(response.counterpointIndex, rule));
    }
    return brokenRules;
  }

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

  private isValidNonHarmonicTone(cp: Note[], i: number): boolean {
    if (i <= 0 || i >= cp.length - 1) return false;
    const prev = cp[i - 1];
    const curr = cp[i];
    const next = cp[i + 1];

    if (this.isStep(prev, curr) && this.isStep(curr, next) &&
        this.getMotionDirection(prev, curr) === this.getMotionDirection(curr, next) &&
        this.getMotionDirection(prev, curr) !== 0) return true;

    if (this.isStep(prev, curr) && this.isStep(curr, next) &&
        this.getAbsolutePitch(prev) === this.getAbsolutePitch(next)) return true;

    const beatInMeasure = i % 4;
    if (beatInMeasure === 1 || beatInMeasure === 2) {
      const b1Idx = i - beatInMeasure;
      const b4Idx = b1Idx + 3;
      if (b4Idx < cp.length) {
        const b1 = cp[b1Idx]; const b2 = cp[b1Idx + 1];
        const b3 = cp[b1Idx + 2]; const b4 = cp[b4Idx];
        if (this.getAbsolutePitch(b1) === this.getAbsolutePitch(b4) &&
            this.isStep(b1, b2) && this.isStep(b2, b3) && this.isStep(b3, b4) &&
            this.getMotionDirection(b1, b2) !== 0 &&
            this.getMotionDirection(b1, b2) !== this.getMotionDirection(b3, b4)) return true;
      }
    }

    if (i % 4 === 1 && i + 2 < cp.length && !this._currentDisabledRules.includes(RuleIdEnum.S3_NotaCambiata)) {
      const afterNext   = cp[i + 2];
      const leapInterval   = this.getMelodicInterval(curr, next);
      const steppedDown    = this.isStep(prev, curr) && this.getMotionDirection(prev, curr) === -1;
      const leapsDownThird = this.getMotionDirection(curr, next) === -1 && (leapInterval === 3 || leapInterval === 4);
      const stepsUp        = this.isStep(next, afterNext) && this.getMotionDirection(next, afterNext) === 1;
      if (steppedDown && leapsDownThird && stepsUp) return true;
    }

    return false;
  }

  private checkCorrectLength(cf: Note[], cp: Note[]): checkRuleResponse {
    if (cp.length === (4 * cf.length) - 3) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cp.length);
  }

  private checkDownbeatConsonance(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (!this.isConsonantInterval(interval)) return new checkRuleResponse(false, 4 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkValidBeginningInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[0], cp[0]);
    if ([0, 7, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 0);
  }

  private checkValidEndingInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const lastCFIdx = cf.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[lastCFIdx], cp[4 * lastCFIdx]);
    if ([0, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 4 * lastCFIdx);
  }

  private checkNoParallelFifthsBetweenDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1    = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i]);
      const i2    = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i], cp[4 * i + 4]);
      if (i1 === 7 && i2 === 7 && cfDir === cpDir) return new checkRuleResponse(false, 4 * (i + 1));
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelOctavesBetweenDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1    = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i]);
      const i2    = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i], cp[4 * i + 4]);
      if ([12, 24].includes(i1) && [12, 24].includes(i2) && cfDir === cpDir) return new checkRuleResponse(false, 4 * (i + 1));
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelFifthsBeat4ToDownbeat(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const beat4Interval       = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i + 3]);
      const nextDownbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i + 3], cp[4 * i + 4]);
      if (beat4Interval === 7 && nextDownbeatInterval === 7 && cfDir === cpDir) return new checkRuleResponse(false, 4 * i + 4);
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelOctavesBeat4ToDownbeat(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const beat4Interval        = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[4 * i + 3]);
      const nextDownbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[4 * i + 4]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[4 * i + 3], cp[4 * i + 4]);
      if ([12, 24].includes(beat4Interval) && [12, 24].includes(nextDownbeatInterval) && cfDir === cpDir) return new checkRuleResponse(false, 4 * i + 4);
    }
    return new checkRuleResponse(true);
  }

  private checkDissonancesMustBeNonHarmonic(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      for (let beat = 1; beat <= 3; beat++) {
        const cpIdx   = 4 * i + beat;
        const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[cpIdx]);
        if (!this.isConsonantInterval(interval) && !this.isValidNonHarmonicTone(cp, cpIdx)) {
          return new checkRuleResponse(false, cpIdx);
        }
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoToneRepetition(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cp.length - 1; i++) {
      if (this.getAbsolutePitch(cp[i]) === this.getAbsolutePitch(cp[i + 1])) return new checkRuleResponse(false, i + 1);
    }
    return new checkRuleResponse(true);
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cp.length - 1; i++) {
      const interval = this.getMelodicInterval(cp[i], cp[i + 1]);
      if (interval === 6 || interval === 10 || interval === 11 || interval > 12) {
        return new checkRuleResponse(false, i + 1);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoVoiceCrossing(cf: Note[], cp: Note[]): checkRuleResponse {
    const isAbove = this.getAbsolutePitch(cp[0]) >= this.getAbsolutePitch(cf[0]);
    for (let i = 0; i < cf.length; i++) {
      const cfPitch  = this.getAbsolutePitch(cf[i]);
      const beatCount = (i === cf.length - 1) ? 1 : 4;
      for (let beat = 0; beat < beatCount; beat++) {
        const cpPitch = this.getAbsolutePitch(cp[4 * i + beat]);
        if (isAbove && cpPitch < cfPitch)  return new checkRuleResponse(false, 4 * i + beat);
        if (!isAbove && cpPitch > cfPitch) return new checkRuleResponse(false, 4 * i + beat);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoUnisonsOnInnerDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i < cf.length - 1; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (interval === 0) return new checkRuleResponse(false, 4 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkNoDirectMotionToPerfectOnDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    outer: for (let i = 1; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[4 * i]);
      if (!this.isPerfectInterval(interval) || interval === 0) continue;
      const cfDir = this.getMotionDirection(cf[i - 1], cf[i]);
      if (cfDir === 0) continue;
      const prevMeasureStart = 4 * (i - 1);
      for (let beat = 1; beat <= 3; beat++) {
        const cpDir = this.getMotionDirection(cp[prevMeasureStart + beat], cp[4 * i]);
        if (cpDir !== 0 && cpDir !== cfDir) continue outer;
      }
      const cpDirOverall = this.getMotionDirection(cp[prevMeasureStart], cp[4 * i]);
      if (cpDirOverall === cfDir) return new checkRuleResponse(false, 4 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkFinalCadence(cf: Note[], cp: Note[]): checkRuleResponse {
    const lastIdx = 4 * (cf.length - 1);
    if (lastIdx < 1) return new checkRuleResponse(true);
    if (this.getMelodicInterval(cp[lastIdx - 1], cp[lastIdx]) <= 2) return new checkRuleResponse(true);
    return new checkRuleResponse(false, lastIdx);
  }

  private isArpeggiatingTriad(notes: Note[]): boolean {
    if (notes.length < 3) return false;
    const pcs = notes.slice(0, 3).map(n => this.getAbsolutePitch(n) % 12);
    if (new Set(pcs).size !== 3) return false;
    const pcSet = new Set(pcs);
    for (const root of pcSet) {
      if (pcSet.has((root + 4) % 12) && pcSet.has((root + 7) % 12)) return true;
      if (pcSet.has((root + 3) % 12) && pcSet.has((root + 7) % 12)) return true;
    }
    return false;
  }

  private checkCoincidingClimax(cf: Note[], cp: Note[]): checkRuleResponse {
    const cfPitches         = cf.map(n => this.getAbsolutePitch(n));
    const cpDownbeatPitches = cf.map((_, i) => this.getAbsolutePitch(cp[4 * i]));
    const cfClimaxIdx       = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIdx       = cpDownbeatPitches.indexOf(Math.max(...cpDownbeatPitches));
    if (cfClimaxIdx !== cpClimaxIdx) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 4 * cpClimaxIdx);
  }

  private checkNoExcessivePitchRepetition(cf: Note[], cp: Note[]): checkRuleResponse {
    const pitches = cp.map(n => this.getAbsolutePitch(n));
    const counts  = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const [pitch, count] of counts.entries()) {
      if (count / cp.length > 1 / 3) return new checkRuleResponse(false, pitches.indexOf(pitch));
    }
    return new checkRuleResponse(true);
  }
}
