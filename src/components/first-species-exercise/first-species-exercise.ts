import {Component} from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule, Severity, RuleIdEnum} from '../../models/rule';
import {RuleService} from '../../service/Rule.service';

@Component({
  selector: 'app-first-species-exercise',
  imports: [Staff],
  templateUrl: './first-species-exercise.html',
  styleUrl: './first-species-exercise.css',
})
export class FirstSpeciesExercise {
  brokenRules: Rule[] | null = null;
  protected readonly Error = Error;
  protected readonly length = length;
  listOfRules: Rule[] = [];
  ruleService: RuleService = new RuleService();
  warningRules: any;

  ngOnInit() {
    this.listOfRules = this.ruleService.getAllRules()
  }

  hasOnlyWarnings(): boolean {
    return this.brokenRules !== null
      && this.brokenRules.length > 0
      && this.brokenRules.every(r => r.severity === Severity.Warning);
  }




}

