import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule} from '../../models/rule';
import {BrokenRule} from '../../models/broken-rule';
import {RuleIdEnum, FOURTH_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

class checkRuleResponse {
  passed: boolean;
  counterpointIndex?: number;
  constructor(passed: boolean, counterpointIndex?: number) {
    this.passed = passed;
    this.counterpointIndex = counterpointIndex;
  }
}

export class FourthSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => checkRuleResponse; rule: Rule }> = [
    { check: this.checkAppropriateLength.bind(this),                       rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_CorrectLength)! },
    { check: this.checkDissonanceMustBePrepared.bind(this),                rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_DissonanceMustBePrepared)! },
    { check: this.checkDissonanceMustResolveDownByStep.bind(this),         rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_DissonanceMustResolveDownByStep)! },
    { check: this.checkNo7_8SuspensionInLowerVoice.bind(this),             rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_No7_8SuspensionInLowerVoice)! },
    { check: this.checkValidBeginningInterval.bind(this),                  rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_ValidBeginningInterval)! },
    { check: this.checkValidEndingInterval.bind(this),                     rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_ValidEndingInterval)! },
    { check: this.checkNoVoiceCrossing.bind(this),                         rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_NoVoiceCrossing)! },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this), rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals)! },
    { check: this.checkFinalCadence.bind(this),                            rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_FinalCadence)! },
    { check: this.checkAvoid9_8Suspensions.bind(this),                     rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_Avoid9_8Suspensions)! },
    { check: this.checkCoincidingClimax.bind(this),                        rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_CoincidingClimax)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): BrokenRule[] {
    const expectedLength = ((cantusFirmus.length - 2) * 2) + 2;
    if (expectedLength !== counterpoint.length) {
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

  private checkAppropriateLength(cf: Note[], cp: Note[]): checkRuleResponse {
    const expected = ((cf.length - 2) * 2) + 2;
    if (expected === cp.length) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cp.length);
  }

  private checkValidBeginningInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[0], cp[0]);
    if ([0, 3, 4, 7, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, 0);
  }

  private checkValidEndingInterval(cf: Note[], cp: Note[]): checkRuleResponse {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cf[cf.length - 1], cp[cp.length - 1]);
    if ([0, 12].includes(interval)) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cp.length - 1);
  }

  private checkFinalCadence(cf: Note[], cp: Note[]): checkRuleResponse {
    const last = cp.length - 1;
    if (last < 1) return new checkRuleResponse(true);
    if (this.getMelodicInterval(cp[last - 1], cp[last]) <= 2) return new checkRuleResponse(true);
    return new checkRuleResponse(false, last);
  }

  private checkNoVoiceCrossing(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 0; i < cf.length; i++) {
      if (this.getAbsolutePitch(cp[i]) < this.getAbsolutePitch(cf[i])) return new checkRuleResponse(false, i);
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

  private checkCoincidingClimax(cf: Note[], cp: Note[]): checkRuleResponse {
    const cfPitches = cf.map(n => this.getAbsolutePitch(n));
    const cpPitches = cp.map(n => this.getAbsolutePitch(n));
    const cfClimaxIndex = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIndex = cpPitches.indexOf(Math.max(...cpPitches));
    if (cfClimaxIndex !== cpClimaxIndex) return new checkRuleResponse(true);
    return new checkRuleResponse(false, cpClimaxIndex);
  }

  // CP layout: cp[0] = opening, for i=1..N-2: cp[2i-1] = suspension vs cf[i], cp[2i] = resolution vs cf[i], cp[2N-3] = final note

  private checkDissonanceMustBePrepared(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx      = 2 * i - 1;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      if (this.isConsonantInterval(suspInterval)) continue;
      const prepInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i - 1], cp[suspIdx - 1]);
      if (!this.isConsonantInterval(prepInterval)) return new checkRuleResponse(false, suspIdx);
      if (this.getAbsolutePitch(cp[suspIdx - 1]) !== this.getAbsolutePitch(cp[suspIdx])) return new checkRuleResponse(false, suspIdx);
    }
    return new checkRuleResponse(true);
  }

  private checkDissonanceMustResolveDownByStep(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx      = (2 * i) - 1;
      const resIdx       = suspIdx + 1;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      if (this.isConsonantInterval(suspInterval)) continue;
      const diff = this.getAbsolutePitch(cp[suspIdx]) - this.getAbsolutePitch(cp[resIdx]);
      if (diff !== 1 && diff !== 2 && !this.isABreakOfSyncopation(cp, resIdx)) {
        return new checkRuleResponse(false, resIdx);
      }
    }
    return new checkRuleResponse(true);
  }

  private isABreakOfSyncopation(cp: Note[], resolutionIndex: number): boolean {
    return this.getAbsolutePitch(cp[resolutionIndex]) !== this.getAbsolutePitch(cp[resolutionIndex + 1])
      && resolutionIndex !== cp.length - 2;
  }

  private checkNo7_8SuspensionInLowerVoice(cf: Note[], cp: Note[]): checkRuleResponse {
    const isBelow = this.getAbsolutePitch(cp[0]) <= this.getAbsolutePitch(cf[0]);
    if (!isBelow) return new checkRuleResponse(true);
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx      = 2 * i - 1;
      const resIdx       = 2 * i;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      const resInterval  = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[resIdx]);
      if ((suspInterval === 10 || suspInterval === 11) && (resInterval === 12 || resInterval === 0)) {
        return new checkRuleResponse(false, suspIdx);
      }
    }
    return new checkRuleResponse(true);
  }

  private checkAvoid9_8Suspensions(cf: Note[], cp: Note[]): checkRuleResponse {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx      = 2 * i - 1;
      const resIdx       = 2 * i;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      const resInterval  = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[resIdx]);
      if ((suspInterval === 14 || suspInterval === 2) && (resInterval === 12 || resInterval === 0)) {
        return new checkRuleResponse(false, suspIdx);
      }
    }
    return new checkRuleResponse(true);
  }
}
