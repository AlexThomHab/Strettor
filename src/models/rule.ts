export enum Severity {
  Warning = 'WARNING',
  Error = 'ERROR'
}

export enum RuleIdEnum {
  SameLength = 0,
  OnlyConsonantIntervals = 1,
  ValidBeginningInterval = 2,
  ValidEndingInterval = 3,
  FinalCadence = 4,
  NoParallelFifths = 5,
  NoParallelOctaves = 6,
  NoParallelUnisons = 7,
  NoHiddenPerfectIntervals = 8,
  NoExcessiveConsecutiveThirdsOrSixths = 9,
  MotionPreference = 10,
  LargeLeapsRecoverCorrectly = 11,
  NoAugmentedOrDiminishedMelodicIntervals = 12,
  SingableMelody = 13,
  NoVoiceCrossing = 14,
  NoVoiceOverlap = 15,
  NoExcessiveRepeatedNotes = 16,
}

export class Rule {
  public id: number;
  public description: string;
  public severity: Severity;
  public isEnabled: boolean;

  constructor(id: number, description: string, severity: Severity, isEnabled: boolean = true) {
    this.id = id;
    this.description = description;
    this.severity = severity;
    this.isEnabled = isEnabled;
  }

  static getNumberOfRules(): number {
    return Object.values(RuleIdEnum).filter(v => typeof v === 'number').length;
  }
}

