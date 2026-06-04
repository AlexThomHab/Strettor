import {Note} from '../models/note';
import {Rule} from '../models/rule';
import {BrokenRule} from '../models/broken-rule';

export interface ICounterpointValidator {
  isValidSolution(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs: number[]): boolean;
  getBrokenRules(cantusFirmus: Note[], counterpoint: Note[], disabledRuleIDs?: number[]): BrokenRule[];
}
