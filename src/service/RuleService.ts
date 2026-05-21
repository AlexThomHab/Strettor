import {Rule} from '../models/rule';
import {FIRST_SPECIES_RULES, SECOND_SPECIES_RULES} from '../data/rules.data';

export class RuleService {

  public getRuleGivenEnumID(id: number): Rule {
    let rule = FIRST_SPECIES_RULES.find(r => r.id === id);
    rule = SECOND_SPECIES_RULES.find(r => r.id === id);
    if (!rule) throw new Error(`No rule found for id ${id}`);
    return rule;
  }

  public getFirstSpeciesRules(): Rule[] {
    return FIRST_SPECIES_RULES;
  }

  public getSecondSpeciesRules(): Rule[] {
    return SECOND_SPECIES_RULES;
  }
}
