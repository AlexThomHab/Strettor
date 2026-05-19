import {Rule, RuleIdEnum, Severity} from '../models/rule';

export class RuleService {

  private readonly _rules: Rule[] = [
    new Rule(RuleIdEnum.SameLength,                              'Counterpoint must match cantus firmus length',          Severity.Error),
    new Rule(RuleIdEnum.OnlyConsonantIntervals,                  'Use consonant intervals only',                           Severity.Error),
    new Rule(RuleIdEnum.ValidBeginningInterval,                  'Begin with a perfect consonance',                        Severity.Error),
    new Rule(RuleIdEnum.ValidEndingInterval,                     'End with a perfect consonance',                          Severity.Error),
    new Rule(RuleIdEnum.FinalCadence,                            'Final cadence must approach by step',                    Severity.Error),
    new Rule(RuleIdEnum.NoParallelFifths,                        'Avoid parallel perfect fifths',                          Severity.Error),
    new Rule(RuleIdEnum.NoParallelOctaves,                       'Avoid parallel octaves',                                 Severity.Error),
    new Rule(RuleIdEnum.NoParallelUnisons,                       'Avoid parallel unisons',                                 Severity.Error),
    new Rule(RuleIdEnum.NoHiddenPerfectIntervals,                'Avoid hidden perfect intervals',                         Severity.Error),
    new Rule(RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths,    'Avoid more than 3 consecutive thirds or sixths',         Severity.Warning),
    new Rule(RuleIdEnum.MotionPreference,                        'Prefer contrary or oblique motion',                      Severity.Warning),
    new Rule(RuleIdEnum.LargeLeapsRecoverCorrectly,              'Large leaps must recover by step in opposite direction', Severity.Error),
    new Rule(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals, 'Avoid augmented or diminished melodic intervals',        Severity.Error),
    new Rule(RuleIdEnum.SingableMelody,                          'Melody must be singable (mostly steps)',                 Severity.Warning),
    new Rule(RuleIdEnum.NoVoiceCrossing,                         'No voice crossing',                                      Severity.Error),
    new Rule(RuleIdEnum.NoVoiceOverlap,                          'No voice overlap',                                       Severity.Error),
    new Rule(RuleIdEnum.NoExcessiveRepeatedNotes,                'Avoid excessive repeated notes',                         Severity.Warning),
  ];

  public getRuleGivenEnumID(id: number): Rule {
    const rule = this._rules.find(r => r.id === id);
    if (!rule) throw new Error(`No rule found for id ${id}`);
    return rule;
  }

  public getAllRules(): Rule[] {
    return this._rules;
  }
}
