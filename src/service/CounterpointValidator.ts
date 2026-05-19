import {Note} from '../models/note';
import {IntervalCalculator} from './IntervalCalculator';
import {Rule, RuleIdEnum, Severity} from '../models/rule';

export class CounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => boolean; rule: Rule }> = [
    { check: this.checkSameLength.bind(this),                              rule: { id: RuleIdEnum.SameLength,                              description: 'Counterpoint must match cantus firmus length',          severity: Severity.Error,   isEnabled: true } },
    { check: this.checkOnlyConsonantIntervals.bind(this),                  rule: { id: RuleIdEnum.OnlyConsonantIntervals,                  description: 'Use consonant intervals only',                           severity: Severity.Error,   isEnabled: true } },
    { check: this.checkValidBeginningInterval.bind(this),                  rule: { id: RuleIdEnum.ValidBeginningInterval,                  description: 'Begin with a perfect consonance',                        severity: Severity.Error,   isEnabled: true } },
    { check: this.checkValidEndingInterval.bind(this),                     rule: { id: RuleIdEnum.ValidEndingInterval,                     description: 'End with a perfect consonance',                          severity: Severity.Error,   isEnabled: true } },
    { check: this.checkFinalCadence.bind(this),                            rule: { id: RuleIdEnum.FinalCadence,                            description: 'Final cadence must approach by step',                    severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoParallelFifths.bind(this),                        rule: { id: RuleIdEnum.NoParallelFifths,                        description: 'Avoid parallel perfect fifths',                          severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoParallelOctaves.bind(this),                       rule: { id: RuleIdEnum.NoParallelOctaves,                       description: 'Avoid parallel octaves',                                 severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoParallelUnisons.bind(this),                       rule: { id: RuleIdEnum.NoParallelUnisons,                       description: 'Avoid parallel unisons',                                 severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoHiddenPerfectIntervals.bind(this),                rule: { id: RuleIdEnum.NoHiddenPerfectIntervals,                description: 'Avoid hidden perfect intervals',                         severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoExcessiveConsecutiveThirdsOrSixths.bind(this),    rule: { id: RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths,    description: 'Avoid more than 3 consecutive thirds or sixths',         severity: Severity.Warning, isEnabled: true } },
    { check: this.checkMotionPreference.bind(this),                        rule: { id: RuleIdEnum.MotionPreference,                        description: 'Prefer contrary or oblique motion',                      severity: Severity.Warning, isEnabled: true } },
    { check: this.checkLargeLeapsRecoverCorrectly.bind(this),              rule: { id: RuleIdEnum.LargeLeapsRecoverCorrectly,              description: 'Large leaps must recover by step in opposite direction', severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoAugmentedOrDiminishedMelodicIntervals.bind(this), rule: { id: RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals, description: 'Avoid augmented or diminished melodic intervals',         severity: Severity.Error,   isEnabled: true } },
    { check: this.checkSingableMelody.bind(this),                          rule: { id: RuleIdEnum.SingableMelody,                          description: 'Melody must be singable (mostly steps)',                 severity: Severity.Warning, isEnabled: true } },
    { check: this.checkNoVoiceCrossing.bind(this),                         rule: { id: RuleIdEnum.NoVoiceCrossing,                         description: 'No voice crossing',                                      severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoVoiceOverlap.bind(this),                          rule: { id: RuleIdEnum.NoVoiceOverlap,                          description: 'No voice overlap',                                       severity: Severity.Error,   isEnabled: true } },
    { check: this.checkNoExcessiveRepeatedNotes.bind(this),                rule: { id: RuleIdEnum.NoExcessiveRepeatedNotes,                description: 'Avoid excessive repeated notes',                         severity: Severity.Warning, isEnabled: true } },
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs : number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs : number[]): Rule[] {

    let enabledRules = this._rules.filter(x => !disabledRuleIDs.includes(x.rule.id));

    if (cantusFirmus.length !== counterpoint.length) {
      return [this._rules[0].rule]; // same length rule
    }
    return enabledRules
      .filter(r => !r.check(cantusFirmus, counterpoint))
      .map(r => r.rule);
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

  // Rules

  private checkSameLength(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    return cantusFirmus.length === counterpoint.length;
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
    return [0, 7, 12].includes(interval);
  }

  private checkValidEndingInterval(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const last = cantusFirmus.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[last], counterpoint[last]);
    return [0,4, 7, 12].includes(interval);
  }

  private checkFinalCadence(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const last = counterpoint.length - 1;
    if (last < 1) return true;
    const penultimate = counterpoint[last - 1];
    const final = counterpoint[last];
    const melodicInterval = this.getMelodicInterval(penultimate, final);
    // Must approach by step (1 or 2 semitones)
    if (melodicInterval > 2) return false;
    // Allow raised leading tone e.g. C# -> D (1 semitone step up)
    return true;
  }

  private checkNoParallelFifths(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const currentInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[i]);
      const nextInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[i + 1]);
      const cfDirection = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDirection = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (currentInterval === 7 && nextInterval === 7 && cfDirection === cpDirection) return false;
    }
    console.log("Here is reached")
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
      // Similar motion into a perfect interval
      if (cfDirection === cpDirection && cfDirection !== 0) {
        // Forbidden if upper voice leaps
        const cpLeap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]) > 2;
        if (cpLeap) return false;
      }
    }
    return true;
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

  private checkMotionPreference(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    let similarCount = 0;
    let totalMotion = 0;
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const cfDir = this.getMotionDirection(cantusFirmus[i], cantusFirmus[i + 1]);
      const cpDir = this.getMotionDirection(counterpoint[i], counterpoint[i + 1]);
      if (cfDir !== 0 || cpDir !== 0) {
        totalMotion++;
        if (cfDir === cpDir && cfDir !== 0) similarCount++;
      }
    }
    if (totalMotion === 0) return true;
    return similarCount / totalMotion <= 0.5;
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

  private checkNoAugmentedOrDiminishedMelodicIntervals(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      const interval = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (interval === 6) return false; // tritone
      if (interval > 12) return false;  // larger than octave
    }
    return true;
  }

  private checkSingableMelody(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    if (counterpoint.length < 2) return true;
    let stepCount = 0;
    let consecutiveLeaps = 0;
    let maxConsecutiveLeaps = 0;
    for (let i = 0; i < counterpoint.length - 1; i++) {
      if (this.isStep(counterpoint[i], counterpoint[i + 1])) {
        stepCount++;
        consecutiveLeaps = 0;
      } else {
        consecutiveLeaps++;
        maxConsecutiveLeaps = Math.max(maxConsecutiveLeaps, consecutiveLeaps);
      }
    }
    const totalMovements = counterpoint.length - 1;
    if (stepCount / totalMovements < 0.5) return false;
    if (maxConsecutiveLeaps >= 3) return false;
    return true;
  }

  private checkNoVoiceCrossing(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length; i++) {
      const cpPitch = this.getAbsolutePitch(counterpoint[i]);
      const cfPitch = this.getAbsolutePitch(cantusFirmus[i]);
      // Allow unison at start and end
      if (i === 0 || i === cantusFirmus.length - 1) {
        if (cpPitch < cfPitch) return false;
      } else {
        if (cpPitch <= cfPitch) return false;
      }
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

  private checkSingleClimax(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const pitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const max = Math.max(...pitches);
    return pitches.filter(p => p === max).length === 1;
  }

  private checkNoExcessiveRepeatedNotes(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    // No immediate repeated notes
    for (let i = 0; i < counterpoint.length - 1; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) === this.getAbsolutePitch(counterpoint[i + 1])) return false;
    }
    // No note should appear more than 1/3 of the time
    const pitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const counts = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const count of counts.values()) {
      if (count / counterpoint.length > 1 / 3) return false;
    }
    return true;
  }
}
