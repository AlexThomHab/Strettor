import {Component, EventEmitter, Output} from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule, Severity} from '../../models/rule';
import {RuleService} from '../../service/RuleService';
import {Note} from '../../models/note';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';
import {ICounterpointValidator} from '../../service/ICounterpointValidator';
import {
  FirstSpeciesCounterpointValidator
} from '../../service/first-species-counterpoint-validator/FirstSpeciesCounterpointValidator';

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
  suggestionRules: Rule[] = [];
  disabledRules: number[] = []
  species: string = "first";
  counterpoint: (Note | null)[] = Array(0).fill(null);
  @Output() counterpointEvent : EventEmitter<(Note | null)[]> = new EventEmitter();
  cantusFirmus: Note[] = [];
  private counterpointValidator: ICounterpointValidator = new FirstSpeciesCounterpointValidator();
  private rhythmicProportion: number = 0;

  ngOnInit() {
    this.cantusFirmus = this.getRandomCantusFirmus()
    this.setRhythmicProportionGivenSpecies();
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    this.listOfRules = this.ruleService.getFirstSpeciesRules()
    this.errorRules = this.listOfRules.filter(x => x.severity === Severity.Error);
    this.warningRules = this.listOfRules.filter(x => x.severity === Severity.Warning);
    this.suggestionRules = this.listOfRules.filter(x => x.severity === Severity.Suggestion);
  }

  hasOnlySuggestions(): boolean {
    return this.brokenRules !== null
      && this.brokenRules.length > 0
      && this.brokenRules.every(r => r.severity === Severity.Suggestion);
  }

  hasNoErrors(): boolean {
    return this.brokenRules !== null
      && this.brokenRules.length > 0
      && this.brokenRules.every(r => r.severity !== Severity.Error);
  }

  toggleRule(ruleId: number) {
    this.disabledRules.includes(ruleId) ? this.disabledRules = this.disabledRules.filter(x => x !== ruleId) : this.disabledRules.push(ruleId)
  }

  ruleIsEnabled(rule: Rule): boolean {
    return !this.disabledRules.includes(rule.id)
  }

  onCheck() {
    let counterpoint = this.counterpoint.filter(note => note !== null) as Note[];
    this.brokenRules = this.counterpointValidator.getBrokenRules(this.cantusFirmus, counterpoint, this.disabledRules);
  }

  onReset() {
    this.brokenRules = null;
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    this.counterpointEvent.emit(this.counterpoint)
  }

  public onNextExercise() {
    this.brokenRules = null;
    this.cantusFirmus = this.getRandomCantusFirmus()
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    this.counterpointEvent.emit(this.counterpoint)
  }

  getRandomCantusFirmus(): Note[] {
    const randomIndex = Math.floor(Math.random() * CANTUS_FIRMUS_LIST.length);
    if (CANTUS_FIRMUS_LIST[randomIndex] === this.cantusFirmus) {
      return this.getRandomCantusFirmus()
    }
    return CANTUS_FIRMUS_LIST[randomIndex];
  }
  setRhythmicProportionGivenSpecies() {
    var speciesToRhythmicProportion: Record<string, number> = {
      "first": 1,
      "second": 2,
      "third": 4,
      "fourth": 2,
    }
    this.rhythmicProportion = speciesToRhythmicProportion[this.species];
  }
}


