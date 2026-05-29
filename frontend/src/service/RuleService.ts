import {Rule} from '../models/rule';
import {FIRST_SPECIES_RULES, SECOND_SPECIES_RULES, THIRD_SPECIES_RULES} from '../data/rules.data';

export class RuleService {

  public getFirstSpeciesRules(): Rule[] {
    return FIRST_SPECIES_RULES;
  }

  public getSecondSpeciesRules(): Rule[] {
    return SECOND_SPECIES_RULES;
  }

  public getThirdSpeciesRules(): Rule[] {
    return THIRD_SPECIES_RULES;
  }
  public getRulesGivenSpecies(species : string) : Rule[] {

    const speciesToRules: Record<string, Rule[]> = {
      'first': FIRST_SPECIES_RULES,
      'second': SECOND_SPECIES_RULES,
      'third': THIRD_SPECIES_RULES,
    };
    return speciesToRules[species];
  }
}
