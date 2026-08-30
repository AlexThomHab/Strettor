import { Routes } from '@angular/router';
import {SpeciesExerciseComponent} from '../components/species-exercise/species-exercise.component';
import {StrettoGenerator} from '../components/stretto-generator/stretto-generator';
import {CounterpointUiComponent} from '../components/counterpoint-ui/counterpoint-ui.component';

export const routes: Routes = [
  {path: '', redirectTo: 'species-exercise/first', pathMatch: 'full'},
  {path: 'stretto-generator', component: StrettoGenerator},
  {path: 'vertical-shifting-counterpoint', component: CounterpointUiComponent},
  {path: 'species-exercise/:species', component: SpeciesExerciseComponent},];
