import {Component, EventEmitter, Output} from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule, Severity} from '../../models/rule';
import {RuleService} from '../../service/RuleService';
import {Note} from '../../models/note';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';
import {ICounterpointValidator} from '../../service/ICounterpointValidator';
import {ThirdSpeciesCounterpointValidator} from '../../service/third-species-counterpoint-validator/ThirdSpeciesCounterpointValidator';

@Component({
  selector: 'app-third-species-exercise',
  imports: [Staff],
  templateUrl: './third-species-exercise.html',
  styleUrl: './third-species-exercise.css',
})
export class ThirdSpeciesExercise {
  brokenRules: Rule[] | null = null;
  listOfRules: Rule[] = [];
  ruleService: RuleService = new RuleService();
  warningRules: Rule[] = [];
  errorRules: Rule[] = [];
  disabledRules: number[] = [];
  species: string = "third";
  counterpoint: (Note | null)[] = Array(0).fill(null);
  @Output() cantusFirmusEvent: EventEmitter<Note[]> = new EventEmitter();
  @Output() counterpointEvent: EventEmitter<(Note | null)[]> = new EventEmitter();
  cantusFirmus: Note[] = [];
  private counterpointValidator: ICounterpointValidator = new ThirdSpeciesCounterpointValidator();
  private rhythmicProportion: number = 0;

  ngOnInit() {
    this.cantusFirmus = this.getRandomCantusFirmus();
    this.setRhythmicProportionGivenSpecies();
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null);
    this.cantusFirmusEvent.emit(this.cantusFirmus);
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
    this.disabledRules.includes(ruleId)
      ? this.disabledRules = this.disabledRules.filter(x => x !== ruleId)
      : this.disabledRules.push(ruleId);
  }

  ruleIsEnabled(rule: Rule): boolean {
    return !this.disabledRules.includes(rule.id);
  }

  onCheck() {
    const counterpoint = this.counterpoint.filter(note => note !== null) as Note[];
    this.brokenRules = this.counterpointValidator.getBrokenRules(this.cantusFirmus, counterpoint, this.disabledRules);
  }

  onReset() {
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null);
    this.counterpointEvent.emit(this.counterpoint);
  }

  onNextExercise() {
    this.cantusFirmus = this.getRandomCantusFirmus();
    this.cantusFirmusEvent.emit(this.cantusFirmus);
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null);
    this.counterpointEvent.emit(this.counterpoint);
  }

  getRandomCantusFirmus(): Note[] {
    const randomIndex = Math.floor(Math.random() * CANTUS_FIRMUS_LIST.length);
    if (CANTUS_FIRMUS_LIST[randomIndex] === this.cantusFirmus) {
      return this.getRandomCantusFirmus();
    }
    return CANTUS_FIRMUS_LIST[randomIndex];
  }

  setRhythmicProportionGivenSpecies() {
    const speciesToRhythmicProportion: Record<string, number> = {
      "first": 1,
      "second": 2,
      "third": 4,
      "fourth": 2,
    };
    this.rhythmicProportion = speciesToRhythmicProportion[this.species];
  }
}
