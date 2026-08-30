import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatCard} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CalculatedIntervalList} from '../../models/CalculatedIntervalList';
import {IntervalRow} from '../interval-row/interval-row';

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

function emptyDetailed(): CalculatedIntervalList {
  return {
    fixedConsonances: [],
    fixedDissonances: [],
    variableConsonances: [],
    variableDissonances: [],
  };
}

@Component({
  selector: 'app-counterpoint-ui',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCard, MatTooltipModule, IntervalRow],
  templateUrl: './counterpoint-ui.component.html',
  styleUrls: ['./counterpoint-ui.component.css'],
})

export class CounterpointUiComponent {
  _dark = false;
  _activeTab: 'two' | 'three' = 'two';
  _intervalJvList = [0, 1, 2, 3, 4, 5, 6, 7];
  _jvInput = 0;
  _intervals: CalculatedIntervalList = emptyDetailed();
  _cells: CellsMap = {};
  _jvPrimeInput = 0;
  _jvDoublePrimeInput = 0;
  _jvSigmaView = 0;

  constructor() {
    const saved = localStorage.getItem('theme');
    this._dark = saved ? saved === 'dark'
      : (typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  toggleDark() {
    this._dark = !this._dark;
    localStorage.setItem('theme', this._dark ? 'dark' : 'light');
  }

  CalculateJvSigma() {
    this._jvSigmaView = this._jvPrimeInput + this._jvDoublePrimeInput;
  }
}
