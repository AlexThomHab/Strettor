import { Routes } from '@angular/router';
import {SpeciesExerciseComponent} from '../components/species-exercise/species-exercise.component';
import {StrettoGenerator} from '../components/stretto-generator/stretto-generator';
import {VerticalShiftingCounterpoint} from '../components/counterpoint-ui/vertical-shifting-counterpoint.component';

export const routes: Routes = [
  {path: '', redirectTo: 'species-exercise/first', pathMatch: 'full'},
  {path: 'stretto-generator', component: StrettoGenerator},
  {path: 'vertical-shifting-counterpoint', component: VerticalShiftingCounterpoint},
  {path: 'species-exercise/:species', component: SpeciesExerciseComponent},];
