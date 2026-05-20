export enum Severity {
  Warning = 'WARNING',
  Error = 'ERROR'
}

export enum RuleIdEnum {
  SameLength                              = 0,
  OnlyConsonantIntervals                  = 1,
  ValidBeginningInterval                  = 2,
  ValidEndingInterval                     = 3,
  FinalCadence                            = 4,
  NoParallelFifths                        = 5,
  NoParallelOctaves                       = 6,
  NoParallelUnisons                       = 7,
  NoHiddenPerfectIntervals                = 8,
  NoExcessiveConsecutiveThirdsOrSixths    = 9,
  LargeLeapsRecoverCorrectly              = 11,
  NoAugmentedOrDiminishedMelodicIntervals = 12,
  NoVoiceCrossing                         = 14,
  NoVoiceOverlap                          = 15,
  NoExcessiveRepeatedNotes                = 16,
  NoUnisonsInMiddle                       = 17,
  CoincidingClimax                        = 18,
}

export class Rule {
  public id: number;
  public description: string;
  public severity: Severity;

  constructor(id: number, description: string, severity: Severity) {
    this.id = id;
    this.description = description;
    this.severity = severity;
  }

  static getNumberOfRules(): number {
    return Object.values(RuleIdEnum).filter(v => typeof v === 'number').length;
  }
}

