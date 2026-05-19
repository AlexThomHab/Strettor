import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import Vex, {Stave, StaveNote, Voice} from 'vexflow'
import {Note} from '../../models/note';
import {CounterpointValidator} from '../../service/CounterpointValidator';
import {Rule} from '../../models/rule';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';
import {RuleIdEnum} from '../../models/rule'

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
  private readonly scaleFactor = 1.5;
  private counterpointValidator : CounterpointValidator = new CounterpointValidator();
  private disabledRules : number[] = [];
  cantusFirmus: Note[] = [];
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
    renderer.resize(width, 350);
    context.scale(this.scaleFactor, this.scaleFactor);

    if (this.cantusFirmus.length === 0) {
      this.cantusFirmus = this.getRandomCantusFirmus()
      this.counterpoint = Array(this.cantusFirmus.length).fill(null)
    }

    const cantusFirmusVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
    cantusFirmusVoice.setStrict(false)

    const cantusFirmusStaveNotes = this.notesToStaveNotes(this.cantusFirmus);

    // @ts-ignore
    this.stave = new Stave(10, 65, (width - 30) / this.scaleFactor, {spacing_between_lines_px: 20});
    this.stave.addClef('treble');
    this.stave.setContext(context).draw();

    cantusFirmusVoice.addTickables(cantusFirmusStaveNotes)
    new Formatter().joinVoices([cantusFirmusVoice]).format([cantusFirmusVoice], this.stave.getWidth() - 60)
    cantusFirmusVoice.draw(context, this.stave);

    const counterpointVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
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
    clickYAxis = (clickYAxis - rect.top) / this.scaleFactor;
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
    this.counterpoint = Array(this.cantusFirmus.length).fill(null)
    this.counterpointResult.emit(null);
    this.drawExercise(this.counterpoint)
  }
  public onNextExercise(){
    this.cantusFirmus = this.getRandomCantusFirmus()
    this.counterpoint = Array(this.cantusFirmus.length).fill(null)
    this.counterpointResult.emit(null);
    this.drawExercise(this.counterpoint)
  }

  public onCheck(){
    let counterpoint = this.counterpoint.filter(note => note !== null) as Note[];
    const brokenRules = this.counterpointValidator.getBrokenRules(this.cantusFirmus, counterpoint, this.disabledRules);
    this.counterpointResult.emit(brokenRules);
  }
  private getRandomCantusFirmus(){
    const randomIndex = Math.floor(Math.random() * CANTUS_FIRMUS_LIST.length);
    return CANTUS_FIRMUS_LIST[randomIndex];
  }
  private notesToStaveNotes(notes: Note[]): StaveNote[] {
    return notes.map(note => new StaveNote({keys: [this.toVexKey(note)], duration: 'w'}));
  }

  private staveNotesToNotes(staveNotes: StaveNote[]): Note[] {
    return staveNotes.map(sn => {
      const [notePart, octavePart] = sn.getKeys()[0].split('/');
      const noteName = notePart.charAt(0).toUpperCase() + notePart.slice(1);
      return new Note(noteName, parseInt(octavePart));
    });
  }
}
