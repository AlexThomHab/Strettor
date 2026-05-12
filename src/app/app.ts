import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FirstSpeciesExercise} from '../components/first-species-exercise/first-species-exercise';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FirstSpeciesExercise],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Strettor');
}
