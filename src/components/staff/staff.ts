import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import Vex, {Stave, StaveNote, Voice} from 'vexflow'
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
  private stave! : Stave;

  private toVexKey(note: Note): string {
    return note.noteValue.toLowerCase() + '/' + note.pitchClass;
  }

  @Input() cantusFirmus: Note[] = [];
  @Input() counterpoint: Note[] = [];

  ngAfterViewInit() {
    const {Renderer, Stave, StaveNote, Voice, Formatter} = Vex;
    const notes = [
      new StaveNote({keys: ['d/4'], duration: 'w'}),
      new StaveNote({keys: ['e/4'], duration: 'w'}),
      new StaveNote({keys: ['f/4'], duration: 'w'}),
      new StaveNote({keys: ['G/4'], duration: 'w'}),
      new StaveNote({keys: ['a/4'], duration: 'w'}),
      new StaveNote({keys: ['d/4'], duration: 'w'}),
      new StaveNote({keys: ['e/4'], duration: 'w'}),
      new StaveNote({keys: ['f/4'], duration: 'w'}),
      new StaveNote({keys: ['G/4'], duration: 'w'}),
      new StaveNote({keys: ['a/4'], duration: 'w'})
    ]
    const voice = new Voice({numBeats: 10, beatValue: 1}) //3 beats each beat value is worth one StaveNote
    voice.setStrict(false) //we don't need to have the notes = to number of beats
    voice.addTickables(notes)

    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    const width = this.staffContainer.nativeElement.clientWidth;
    renderer.resize(width, 200);
    const context = renderer.getContext(); //context is the canvas that renderer renders to then draw on
    this.stave = new Stave(10, 40, width - 30);
    this.stave.addClef('treble');
    new Formatter().joinVoices([voice]).format([voice], this.stave.getWidth() - 60)
    this.stave.setContext(context).draw(); //create staff with clef THEN we add CF
    voice.draw(context, this.stave);

    const svg = this.staffContainer.nativeElement.querySelector('svg');
    svg.addEventListener('click', (e: MouseEvent) => {
      let xAxis = e.clientX
      let yAxis = e.clientY
      this.addNote(xAxis, yAxis)
    })
  }

  private addNote(clickXAxis: number, clickYAxis: number) {
    const svg = this.staffContainer.nativeElement.querySelector('svg');
    let eLineYAxis = this.stave.getBottomLineY(); //lowest line on treble clef(E)
    let yDifferenceBetweenTwoLines =this.stave.getSpacingBetweenLines(); //lowest line on treble clef(E)
    //wanna split a gap into quarters. e.g F in FACE, lower quarter will go to E, 2 middle will go to F and then upper will go to G like in Tonesavvy
    let listOfPossibleInputNotes: Note[] = [
     /* new Note("A", 3),
      new Note("B", 3),
      new Note("C", 4),
      new Note("D", 4),*/
      new Note("E", 4),
      new Note("F", 4),
      new Note("G", 4),
      new Note("A", 4),
      new Note("B", 4),
      new Note("C", 5),
      new Note("D", 5),
      new Note("E", 5),
      new Note("F", 5),
      new Note("G", 5),
      new Note("A", 5)
    ];
    const rect = svg.getBoundingClientRect(); //convert clickYAxis to svgClickY because we only get the axis relative to the context not viewport
    clickYAxis = clickYAxis - rect.top;
    let noteLineValue = this.stave.getLineForY(clickYAxis)
    let noteIndexRounded = Math.round(noteLineValue * 2) / 2
    let noteIndexInList = (4 - noteIndexRounded) / 0.5
    let inputNote = listOfPossibleInputNotes[noteIndexInList]
    this.counterpoint.push(inputNote)
    const {StaveNote, Formatter, Voice, Renderer} = Vex;

    const voice = new Voice({numBeats: 10, beatValue: 1}) //3 beats each beat value is worth one StaveNote
    voice.setStrict(false) //we don't need to have the notes = to number of beats
    voice.addTickables([new StaveNote({keys: [this.toVexKey(inputNote)], duration: 'w'})])
    new Formatter().joinVoices([voice]).format([voice], this.stave.getWidth() - 60)
    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    const context = renderer.getContext();
    voice.draw(context, this.stave);
  }
}
