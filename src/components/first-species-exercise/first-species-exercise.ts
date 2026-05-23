import {Component, EventEmitter, Output} from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule, Severity} from '../../models/rule';
import {RuleService} from '../../service/RuleService';
import {Note} from '../../models/note';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';

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
  warningRules: Rule[] = [];
  errorRules: Rule[] = [];
  disabledRules: number[] = []
  species: string = "first";
  counterpoint: (Note | null)[] = Array(0).fill(null);
  disabledRulesEvent: number[] = [];
  @Output() cantusFirmusEmitting: EventEmitter<Note[]> = new EventEmitter();
  private cantusFirmus: Note[] = [];

  ngOnInit() {
    this.cantusFirmus = this.getRandomCantusFirmus()
    this.cantusFirmusEmitting.emit(this.cantusFirmus)
    this.listOfRules = this.ruleService.getFirstSpeciesRules()
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
  }

  ruleIsEnabled(rule: Rule): boolean {
    return !this.disabledRules.includes(rule.id)
  }

  onCheck() {

  }

  onReset() {

  }

  onNextExercise() {

  }

  getRandomCantusFirmus(): Note[] {
    const randomIndex = Math.floor(Math.random() * CANTUS_FIRMUS_LIST.length);
    if (CANTUS_FIRMUS_LIST[randomIndex] === this.cantusFirmus) {
      return this.getRandomCantusFirmus()
    }
    return CANTUS_FIRMUS_LIST[randomIndex];
  }
}


