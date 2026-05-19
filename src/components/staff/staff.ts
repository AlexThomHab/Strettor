import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import Vex, {Stave, StaveNote, Voice} from 'vexflow'
import {Note} from '../../models/note';
import {CounterpointValidator} from '../../service/CounterpointValidator';
import {Rule} from '../../models/rule';

@Component({
  selector: 'app-staff',
  imports: [],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})
export class Staff {
  @ViewChild('staffContainer')
  private staffContainer!: ElementRef;
  private stave!: Stave;
  private counterpointValidator : CounterpointValidator = new CounterpointValidator();
  @Input() cantusFirmus: Note[] = [];
  @Input() counterpoint: (Note | null)[] = Array(6).fill(null);
  @Output() counterpointResult: EventEmitter<Rule[] | null> = new EventEmitter();

  ngAfterViewInit() {
    this.drawExercise(this.counterpoint)
    this.staffContainer.nativeElement.addEventListener('click', (e: MouseEvent) => {
      this.addNote(e.clientY)
    })
  }

  private drawExercise(counterPointInput: (Note | null)[]): void {
    this.staffContainer.nativeElement.innerHTML = "";

    const {Renderer, Stave, StaveNote, Voice, Formatter, GhostNote} = Vex;
    const width = this.staffContainer.nativeElement.clientWidth;
    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    const context = renderer.getContext(); //context is the canvas that renderer renders to then draw on

    renderer.resize(width, 250);
    const cantusFirmusVoice = new Voice({numBeats: 10, beatValue: 1})
    cantusFirmusVoice.setStrict(false)

    const cantusFirmusNotes = [
      new StaveNote({keys: ['d/4'], duration: 'w'}),
      new StaveNote({keys: ['e/4'], duration: 'w'}),
      new StaveNote({keys: ['f/4'], duration: 'w'}),
      new StaveNote({keys: ['G/4'], duration: 'w'}),
      new StaveNote({keys: ['a/4'], duration: 'w'}),
      new StaveNote({keys: ['d/4'], duration: 'w'}),
    ]

    this.stave = new Stave(10, 80, width - 30);
    this.stave.addClef('treble');
    this.stave.setContext(context).draw();

    cantusFirmusVoice.addTickables(cantusFirmusNotes)
    new Formatter().joinVoices([cantusFirmusVoice]).format([cantusFirmusVoice], this.stave.getWidth() - 60)
    cantusFirmusVoice.draw(context, this.stave);

    const counterpointVoice = new Voice({numBeats: 10, beatValue: 1})
    counterpointVoice.setStrict(false)
    counterpointVoice.addTickables(
      counterPointInput.map(note =>
        note == null
          ? new GhostNote({duration: 'w'})
          : new StaveNote({keys: [this.toVexKey(note)], duration: 'w'})
      )
    )
    new Formatter().joinVoices([counterpointVoice]).format([counterpointVoice], this.stave.getWidth() - 60)
    counterpointVoice.draw(context, this.stave);
  }

  private addNote(clickYAxis: number) {
    const svg = this.staffContainer.nativeElement.querySelector('svg');
    let listOfPossibleInputNotes: Note[] = [
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
    const rect = svg.getBoundingClientRect();
    clickYAxis = clickYAxis - rect.top;
    let noteLineValue = this.stave.getLineForY(clickYAxis)
    let noteIndexRounded = Math.round(noteLineValue * 2) / 2
    let noteIndexInList = (4 - noteIndexRounded) / 0.5
    let inputNote = listOfPossibleInputNotes[noteIndexInList]
    if (!inputNote) return;
    this.counterpoint[this.counterpoint.indexOf(null)] = inputNote;
    this.drawExercise(this.counterpoint)
  }

  private toVexKey(note: Note): string {
    return note.noteValue.toLowerCase() + '/' + note.pitchClass;
  }
  public onReset(){
    this.counterpoint = Array(6).fill(null)
    this.counterpointResult.emit(null);
    this.drawExercise(this.counterpoint)
  }


  public onCheck(){
    let cantusFirmus1: Note[] = [
      new Note("D", 4),
      new Note("E", 4),
      new Note("F", 4),
      new Note("G", 4),
      new Note("A", 4),
      new Note("D", 4),
    ];
    const brokenRules = this.counterpointValidator.getBrokenRules(cantusFirmus1, this.counterpoint.filter(note => note !== null) as Note[]);
    this.counterpointResult.emit(brokenRules);
  }
}
