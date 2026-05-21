import { Routes } from '@angular/router';
import {FirstSpeciesExercise} from '../components/first-species-exercise/first-species-exercise';
import {SecondSpeciesExercise} from '../components/second-species-exercise/second-species-exercise';
import {ThirdSpeciesExercise} from '../components/third-species-exercise/third-species-exercise';
import {ThreeAgainstOneExercise} from '../components/three-against-one-exercise/three-against-one-exercise';

export const routes: Routes = [
  {path: '', redirectTo: 'first-species-exercise', pathMatch: 'full'},
  {path: 'first-species-exercise', component: FirstSpeciesExercise},
  {path: 'second-species-exercise', component: SecondSpeciesExercise},
  {path: 'three-against-one-exercise', component: ThreeAgainstOneExercise},
  {path: 'third-species-exercise', component: ThirdSpeciesExercise},
];
