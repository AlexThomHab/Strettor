import {Rule, RuleIdEnum, Severity} from '../models/rule';

export class RuleService {

  private readonly _rules: Rule[] = [
    new Rule(RuleIdEnum.SameLength,                              'Counterpoint must match cantus firmus length',                          Severity.Error),
    new Rule(RuleIdEnum.OnlyConsonantIntervals,                  'No harmonic dissonances (fourths are dissonant in this style)',         Severity.Error),
    new Rule(RuleIdEnum.ValidBeginningInterval,                  'Begin on a unison, octave, fifth, or third above the cantus firmus',   Severity.Error),
    new Rule(RuleIdEnum.ValidEndingInterval,                     'Both voices must end on scale degree 1 (unison or octave)',             Severity.Error),
    new Rule(RuleIdEnum.NoParallelFifths,                        'No parallel perfect fifths',                                           Severity.Error),
    new Rule(RuleIdEnum.NoParallelOctaves,                       'No parallel octaves',                                                  Severity.Error),
    new Rule(RuleIdEnum.NoParallelUnisons,                       'No parallel unisons',                                                  Severity.Error),
    new Rule(RuleIdEnum.NoHiddenPerfectIntervals,                'No approaching a perfect consonance by direct motion',                 Severity.Error),
    new Rule(RuleIdEnum.NoAugmentedOrDiminishedMelodicIntervals, 'No dissonant melodic leaps (sevenths, tritone, or larger than octave)', Severity.Error),
    new Rule(RuleIdEnum.NoUnisonsInMiddle,                       'Unisons are only permitted at the first and last note',                Severity.Error),
    new Rule(RuleIdEnum.NoVoiceCrossing,                         'No voice crossing',                                                    Severity.Error),
    new Rule(RuleIdEnum.NoVoiceOverlap,                          'No voice overlap',                                                     Severity.Error),
    new Rule(RuleIdEnum.FinalCadence,                            'Approach the final note by step',                                      Severity.Warning),
    new Rule(RuleIdEnum.LargeLeapsRecoverCorrectly,              'Large leaps should be recovered by a step in the opposite direction',  Severity.Warning),
    new Rule(RuleIdEnum.CoincidingClimax,                        'Avoid coinciding high points with the cantus firmus',                  Severity.Warning),
    new Rule(RuleIdEnum.NoExcessiveConsecutiveThirdsOrSixths,    'Avoid more than 3 consecutive thirds or sixths',                      Severity.Warning),
    new Rule(RuleIdEnum.NoExcessiveRepeatedNotes,                'Avoid overusing tone repetition',                                      Severity.Warning),
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
