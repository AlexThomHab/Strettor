import {Rule} from '../models/rule';
import {RULES_DATA} from '../data/rules.data';

export class RuleService {

  public getRuleGivenEnumID(id: number): Rule {
    const rule = RULES_DATA.find(r => r.id === id);
    if (!rule) throw new Error(`No rule found for id ${id}`);
    return rule;
  }

  public getAllRules(): Rule[] {
    return RULES_DATA;
  }
}
