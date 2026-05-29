import { Routes } from '@angular/router';
import {FirstSpeciesExercise} from '../components/first-species-exercise/first-species-exercise';
import {SecondSpeciesExercise} from '../components/second-species-exercise/second-species-exercise';
import {ThirdSpeciesExercise} from '../components/third-species-exercise/third-species-exercise';
import {FourthSpeciesExercise} from '../components/fourth-species-exercise/fourth-species-exercise';
import {CounterpointChecker} from '../components/counterpoint-checker/counterpoint-checker';
import {SpeciesExerciseComponent} from '../components/species-exercise/species-exercise.component';

export const routes: Routes = [
  {path: '', redirectTo: 'first-species-exercise', pathMatch: 'full'},
  {path: 'first-species-exercise', component: FirstSpeciesExercise},
  {path: 'second-species-exercise', component: SecondSpeciesExercise},
  {path: 'third-species-exercise', component: ThirdSpeciesExercise},
  {path: 'fourth-species-exercise', component: FourthSpeciesExercise},
  {path: 'counterpoint-checker', component: CounterpointChecker},
  {path: 'species-exercise/:species', component: SpeciesExerciseComponent},];
