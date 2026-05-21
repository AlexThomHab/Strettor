import {Component, EventEmitter, Output} from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule, Severity, RuleIdEnum} from '../../models/rule';
import {RuleService} from '../../service/RuleService';

@Component({
  selector: 'app-second-species-exercise',
  imports: [Staff],
  templateUrl: './second-species-exercise.html',
  styleUrl: './second-species-exercise.css',
})
export class SecondSpeciesExercise {
  brokenRules: Rule[] | null = null;
  protected readonly Error = Error;
  protected readonly length = length;
  listOfRules: Rule[] = [];
  ruleService: RuleService = new RuleService();
  warningRules: Rule[] = [];
  errorRules: Rule[] = [];
  disabledRules : number[] = []
  @Output() disabledRulesEvent: EventEmitter<number[]> = new EventEmitter();

  ngOnInit() {
    this.listOfRules = this.ruleService.getAllRules()
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

