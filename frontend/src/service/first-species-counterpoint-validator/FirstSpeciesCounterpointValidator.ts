import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule} from '../../models/rule';
import {FIRST_SPECIES_RULES, RuleIdEnum} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';
import {BrokenRule} from '../../models/broken-rule';

class checkRuleResponse {
  passed: boolean;
  counterpointIndex?: number;

  constructor(passed: boolean, counterpointIndex?: number) {
    this.passed = passed;
    this.counterpointIndex = counterpointIndex;
  }

  getCounterpointIndex(): number {
    return this.counterpointIndex ? this.counterpointIndex : 0;
  }
}

export class FirstSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => checkRuleResponse; rule: Rule }> = [
    { check: this.checkSameLength.bind(this),                              rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.SameLength)! },
    { check: this.checkOnlyConsonantIntervals.bind(this),                  rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.OnlyConsonantIntervals)! },
    { check: this.checkValidBeginningInterval.bind(this),                  rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.ValidBeginningInterval)! },
    { check: this.checkValidEndingInterval.bind(this),                     rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.ValidEndingInterval)! },
    { check: this.checkNoParallelFifths.bind(this),                        rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoParallelFifths)! },
    { check: this.checkNoParallelOctaves.bind(this),                       rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoParallelOctaves)! },
    { check: this.checkNoParallelUnisons.bind(this),                       rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoParallelUnisons)! },
    { check: this.checkNoHiddenPerfectIntervals.bind(this),                rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoHiddenPerfectIntervals)! },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this), rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals)! },
    { check: this.checkNoUnisonsInMiddle.bind(this),                       rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoUnisonsInMiddle)! },
    { check: this.checkNoVoiceCrossing.bind(this),                         rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoVoiceCrossing)! },
    { check: this.checkNoVoiceOverlap.bind(this),                          rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoVoiceOverlap)! },
    { check: this.checkFinalCadence.bind(this),                            rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.FinalCadence)! },
    { check: this.checkLargeLeapsRecoverCorrectly.bind(this),              rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.LargeLeapsRecoverCorrectly)! },
    { check: this.checkCoincidingClimax.bind(this),                        rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.CoincidingClimax)! },
    { check: this.checkNoExcessiveConsecutiveThirdsOrSixths.bind(this),    rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths)! },
    { check: this.checkNoExcessiveRepeatedNotes.bind(this),                rule: FIRST_SPECIES_RULES.find(r => r.id === RuleIdEnum.NoExcessiveRepeatedNotes)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): BrokenRule[] {
    const brokenRules: BrokenRule[] = [];

    if (cantusFirmus.length !== counterpoint.length) {
      brokenRules.push(new BrokenRule(counterpoint.length, this._rules[0].rule));
      return brokenRules;
    }

    for (const { check, rule } of this._rules) {
      if (disabledRuleIDs.includes(rule.id)) continue;
      const response = check(cantusFirmus, counterpoint);
      if (!response.passed) {
        brokenRules.push(new BrokenRule(response.getCounterpointIndex(), rule));
      }
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

  private checkSameLength(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    if (cantusFirmus.length === counterpoint.length) return new checkRuleResponse(true);
    return new checkRuleResponse(false, counterpoint.length);
  }

  private checkOnlyConsonantIntervals(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (!this.isConsonantInterval(interval)) return new checkRuleResponse(false, i);
    }
    return new checkRuleResponse(true);
  }

  private checkValidBeginningInterval(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[0], counterpoint[0]);
    if ([0, 3, 4, 7,8, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 0);
  }

  private checkValidEndingInterval(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    const last = cantusFirmus.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[last], counterpoint[last]);
    if ([0, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, last);
  }

  private checkFinalCadence(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    const last = counterpoint.length - 1;
    if (last < 1) return new checkRuleResponse(true);
    if (this.getMelodicInterval(counterpoint[last - 1], counterpoint[last]) <= 2) return new checkRuleResponse(true);
    return new checkRuleResponse(false, last);
  }

  private checkNoParallelFifths(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (currentInterval === 7 && nextInterval === 7 && cfDirection === cpDirection) {
        return new checkRuleResponse(false, i + 1);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelOctaves(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      const bothOctaves = [12, 24].includes(currentInterval) && [12, 24].includes(nextInterval);
      if (bothOctaves && cfDirection === cpDirection) return new checkRuleResponse(false, i + 1);
    }
    return new checkRuleResponse(true);
  }

  private checkNoParallelUnisons(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      if (currentInterval === 0 && nextInterval === 0) return new checkRuleResponse(false, i + 1);
    }
    return new checkRuleResponse(true);
  }

  private checkNoHiddenPerfectIntervals(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      if (!this.isPerfectInterval(nextInterval) || nextInterval === 0) continue;
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (cfDirection === cpDirection && cfDirection !== 0) {
        const cpLeap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]) > 2;
        if (cpLeap) return new checkRuleResponse(false, i + 1);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      const interval = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (interval === 6 || interval === 10 || interval === 11 || interval > 12) {
        return new checkRuleResponse(false, i + 1);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoUnisonsInMiddle(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 1; i < cantusFirmus.length - 1; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (interval === 0) return new checkRuleResponse(false, i);
    }
    return new checkRuleResponse(true);
  }

  private checkNoVoiceCrossing(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) < this.getAbsolutePitch(cantusFirmus[i])) {
        return new checkRuleResponse(false, i);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkNoVoiceOverlap(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const cpNext    = this.getAbsolutePitch(counterpoint[i + 1]);
      const cfCurrent = this.getAbsolutePitch(cantusFirmus[i]);
      const cfNext    = this.getAbsolutePitch(cantusFirmus[i + 1]);
      const cpCurrent = this.getAbsolutePitch(counterpoint[i]);
      if (cpNext < cfCurrent) return new checkRuleResponse(false, i + 1);
      if (cfNext > cpCurrent) return new checkRuleResponse(false, i);
    }
    return new checkRuleResponse(true);
  }

  private checkLargeLeapsRecoverCorrectly(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    for (let i = 0; i < counterpoint.length - 2; i++) {
      const leap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (leap > 4) {
        const leapDir     = this.getMotionDirection(counterpoint[i],     counterpoint[i + 1]);
        const recoveryDir = this.getMotionDirection(counterpoint[i + 1], counterpoint[i + 2]);
        const recoveryStep = this.getMelodicInterval(counterpoint[i + 1], counterpoint[i + 2]);
        if (recoveryDir === leapDir || recoveryStep > 2) return new checkRuleResponse(false, i + 2);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkCoincidingClimax(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    const cfPitches    = cantusFirmus.map(n => this.getAbsolutePitch(n));
    const cpPitches    = counterpoint.map(n => this.getAbsolutePitch(n));
    const cfClimaxIndex = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIndex = cpPitches.indexOf(Math.max(...cpPitches));
    if (cfClimaxIndex !== cpClimaxIndex) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cpClimaxIndex);
  }

  private checkNoExcessiveConsecutiveThirdsOrSixths(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    const thirds = [3, 4, 15, 16];
    const sixths = [8, 9];
    let thirdCount = 0;
    let sixthCount = 0;
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (thirds.includes(interval))      { thirdCount++; sixthCount = 0; }
      else if (sixths.includes(interval)) { sixthCount++; thirdCount = 0; }
      else                                { thirdCount = 0; sixthCount = 0; }
      if (thirdCount > 3 || sixthCount > 3) return new checkRuleResponse(false, i);
    }
    return new checkRuleResponse(true);
  }

  private checkNoExcessiveRepeatedNotes(cantusFirmus: Note[], counterpoint: Note[]): checkRuleResponse {
    // Immediate repeat
    for (let i = 0; i < counterpoint.length - 1; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) === this.getAbsolutePitch(counterpoint[i + 1])) {
        return new checkRuleResponse(false, i + 1);
      }
    }
    // Overused pitch — report the first occurrence of the offending pitch
    const pitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const counts  = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const [pitch, count] of counts.entries()) {
      if (count / counterpoint.length > 1 / 3) {
        return new checkRuleResponse(false, pitches.indexOf(pitch));
      }
    }
    return new checkRuleResponse(true);
  }
}
