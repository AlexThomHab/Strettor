import {Note} from '../models/note';
import {Rule} from '../models/rule';

export interface ICounterpointValidator {
  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean;
  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs?: number[]): Rule[];
}
