import { Routes } from '@angular/router';
import {CounterpointChecker} from '../components/counterpoint-checker/counterpoint-checker';
import {SpeciesExerciseComponent} from '../components/species-exercise/species-exercise.component';

export const routes: Routes = [
  {path: '', redirectTo: 'species-exercise/first', pathMatch: 'full'},
  {path: 'counterpoint-checker', component: CounterpointChecker},
  {path: 'species-exercise/:species', component: SpeciesExerciseComponent},];
