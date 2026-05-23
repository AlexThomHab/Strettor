import {Component, EventEmitter, Output} from '@angular/core';
import {Rule, Severity} from '../../models/rule';
import {RuleService} from '../../service/RuleService';
import {FourthSpeciesCounterpointValidator} from '../../service/fourth-species-counterpoint-validator/FourthSpeciesCounterpointValidator';
import {Staff} from '../staff/staff';

@Component({
  selector: 'app-fourth-species-exercise',
  imports: [
    Staff
  ],
  templateUrl: './fourth-species-exercise.html',
  styleUrl: './fourth-species-exercise.css',
})
export class FourthSpeciesExercise {
  brokenRules: Rule[] | null = null;
  protected readonly Error = Error;
  protected readonly length = length;
  listOfRules: Rule[] = [];
  ruleService: RuleService = new RuleService();
  warningRules: Rule[] = [];
  errorRules: Rule[] = [];
  disabledRules: number[] = [];
  speciesValidator = new FourthSpeciesCounterpointValidator();
  @Output() disabledRulesEvent: EventEmitter<number[]> = new EventEmitter();
  species: string = "fourth";

  ngOnInit() {
    this.listOfRules = this.ruleService.getThirdSpeciesRules();
    this.errorRules = this.listOfRules.filter(x => x.severity === Severity.Error);
    this.warningRules = this.listOfRules.filter(x => x.severity === Severity.Warning);
  }

  hasOnlyWarnings(): boolean {
    return this.brokenRules !== null
      && this.brokenRules.length > 0
      && this.brokenRules.every(r => r.severity === Severity.Warning);
  }

  toggleRule(ruleId: number) {
    this.disabledRules.includes(ruleId) ? this.disabledRules = this.disabledRules.filter(x => x !== ruleId) : this.disabledRules.push(ruleId)
    this.disabledRulesEvent.emit(this.disabledRules);
  }

  ruleIsEnabled(rule: Rule): boolean {
    return !this.disabledRules.includes(rule.id)
  }
}
