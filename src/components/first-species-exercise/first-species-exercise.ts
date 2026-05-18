import { Component } from '@angular/core';
import {Staff} from '../staff/staff';

@Component({
  selector: 'app-first-species-exercise',
  imports: [Staff],
  templateUrl: './first-species-exercise.html',
  styleUrl: './first-species-exercise.css',
})
export class FirstSpeciesExercise {
  result: boolean | null = null;

}
