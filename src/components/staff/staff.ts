import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import Vex from 'vexflow'
import {Note} from '../../models/note';

@Component({
  selector: 'app-staff',
  imports: [],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff {
  @ViewChild('staffContainer')
  private staffContainer!: ElementRef;

  private toVexKey(note: Note): string {
    return note.noteValue.toLowerCase() + '/' + note.pitchClass;
  }

  @Input() notes: Note[] = [];

  ngAfterViewInit() {
    const {Renderer, Stave, StaveNote, Voice, Formatter} = Vex;
    const notes = [
      new StaveNote({keys: ['d/4'], duration: 'w'}),
      new StaveNote({keys: ['e/4'], duration: 'w'}),
      new StaveNote({keys: ['f/4'], duration: 'w'})
    ]
    const voice = new Voice({numBeats: 3, beatValue: 1}) //3 beats each beat value is worth one StaveNote
    voice.setStrict(false) //we don't need to have the notes = to number of beats
    voice.addTickables(notes)

    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    const width = this.staffContainer.nativeElement.clientWidth;
    renderer.resize(width, 200);
    const context = renderer.getContext();
    const stave = new Stave(10, 40, width - 30);
    stave.addClef('treble');
    new Formatter().joinVoices([voice]).format([voice], stave.getWidth() - 60)
    stave.setContext(context).draw(); //create staff with clef THEN we add CF
    voice.draw(context, stave);
  }
}
