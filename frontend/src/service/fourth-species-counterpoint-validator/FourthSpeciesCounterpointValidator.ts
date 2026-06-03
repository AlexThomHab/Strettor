import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule} from '../../models/rule';
import {RuleIdEnum, FOURTH_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

export class FourthSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => boolean; rule: Rule }> = [
    { check: this.checkAppropriateLength.bind(this),                           rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_CorrectLength)! },
    { check: this.checkDissonanceMustBePrepared.bind(this),                    rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_DissonanceMustBePrepared)! },
    { check: this.checkDissonanceMustResolveDownByStep.bind(this),             rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_DissonanceMustResolveDownByStep)! },
    { check: this.checkNo7_8SuspensionInLowerVoice.bind(this),                 rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_No7_8SuspensionInLowerVoice)! },
    { check: this.checkValidBeginningInterval.bind(this),                      rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_ValidBeginningInterval)! },
    { check: this.checkValidEndingInterval.bind(this),                         rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_ValidEndingInterval)! },
    { check: this.checkNoVoiceCrossing.bind(this),                             rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_NoVoiceCrossing)! },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this),     rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_NoAugmentedOrDiminishedMelodicIntervals)! },
    { check: this.checkFinalCadence.bind(this),                                rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_FinalCadence)! },
    { check: this.checkAvoid9_8Suspensions.bind(this),                         rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_Avoid9_8Suspensions)! },
    { check: this.checkCoincidingClimax.bind(this),                            rule: FOURTH_SPECIES_RULES.find(r => r.id === RuleIdEnum.S4_CoincidingClimax)! },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): Rule[] {
    let cplengthshouldbe = ((cantusFirmus.length - 2) * 2) + 2;
    if (cplengthshouldbe !== counterpoint.length) {
      return [this._rules[0].rule];
    }
    const brokenRules: Rule[] = [];
    for (const { check, rule } of this._rules) {
      if (disabledRuleIDs.includes(rule.id)) continue;
      if (!check(cantusFirmus, counterpoint)){
        brokenRules.push(rule);

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

  private checkAppropriateLength(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    let cpLengthInFourthSpecies = ((cantusFirmus.length - 2) * 2) + 2;
    return  cpLengthInFourthSpecies === counterpoint.length;
  }

  private checkOnlyConsonantIntervals(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (!this.isConsonantInterval(interval)) return false;
    }
    return true;
  }

  private checkValidBeginningInterval(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[0], counterpoint[0]);
    return [0, 3, 4, 7, 12].includes(interval);
  }

  private checkValidEndingInterval(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[cantusFirmus.length - 1], counterpoint[counterpoint.length - 1]);
    return [0, 12].includes(interval);
  }

  private checkFinalCadence(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const last = counterpoint.length - 1;
    if (last < 1) return true;
    return this.getMelodicInterval(counterpoint[last - 1], counterpoint[last]) <= 2;
  }

  private checkNoParallelFifths(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (currentInterval === 7 && nextInterval === 7 && cfDirection === cpDirection) return false;
    }
    return true;
  }

  private checkNoParallelOctaves(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      const bothOctaves = [12, 24].includes(currentInterval) && [12, 24].includes(nextInterval);
      if (bothOctaves && cfDirection === cpDirection) return false;
    }
    return true;
  }

  private checkNoParallelUnisons(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      if (currentInterval === 0 && nextInterval === 0) return false;
    }
    return true;
  }

  private checkNoHiddenPerfectIntervals(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      if (!this.isPerfectInterval(nextInterval) || nextInterval === 0) continue;
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (cfDirection === cpDirection && cfDirection !== 0) {
        const cpLeap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]) > 2;
        if (cpLeap) return false;
      }
    }
    return true;
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      const interval = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (interval === 6) return false;  // tritone
      if (interval === 10) return false; // minor seventh
      if (interval === 11) return false; // major seventh
      if (interval > 12) return false;   // larger than octave
    }
    return true;
  }

  private checkNoUnisonsInMiddle(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 1; i < cantusFirmus.length - 1; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (interval === 0) return false;
    }
    return true;
  }

  private checkNoVoiceCrossing(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) < this.getAbsolutePitch(cantusFirmus[i])) return false;
    }
    return true;
  }

  private checkNoVoiceOverlap(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const cpNext = this.getAbsolutePitch(counterpoint[i + 1]);
      const cfCurrent = this.getAbsolutePitch(cantusFirmus[i]);
      const cfNext = this.getAbsolutePitch(cantusFirmus[i + 1]);
      const cpCurrent = this.getAbsolutePitch(counterpoint[i]);
      if (cpNext < cfCurrent) return false;
      if (cfNext > cpCurrent) return false;
    }
    return true;
  }

  private checkLargeLeapsRecoverCorrectly(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 2; i++) {
      const leap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (leap > 4) {
        const leapDir = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
        const recoveryDir = this.getMotionDirection(counterpoint[i + 1], counterpoint[i + 2]);
        const recoveryStep = this.getMelodicInterval(counterpoint[i + 1], counterpoint[i + 2]);
        if (recoveryDir === leapDir) return false;
        if (recoveryStep > 2) return false;
      }
    }
    return true;
  }

  private checkCoincidingClimax(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const cfPitches = cantusFirmus.map(n => this.getAbsolutePitch(n));
    const cpPitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const cfClimaxIndex = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIndex = cpPitches.indexOf(Math.max(...cpPitches));
    return cfClimaxIndex !== cpClimaxIndex;
  }

  private checkNoExcessiveConsecutiveThirdsOrSixths(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const thirds = [3, 4, 15, 16];
    const sixths = [8, 9];
    let thirdCount = 0;
    let sixthCount = 0;
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      if (thirds.includes(interval)) {
        thirdCount++;
        sixthCount = 0;
      } else if (sixths.includes(interval)) {
        sixthCount++;
        thirdCount = 0;
      } else {
        thirdCount = 0;
        sixthCount = 0;
      }
      if (thirdCount > 3 || sixthCount > 3) return false;
    }
    return true;
  }

  private checkNoExcessiveRepeatedNotes(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) === this.getAbsolutePitch(counterpoint[i + 1])) return false;
    }
    const pitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const counts = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const count of counts.values()) {
      if (count / counterpoint.length > 1 / 3) return false;
    }
    return true;
  }

  // CP layout: cp[0] = opening, for i=1..N-2: cp[2i-1] = suspension vs cf[i], cp[2i] = resolution vs cf[i], cp[2N-3] = final note

  private checkDissonanceMustBePrepared(cf: Note[], cp: Note[]): boolean {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx = 2 * i - 1;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      if (this.isConsonantInterval(suspInterval)) continue;
      // Dissonant suspension: preparation note (cp[suspIdx-1]) must be consonant against cf[i-1]
      const prepInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i - 1], cp[suspIdx - 1]);
      if (!this.isConsonantInterval(prepInterval)) return false;
      // Preparation note must be the same pitch as the suspension (the tie)
      if (this.getAbsolutePitch(cp[suspIdx - 1]) !== this.getAbsolutePitch(cp[suspIdx])) return false;
    }
    return true;
  }

  private checkDissonanceMustResolveDownByStep(cf: Note[], cp: Note[]): boolean {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspensionIndex = (2 * i) - 1;
      const resIdx  = suspensionIndex + 1
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspensionIndex]);
      if (this.isConsonantInterval(suspInterval)) continue;
      // Dissonant suspension must move down by step (1 or 2 semitones) to the resolution
      const diff = this.getAbsolutePitch(cp[suspensionIndex]) - this.getAbsolutePitch(cp[resIdx]);
      if (diff !== 1 && diff !== 2 && this.isABreakOfSyncopation(cp, resIdx) === false )
        return false;
    }
    return true;
  }

  private isABreakOfSyncopation(cp: Note[], resolutionIndex: number): boolean {
    if (this.getAbsolutePitch(cp[resolutionIndex]) !== this.getAbsolutePitch(cp[resolutionIndex + 1]) && (resolutionIndex !== cp.length - 2)){ //check if it breaks into syncopation anywhere expect the 2nd to last note as that is needed for the exercise
      return true
    }
    return false;
  }

  private checkNo7_8SuspensionInLowerVoice(cf: Note[], cp: Note[]): boolean {
    const isBelow = this.getAbsolutePitch(cp[0]) <= this.getAbsolutePitch(cf[0]);
    if (!isBelow) return true;
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx = 2 * i - 1;
      const resIdx  = 2 * i;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      const resInterval  = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[resIdx]);
      // Minor or major seventh resolving to an octave in the lower voice — forbidden
      if ((suspInterval === 10 || suspInterval === 11) && (resInterval === 12 || resInterval === 0)) return false;
    }
    return true;
  }

  // 9-8 suspension: major ninth (14) or major second (2) resolving to octave or unison — harsh, avoid
  private checkAvoid9_8Suspensions(cf: Note[], cp: Note[]): boolean {
    for (let i = 1; i < cf.length - 1; i++) {
      const suspIdx = 2 * i - 1;
      const resIdx  = 2 * i;
      const suspInterval = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[suspIdx]);
      const resInterval  = this._intervalCalculator.calculateSemitoneInterval(cf[i], cp[resIdx]);
      if ((suspInterval === 14 || suspInterval === 2) && (resInterval === 12 || resInterval === 0)) return false;
    }
    return true;
  }
}
