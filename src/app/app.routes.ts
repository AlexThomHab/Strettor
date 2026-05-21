import { Routes } from '@angular/router';
import {FirstSpeciesExercise} from '../components/first-species-exercise/first-species-exercise';
import {SecondSpeciesExercise} from '../components/second-species-exercise/second-species-exercise';

export const routes: Routes = [
  {path: '', redirectTo: 'first-species-exercise', pathMatch: 'full'},
  {path: 'first-species-exercise', component: FirstSpeciesExercise},
  {path: 'second-species-exercise', component: SecondSpeciesExercise},
];
