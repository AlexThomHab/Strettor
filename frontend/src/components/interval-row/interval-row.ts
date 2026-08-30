import {Component, Input, SimpleChanges} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CalculatedIntervalList} from '../../models/CalculatedIntervalList';
import {ThreeVoiceGivenJvIndexValuesCalculator} from '../../service/ThreeVoiceGivenJvIndexCalculator';
import {InvertibleCounterpointService} from '../../service/invertible-counterpoint.service';
import {Interval} from '../../models/Interval';
import {SuspensionTreatmentEnum} from '../../models/SuspensionTreatmentEnum';
import {MatTooltipModule} from '@angular/material/tooltip';

type Cell = {
  index: number;
  topGlyph: string;
  bottomGlyph: string;
  topTitle: string;
  bottomTitle: string;
  topClass?: string;
  bottomClass?: string;
  upgrade?: boolean;
  becomesAFourth?: boolean;
};

type CellsMap = Partial<Record<number, Cell>>;
type CellsRowTuple = [CellsMap, CellsMap, CellsMap];

function emptyDetailed(): CalculatedIntervalList {
  return {
    fixedConsonances: [],
    fixedDissonances: [],
    variableConsonances: [],
    variableDissonances: [],
  };
}

@Component({
  selector: 'app-interval-row',
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    MatTooltipModule,
    FormsModule,
    NgClass
  ],
  templateUrl: './interval-row.html',
  styleUrl: './interval-row.css'
})

export class IntervalRow {
  @Input() _twoVoiceCells: CellsMap = {};
  @Input() _intervals: CalculatedIntervalList = emptyDetailed();
  @Input() _intervalsList = [0, 1, 2, 3, 4, 5, 6, 7];
  @Input() _jvInput = 0;
  _jvPrimeInput = 0;
  _jvDoublePrimeInput = 0;
  _jvSigmaView = 0;
  _threeRows: [CalculatedIntervalList, CalculatedIntervalList, CalculatedIntervalList] = [
    emptyDetailed(),
    emptyDetailed(),
    emptyDetailed(),
  ];

  _threeRowsCells: CellsRowTuple = [{}, {}, {}];

  private threeCalc = new ThreeVoiceGivenJvIndexValuesCalculator();
  constructor(private invertibleCounterpointService: InvertibleCounterpointService){
    this.recomputeTwoVoice();
    this.recomputeThreeVoice();
  }

  toIndexList(intervalsWithSuspensions?: Interval[] | null): string {
    return (intervalsWithSuspensions ?? []).map(x => x.index).join(', ');
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['_jvInput']) {
      this.recomputeTwoVoice();
    }
  }
  getClassForIndex(i: number): string {
    if (this._intervals.fixedConsonances.some(x => x.index === i)) return 'cell fixedConsonant';
    if (this._intervals.fixedDissonances.some(x => x.index === i)) return 'cell fixedDissonant';
    if (this._intervals.variableConsonances.some(x => x.index === i)) return 'cell variableConsonant';
    if (this._intervals.variableDissonances.some(x => x.index === i)) return 'cell variableDissonant';
    return 'cell';
  }

  private recomputeTwoVoice() {
    this._intervals = this.invertibleCounterpointService.calculate(this._jvInput);
    this._twoVoiceCells = this.buildGridMap(this._intervals)
  }
  private recomputeThreeVoice() {
    const sigma = this._jvPrimeInput + this._jvDoublePrimeInput;
    this._jvSigmaView = sigma;

    const rows = this.threeCalc.calculate(this._jvPrimeInput, this._jvDoublePrimeInput, sigma);
    this._threeRows = [rows[0] ?? emptyDetailed(), rows[1] ?? emptyDetailed(), rows[2] ?? emptyDetailed()];

    const detailedRows = this.threeCalc.calculate(this._jvPrimeInput, this._jvDoublePrimeInput, sigma);
    this._threeRowsCells = [
      this.buildGridMap(detailedRows[0]),
      this.buildGridMap(detailedRows[1]),
      this.buildGridMap(detailedRows[2]),
    ];
  }

  private buildGridMap(det?: CalculatedIntervalList): CellsMap {
    const cells: CellsMap = {};
    if (!det) return cells;
    const all = [
      ...det.fixedConsonances,
      ...det.fixedDissonances,
      ...det.variableConsonances,
      ...det.variableDissonances,
    ];
    for (const interval of all) {
      cells[interval.index] = {
        index: interval.index,
        topGlyph: this.glyphFor(interval.upperSuspensionTreatment),
        bottomGlyph: this.glyphFor(interval.lowerSuspensionTreatment),
        topTitle: this.fullName(interval.upperSuspensionTreatment, 'Upper'),
        bottomTitle: this.fullName(interval.lowerSuspensionTreatment, 'Lower'),
        topClass: this.glyphExtraClass(interval.upperSuspensionTreatment),
        bottomClass: this.glyphExtraClass(interval.lowerSuspensionTreatment),
        upgrade: interval.imperfectBecomesPerfect,
        becomesAFourth: interval.becomesAFourth,
      };
    }
    return cells;
  }
  private glyphFor(t: SuspensionTreatmentEnum): string {
    switch (t) {
      case SuspensionTreatmentEnum.CannotFormSuspension:
        return '(-)';
      case SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension:
        return '-';
      case SuspensionTreatmentEnum.NoteOfResolutionIsDissonant:
        return 'x';
      case SuspensionTreatmentEnum.NoteOfResolutionIsFree:
        return '---';
      case SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant:
        return '-x';
      default:
        return '';
    }
  }
  private fullName(treatmentEnum: SuspensionTreatmentEnum, voice: 'Upper' | 'Lower'): string {
    const base =
      treatmentEnum === SuspensionTreatmentEnum.CannotFormSuspension ? 'Cannot form a suspension' :
        treatmentEnum === SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension ? 'If on downbeat, must form suspension' :
          treatmentEnum === SuspensionTreatmentEnum.NoteOfResolutionIsDissonant ? 'If forming suspension, note of resolution is dissonant' :
            treatmentEnum === SuspensionTreatmentEnum.NoteOfResolutionIsFree ? 'If forming suspension, note of resolution is free' :
              treatmentEnum === SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant ? 'Both conditions apply' : '';
    return `${voice}: ${base}`;
  }
  private glyphExtraClass(suspensionTreatmentEnum: SuspensionTreatmentEnum): string {
    return suspensionTreatmentEnum === SuspensionTreatmentEnum.NoteOfResolutionIsDissonant ? 'xsmall' : '';
  }
}
