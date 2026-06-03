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
import {SpeciesExerciseModel} from '../../models/species-exercise';
import {ActivatedRoute} from '@angular/router';
import {
  SecondSpeciesCounterpointValidator
} from '../../service/second-species-counterpoint-validator/SecondSpeciesCounterpointValidator';
import {
  ThirdSpeciesCounterpointValidator
} from '../../service/third-species-counterpoint-validator/ThirdSpeciesCounterpointValidator';
import {
  FourthSpeciesCounterpointValidator
} from '../../service/fourth-species-counterpoint-validator/FourthSpeciesCounterpointValidator';

@Component({
  selector: 'app-species-exercise',
  imports: [Staff],
  templateUrl: './species-exercise.component.html',
  styleUrl: './species-exercise.component.css',
})
export class SpeciesExerciseComponent {
  brokenRules: Rule[] | null = null;
  protected readonly Error = Error;
  protected readonly length = length;
  listOfRules: Rule[] = [];
  ruleService: RuleService = new RuleService();
  warningRules: Rule[] = [];

  errorRules: Rule[] = [];
  suggestionRules: Rule[] = [];
  disabledRules: number[] = []
  species!: string;
  counterpoint: (Note | null)[] = Array(0).fill(null);
  @Output() counterpointEvent: EventEmitter<(Note | null)[]> = new EventEmitter();
  cantusFirmus: Note[] = [];
  private counterpointValidator!: ICounterpointValidator;
  private rhythmicProportion: number = 0;
  public speciesExerciseModel!: SpeciesExerciseModel;

  constructor(private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.species = this.route.snapshot.params['species'] ?? 'first';
      this.cantusFirmus = this.getRandomCantusFirmus()
      this.counterpointValidator = this.getValidatorGivenSpecies()
      this.speciesExerciseModel = this.getSpeciesExerciseModel()
      this.setRhythmicProportionGivenSpecies();
      this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
      this.listOfRules = this.ruleService.getRulesGivenSpecies(this.species)
      this.errorRules = this.listOfRules.filter(x => x.severity === Severity.Error);
      this.warningRules = this.listOfRules.filter(x => x.severity === Severity.Warning);
      this.suggestionRules = this.listOfRules.filter(x => x.severity === Severity.Suggestion);
    })
  }

  private getValidatorGivenSpecies(): ICounterpointValidator {
    let speciesToValidator: Record<string, ICounterpointValidator> = {
      "first": new FirstSpeciesCounterpointValidator(),
      "second": new SecondSpeciesCounterpointValidator(),
      "third": new ThirdSpeciesCounterpointValidator(),
      "fourth": new FourthSpeciesCounterpointValidator(),
    };
    return speciesToValidator[this.species];
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

  private getSpeciesExerciseModel(): SpeciesExerciseModel {
    let speciesToExerciseModel: Record<string, SpeciesExerciseModel> = {
      "first": new SpeciesExerciseModel("First", 1, "Enter counterpoint 1:1 against the given cantus firmus"),
      "second": new SpeciesExerciseModel("Second", 2, "Enter counterpoint 2:1 against the given cantus firmus"),
      "third": new SpeciesExerciseModel("Third", 4, "Enter counterpoint 4:1 against the given cantus firmus"),
      "fourth": new SpeciesExerciseModel("Fourth", 2, "Enter counterpoint suspensions against the given cantus firmus"),
      "fifth": new SpeciesExerciseModel("Fifth", 0, "Enter a florid melody")
    }
    return speciesToExerciseModel[this.species];
  }
}


