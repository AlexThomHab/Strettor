import { Component } from '@angular/core';
import {Staff} from '../staff/staff';
import {Rule} from '../../models/rule';

@Component({
  selector: 'app-first-species-exercise',
  imports: [Staff],
  templateUrl: './first-species-exercise.html',
  styleUrl: './first-species-exercise.css',
})
export class FirstSpeciesExercise {
  brokenRules: Rule[] | null = null;
}
