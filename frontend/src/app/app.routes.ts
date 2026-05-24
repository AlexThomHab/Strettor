import { Routes } from '@angular/router';
import {FirstSpeciesExercise} from '../components/first-species-exercise/first-species-exercise';
import {SecondSpeciesExercise} from '../components/second-species-exercise/second-species-exercise';
import {ThirdSpeciesExercise} from '../components/third-species-exercise/third-species-exercise';
import {SergeiTaneyevVerticalShifting} from '../components/sergei-taneyev-vertical-shifting/sergei-taneyev-vertical-shifting';
import {StrettoGenerator} from '../components/stretto-generator/stretto-generator';
import {FourthSpeciesExercise} from '../components/fourth-species-exercise/fourth-species-exercise';

export const routes: Routes = [
  {path: '', redirectTo: 'first-species-exercise', pathMatch: 'full'},
  {path: 'first-species-exercise', component: FirstSpeciesExercise},
  {path: 'second-species-exercise', component: SecondSpeciesExercise},
  {path: 'third-species-exercise', component: ThirdSpeciesExercise},
  {path: 'fourth-species-exercise', component: FourthSpeciesExercise},
  {path: 'sergei-taneyev-vertical-shifting', component: SergeiTaneyevVerticalShifting},
  {path: 'stretto-generator', component: StrettoGenerator},
];
