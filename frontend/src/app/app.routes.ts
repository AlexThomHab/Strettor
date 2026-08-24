import { Routes } from '@angular/router';
import {SpeciesExerciseComponent} from '../components/species-exercise/species-exercise.component';
import {StrettoGenerator} from '../components/stretto-generator/stretto-generator';

export const routes: Routes = [
  {path: '', redirectTo: 'species-exercise/first', pathMatch: 'full'},
  {path: 'stretto-generator', component: StrettoGenerator},
  {path: 'species-exercise/:species', component: SpeciesExerciseComponent},];
