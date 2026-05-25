import {Note} from '../../models/note';
import {IntervalCalculator} from '../IntervalCalculator';
import {Rule} from '../../models/rule';
import {RuleIdEnum, SECOND_SPECIES_RULES} from '../../data/rules.data';
import {ICounterpointValidator} from '../ICounterpointValidator';

export class SecondSpeciesCounterpointValidator implements ICounterpointValidator {

  private _intervalCalculator: IntervalCalculator = new IntervalCalculator();
  private _chromaticScale: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  private readonly _rules: Array<{ check: (cf: Note[], cp: Note[]) => boolean; rule: Rule }> = [
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
  ];

  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean {
    return this.getBrokenRules(cantusFirmus, counterpoint, disabledRuleIDs).length === 0;
  }

  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[] = []): Rule[] {
    if (counterpoint.length !== (2 * cantusFirmus.length) - 1) {
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

  // Downbeat cp index for CF index i  → cp[2i]
  // Upbeat   cp index for CF index i  → cp[2i + 1]

  // Error rules

  private checkCorrectLength(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    return counterpoint.length === (2 * cantusFirmus.length) - 1;
  }

  private checkDownbeatConsonance(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      if (!this.isConsonantInterval(interval)) return false;
    }
    return true;
  }

  private checkValidBeginningInterval(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[0], counterpoint[0]);
    return [0, 7, 12].includes(interval);
  }

  private checkValidEndingInterval(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const lastCF = cantusFirmus.length - 1;
    const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[lastCF], counterpoint[2 * lastCF]);
    return [0, 12].includes(interval);
  }

  // Parallel fifths comparing downbeat i to downbeat i+1
  private checkNoParallelFifthsBetweenDownbeats(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const i1 = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      const i2 = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[2 * i + 2]);
      const cfDir = this.getMotionDirection(cantusFirmus[i],     cantusFirmus[i + 1]);
      const cpDir = this.getMotionDirection(counterpoint[2 * i], counterpoint[2 * i + 2]);
      if (i1 === 7 && i2 === 7 && cfDir === cpDir) return false;
    }
    return true;
  }

  // Parallel octaves comparing downbeat i to downbeat i+1
  private checkNoParallelOctavesBetweenDownbeats(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const i1 = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      const i2 = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[2 * i + 2]);
      const cfDir = this.getMotionDirection(cantusFirmus[i],     cantusFirmus[i + 1]);
      const cpDir = this.getMotionDirection(counterpoint[2 * i], counterpoint[2 * i + 2]);
      if ([12, 24].includes(i1) && [12, 24].includes(i2) && cfDir === cpDir) return false;
    }
    return true;
  }

  // Parallel fifths from the upbeat of measure i to the downbeat of measure i+1
  private checkNoParallelFifthsUpbeatToDownbeat(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const upbeatInterval     = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i],     counterpoint[2 * i + 1]);
      const downbeatInterval   = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[2 * i + 2]);
      const cfDir = this.getMotionDirection(cantusFirmus[i],         cantusFirmus[i + 1]);
      const cpDir = this.getMotionDirection(counterpoint[2 * i + 1], counterpoint[2 * i + 2]);
      if (upbeatInterval === 7 && downbeatInterval === 7 && cfDir === cpDir) return false;
    }
    return true;
  }

  // Parallel octaves from the upbeat of measure i to the downbeat of measure i+1
  private checkNoParallelOctavesUpbeatToDownbeat(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const upbeatInterval   = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i],     counterpoint[2 * i + 1]);
      const downbeatInterval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i + 1], counterpoint[2 * i + 2]);
      const cfDir = this.getMotionDirection(cantusFirmus[i],         cantusFirmus[i + 1]);
      const cpDir = this.getMotionDirection(counterpoint[2 * i + 1], counterpoint[2 * i + 2]);
      if ([12, 24].includes(upbeatInterval) && [12, 24].includes(downbeatInterval) && cfDir === cpDir) return false;
    }
    return true;
  }

  // Direct (hidden) motion into a perfect interval on a downbeat, measured downbeat-to-downbeat
  private checkNoDirectMotionToPerfectOnDownbeats(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 1; i < cantusFirmus.length; i++) {
      const intervalBetweenCFandCP = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      if (!this.isPerfectInterval(intervalBetweenCFandCP) || intervalBetweenCFandCP === 0) continue;
      const cfDir = this.getMotionDirection(cantusFirmus[i - 1], cantusFirmus[i]);
      const cpDir = this.getMotionDirection(counterpoint[2 * i - 1], counterpoint[2 * i]);
      if (cfDir === cpDir && cfDir !== 0) return false;
    }
    return true;
  }

  // Dissonant upbeats must be passing tones: approached and left by step in the same direction
  private checkDissonantUpbeatMustBePassingTone(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const upbeat   = counterpoint[2 * i + 1];
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], upbeat);
      if (this.isConsonantInterval(interval)) continue;
      const prev = counterpoint[2 * i];
      const next = counterpoint[2 * i + 2];
      const approachStep = this.isStep(prev, upbeat);
      const leaveStep    = this.isStep(upbeat, next);
      const approachDir  = this.getMotionDirection(prev, upbeat);
      const leaveDir     = this.getMotionDirection(upbeat, next);
      if (!approachStep || !leaveStep || approachDir !== leaveDir || approachDir === 0) return false;
    }
    return true;
  }

  private checkNoToneRepetition(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      if (this.getAbsolutePitch(counterpoint[i]) === this.getAbsolutePitch(counterpoint[i + 1])) return false;
    }
    return true;
  }

  // Tritone outline between adjacent downbeats
  private checkNoDissonantOutlineBetweenDownbeats(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const interval = this.getMelodicInterval(counterpoint[2 * i], counterpoint[2 * i + 2]);
      if (interval === 6) return false;
    }
    return true;
  }

  private checkNoAugmentedOrDiminishedMelodicIntervals(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 1; i++) {
      const interval = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (interval === 6)  return false; // tritone
      if (interval === 10) return false; // minor seventh
      if (interval === 11) return false; // major seventh
      if (interval > 12)   return false; // larger than octave
    }
    return true;
  }

  // Check at every simultaneous moment: downbeat against cf[i], upbeat also against cf[i]
  private checkNoVoiceCrossing(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length; i++) {
      const cfPitch = this.getAbsolutePitch(cantusFirmus[i]);
      if (this.getAbsolutePitch(counterpoint[2 * i])     < cfPitch) return false;
      if (i < cantusFirmus.length - 1 &&
          this.getAbsolutePitch(counterpoint[2 * i + 1]) < cfPitch) return false;
    }
    return true;
  }

  private checkNoVoiceOverlap(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < cantusFirmus.length - 1; i++) {
      const cpNextDownbeat = this.getAbsolutePitch(counterpoint[2 * i + 2]);
      const cfCurrent      = this.getAbsolutePitch(cantusFirmus[i]);
      const cfNext         = this.getAbsolutePitch(cantusFirmus[i + 1]);
      const cpCurrentDown  = this.getAbsolutePitch(counterpoint[2 * i]);
      if (cpNextDownbeat < cfCurrent) return false;
      if (cfNext > cpCurrentDown)     return false;
    }
    return true;
  }

  // Unisons are forbidden on inner downbeats; they are allowed on upbeats
  private checkUnisonsOnlyOnUpbeats(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 1; i < cantusFirmus.length - 1; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      if (interval === 0) return false;
    }
    return true;
  }

  // Warning rules

  private checkLargeLeapsRecoverCorrectly(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    for (let i = 0; i < counterpoint.length - 2; i++) {
      const leap = this.getMelodicInterval(counterpoint[i], counterpoint[i + 1]);
      if (leap > 4) {
        const leapDir     = this.getMotionDirection(counterpoint[i],     counterpoint[i + 1]);
        const recoveryDir = this.getMotionDirection(counterpoint[i + 1], counterpoint[i + 2]);
        const recoveryStep = this.getMelodicInterval(counterpoint[i + 1], counterpoint[i + 2]);
        if (recoveryDir === leapDir || recoveryStep > 2) return false;
      }
    }
    return true;
  }

  private checkFinalCadence(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const lastIdx = 2 * (cantusFirmus.length - 1);
    if (lastIdx < 1) return true;
    return this.getMelodicInterval(counterpoint[lastIdx - 1], counterpoint[lastIdx]) <= 2;
  }

  // Climax compared on downbeats only
  private checkCoincidingClimax(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const cfPitches         = cantusFirmus.map(n => this.getAbsolutePitch(n));
    const cpDownbeatPitches = cantusFirmus.map((_, i) => this.getAbsolutePitch(counterpoint[2 * i]));
    const cfClimaxIdx       = cfPitches.indexOf(Math.max(...cfPitches));
    const cpClimaxIdx       = cpDownbeatPitches.indexOf(Math.max(...cpDownbeatPitches));
    return cfClimaxIdx !== cpClimaxIdx;
  }

  // Consecutive thirds or sixths on downbeats only
  private checkNoExcessiveConsecutiveThirdsOrSixths(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const thirds = [3, 4, 15, 16];
    const sixths = [8, 9];
    let thirdCount = 0;
    let sixthCount = 0;
    for (let i = 0; i < cantusFirmus.length; i++) {
      const interval = this._intervalCalculator.calculateSemitoneInterval(cantusFirmus[i], counterpoint[2 * i]);
      if (thirds.includes(interval))      { thirdCount++; sixthCount = 0; }
      else if (sixths.includes(interval)) { sixthCount++; thirdCount = 0; }
      else                                { thirdCount = 0; sixthCount = 0; }
      if (thirdCount > 3 || sixthCount > 3) return false;
    }
    return true;
  }

  private checkNoExcessivePitchRepetition(cantusFirmus: Note[], counterpoint: Note[]): boolean {
    const pitches = counterpoint.map(n => this.getAbsolutePitch(n));
    const counts  = new Map<number, number>();
    pitches.forEach(p => counts.set(p, (counts.get(p) ?? 0) + 1));
    for (const count of counts.values()) {
      if (count / counterpoint.length > 1 / 3) return false;
    }
    return true;
  }
}
