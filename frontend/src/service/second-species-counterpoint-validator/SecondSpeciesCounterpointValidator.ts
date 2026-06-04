import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule, Severity} from '../../models/rule';
import {BrokenRule} from '../../models/broken-rule';
import {RuleIdEnum, SECOND_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

class checkRuleResponse {
  passed: boolean;
  counterpointIndex?: number;
  constructor(passed: boolean, counterpointIndex?: number) {
    this.passed = passed;
    this.counterpointIndex = counterpointIndex;
  }
}

export class SecondSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => checkRuleResponse; rule: Rule }> = [
    { check: this.checkCorrectLength.bind(this),                           rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_CorrectLength)! },
    { check: this.checkDownbeatConsonance.bind(this),                      rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_DownbeatConsonance)! },
    { check: this.checkValidBeginningInterval.bind(this),                  rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_ValidBeginningInterval)! },
    { check: this.checkValidEndingInterval.bind(this),                     rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_ValidEndingInterval)! },
    { check: this.checkNoParallelFifthsBetweenDownbeats.bind(this),        rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoParallelFifthsBetweenDownbeats)! },
    { check: this.checkNoParallelOctavesBetweenDownbeats.bind(this),       rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoParallelOctavesBetweenDownbeats)! },
    { check: this.checkNoParallelFifthsUpbeatToDownbeat.bind(this),        rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoParallelFifthsUpbeatToDownbeat)! },
    { check: this.checkNoParallelOctavesUpbeatToDownbeat.bind(this),       rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoParallelOctavesUpbeatToDownbeat)! },
    { check: this.checkNoDirectMotionToPerfectOnDownbeats.bind(this),      rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoDirectMotionToPerfectOnDownbeats)! },
    { check: this.checkDissonantUpbeatMustBePassingTone.bind(this),        rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_DissonantUpbeatMustBePassingTone)! },
    { check: this.checkNoToneRepetition.bind(this),                        rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoToneRepetition)! },
    { check: this.checkNoDissonantOutlineBetweenDownbeats.bind(this),      rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoDissonantOutlineBetweenDownbeats)! },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this), rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoAugmentedOrDiminishedMelodicIntervals)! },
    { check: this.checkNoVoiceCrossing.bind(this),                         rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoVoiceCrossing)! },
    { check: this.checkNoVoiceOverlap.bind(this),                          rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoVoiceOverlap)! },
    { check: this.checkUnisonsOnlyOnUpbeats.bind(this),                    rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_UnisonsOnlyOnUpbeats)! },
    { check: this.checkLargeLeapsRecoverCorrectly.bind(this),              rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_LargeLeapsRecoverCorrectly)! },
    { check: this.checkFinalCadence.bind(this),                            rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_FinalCadence)! },
    { check: this.checkCoincidingClimax.bind(this),                        rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_CoincidingClimax)! },
    { check: this.checkNoExcessiveConsecutiveThirdsOrSixths.bind(this),    rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoExcessiveConsecutiveThirdsOrSixths)! },
    { check: this.checkNoExcessivePitchRepetition.bind(this),              rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoExcessivePitchRepetition)! },
    { check: this.checkNoParallelUnisonsOnConsecutiveDownbeats.bind(this), rule: SECOND_SPECIES_RULES.find(r => r.id === RuleIdEnum.S2_NoParallelUnionsOnConsecutiveDownbeats)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs)
      .filter(x => x.severity === Severity.Warning || x.severity === Severity.Error).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): BrokenRule[] {
    if (counterpoint.length !== (2 * cantusFirmus.length) - 1) {
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
    return [0, 3, 4, 7, 8, 9, 12, 15, 16].includes(interval);
  }

  private isStep(noteA: Note, noteB: Note): boolean {
    return this.getMelodicInterval(noteA, noteB) <= 2;
  }

  private checkCorrectLength(cf: Note[], cp: Note[]): checkRuleResponse {
    if (cp.length === (2 * cf.length - 1)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cp.length);
  }

  private checkDownbeatConsonance(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[2 * i]);
      if (!this.isConsonantInterval(interval)) return new checkRuleResponse(false, 2 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkValidBeginningInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[0], cp[0]);
    if ([0, 4, 3, 7, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 0);
  }

  private checkValidEndingInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const lastCF = cf.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[lastCF], cp[2 * lastCF]);
    if ([0, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 2 * lastCF);
  }

  private checkNoParallelFifthsBetweenDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1 = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[2 * i]);
      const i2 = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[2 * i + 2]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[2 * i], cp[2 * i + 2]);
      if (i1 === 7 && i2 === 7 && cfDir === cpDir) return new checkRuleResponse(false, 2 * (i + 1));
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelOctavesBetweenDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1 = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[2 * i]);
      const i2 = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[2 * i + 2]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[2 * i], cp[2 * i + 2]);
      if ([12, 24].includes(i1) && [12, 24].includes(i2) && cfDir === cpDir) return new checkRuleResponse(false, 2 * (i + 1));
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelFifthsUpbeatToDownbeat(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const upbeatInterval   = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[2 * i + 1]);
      const downbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[2 * i + 2]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[2 * i + 1], cp[2 * i + 2]);
      if (upbeatInterval === 7 && downbeatInterval === 7 && cfDir === cpDir) return new checkRuleResponse(false, 2 * i + 2);
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelOctavesUpbeatToDownbeat(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const upbeatInterval   = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[2 * i + 1]);
      const downbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[2 * i + 2]);
      const cfDir = this.getMotionDirection(cf[i],         cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[2 * i + 1], cp[2 * i + 2]);
      if ([12, 24].includes(upbeatInterval) && [12, 24].includes(downbeatInterval) && cfDir === cpDir) return new checkRuleResponse(false, 2 * i + 2);
    }
    return new checkRuleResponse(true);
  }

  private checkNoDirectMotionToPerfectOnDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[2 * i]);
      if (!this.isPerfectInterval(interval) || interval === 0) continue;
      const cfDir = this.getMotionDirection(cf[i - 1],      cf[i]);
      const cpDir = this.getMotionDirection(cp[2 * i - 1],  cp[2 * i]);
      if (cfDir === cpDir && cfDir !== 0) return new checkRuleResponse(false, 2 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkDissonantUpbeatMustBePassingTone(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const upbeat   = cp[2 * i + 1];
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], upbeat);
      if (this.isConsonantInterval(interval)) continue;
      const prev = cp[2 * i];
      const next = cp[2 * i + 2];
      const approachStep = this.isStep(prev, upbeat);
      const leaveStep    = this.isStep(upbeat, next);
      const approachDir  = this.getMotionDirection(prev, upbeat);
      const leaveDir     = this.getMotionDirection(upbeat, next);
      if (!approachStep || !leaveStep || approachDir !== leaveDir || approachDir === 0) {
        return new checkRuleResponse(false, 2 * i + 1);
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

  private checkNoDissonantOutlineBetweenDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const interval = this.getMelodicInterval(cp[2 * i], cp[2 * i + 2]);
      if (interval === 6) return new checkRuleResponse(false, 2 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cp.length - 1; i++) {
      const interval = this.getMelodicInterval(cp[i], cp[i + 1]);
      if (interval === 6 || interval === 10 || interval === 11 || interval === 14 || interval === 13 || interval > 16) {
        return new checkRuleResponse(false, i + 1);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoVoiceCrossing(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length; i++) {
      const cfPitch = this.getAbsolutePitch(cf[i]);
      if (this.getAbsolutePitch(cp[2 * i]) < cfPitch) return new checkRuleResponse(false, 2 * i);
      if (i < cf.length - 1 && this.getAbsolutePitch(cp[2 * i + 1]) < cfPitch) return new checkRuleResponse(false, 2 * i + 1);
    }
    return new checkRuleResponse(true);
  }

  private checkNoVoiceOverlap(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const cfCurrent    = this.getAbsolutePitch(cf[i]);
      const cpCurrentDown = this.getAbsolutePitch(cp[2 * i]);
      const cpCurrentUp   = this.getAbsolutePitch(cp[2 * i + 1]);
      if (cpCurrentDown < cfCurrent) return new checkRuleResponse(false, 2 * i);
      if (cpCurrentUp  < cfCurrent) return new checkRuleResponse(false, 2 * i + 1);
    }
    return new checkRuleResponse(true);
  }

  private checkUnisonsOnlyOnUpbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i <= cf.length - 2; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[2 * i]);
      if (interval === 0) return new checkRuleResponse(false, 2 * i);
    }
    return new checkRuleResponse(true);
  }

  private checkLargeLeapsRecoverCorrectly(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cp.length - 2; i++) {
      const leap = this.getMelodicInterval(cp[i], cp[i + 1]);
      if (leap > 4) {
        const leapDir     = this.getMotionDirection(cp[i],     cp[i + 1]);
        const recoveryDir = this.getMotionDirection(cp[i + 1], cp[i + 2]);
        const recoveryStep = this.getMelodicInterval(cp[i + 1], cp[i + 2]);
        if (recoveryDir === leapDir || recoveryStep > 2) return new checkRuleResponse(false, i + 2);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkFinalCadence(cf: Note[], cp: Note[]): checkRuleResponse {
    const lastIdx = 2 * (cf.length - 1);
    if (lastIdx < 1) return new checkRuleResponse(true);
    if (this.getMelodicInterval(cp[lastIdx - 1], cp[lastIdx]) <= 2) return new checkRuleResponse(true);
    return new checkRuleResponse(false, lastIdx);
  }

  private checkCoincidingClimax(cf: Note[], cp: Note[]): checkRuleResponse {
    const cfPitches         = cf.map(n => this.getAbsolutePitch(n));
    const cpDownbeatPitches = cf.map((_, i) => this.getAbsolutePitch(cp[2 * i]));
    const cfClimaxIdx       = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIdx       = cpDownbeatPitches.indexOf(Math.max(...cpDownbeatPitches));
    if (cfClimaxIdx !== cpClimaxIdx) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 2 * cpClimaxIdx);
  }

  private checkNoExcessiveConsecutiveThirdsOrSixths(cf: Note[], cp: Note[]): checkRuleResponse {
    const thirds = [3, 4, 15, 16];
    const sixths = [8, 9];
    let thirdCount = 0;
    let sixthCount = 0;
    for (let i = 0; i < cf.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[2 * i]);
      if (thirds.includes(interval))      { thirdCount++; sixthCount = 0; }
      else if (sixths.includes(interval)) { sixthCount++; thirdCount = 0; }
      else                                { thirdCount = 0; sixthCount = 0; }
      if (thirdCount > 3 || sixthCount > 3) return new checkRuleResponse(false, 2 * i);
    }
    return new checkRuleResponse(true);
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

  private checkNoParallelUnisonsOnConsecutiveDownbeats(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length - 1; i++) {
      const i1 = this._intervalCalculator.calculateSemitoneInterval(cf[i],     cp[2 * i]);
      const i2 = this._intervalCalculator.calculateSemitoneInterval(cf[i + 1], cp[2 * i + 2]);
      const cfDir = this.getMotionDirection(cf[i],     cf[i + 1]);
      const cpDir = this.getMotionDirection(cp[2 * i], cp[2 * i + 2]);
      if (i1 === 0 && i2 === 0 && cfDir === cpDir) return new checkRuleResponse(false, 2 * (i + 1));
    }
    return new checkRuleResponse(true);
  }
}
