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
  private counterpointValidator: CounterpointValidator = new CounterpointValidator();
  @Input() disabledRules: number[] = [];
  cantusFirmus: Note[] = [];
  @Input() counterpoint: (Note | null)[] = Array(0).fill(null);
  @Output() counterpointResult: EventEmitter<Rule[] | null> = new EventEmitter();
  @Input() rhythmicProportion: number = 1;
  private previewNote: (Note | null) = null;

  ngAfterViewInit() {
    this.drawExercise()
    this.staffContainer.nativeElement.addEventListener('click', (e: MouseEvent) => {
      this.addNote(e.clientY)
    })
    this.staffContainer.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
      this.onMouseHover(e.clientY)
    })
    this.staffContainer.nativeElement.addEventListener('mouseleave', (e: MouseEvent) => {
      this.onMouseLeave()
    })
  }

  private drawExercise(): void {
    this.staffContainer.nativeElement.innerHTML = "";

    const {Renderer, Stave, StaveNote, Voice, Formatter, GhostNote} = Vex;
    const width = this.staffContainer.nativeElement.clientWidth;
    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    const context = renderer.getContext(); //context is the canvas that renderer renders to then draw on
    renderer.resize(width, 350);
    context.scale(this.scaleFactor, this.scaleFactor);

    if (this.cantusFirmus.length === 0) {
      this.cantusFirmus = this.getRandomCantusFirmus()
      this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    }

    const cantusFirmusVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
    cantusFirmusVoice.setStrict(false)

    const cantusFirmusStaveNotes = this.notesToStaveNotes(this.cantusFirmus, 1);

    // @ts-ignore
    this.stave = new Stave(10, 65, (width - 30) / this.scaleFactor, {spacing_between_lines_px: 20});
    this.stave.addClef('treble');
    this.stave.setContext(context).draw();

    cantusFirmusVoice.addTickables(cantusFirmusStaveNotes)
    new Formatter().joinVoices([cantusFirmusVoice]).format([cantusFirmusVoice], this.stave.getWidth() - 60)
    cantusFirmusVoice.draw(context, this.stave);

    const counterpointVoice = new Voice({
      numBeats: this.cantusFirmus.length * this.rhythmicProportion,
      beatValue: this.rhythmicProportion
    }) //add counterpoint
    counterpointVoice.setStrict(false)
    let counterpointStaveNotes = this.notesToStaveNotes(this.counterpoint, this.rhythmicProportion)
    counterpointVoice.addTickables(counterpointStaveNotes)
    new Formatter().joinVoices([counterpointVoice]).format([counterpointVoice], this.stave.getWidth() - 60)

    if (this.previewNote != null) {
      const previewNoteVoice = new Voice({
        numBeats: this.cantusFirmus.length * this.rhythmicProportion,
        beatValue: this.rhythmicProportion
      })
      previewNoteVoice.setStrict(false)

      const previewNoteArray = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
      previewNoteArray[this.counterpoint.filter(x => x != null).length] = this.previewNote

      const previewStaveNotes = this.notesToStaveNotes(previewNoteArray, this.rhythmicProportion);
      const previewIndex = this.counterpoint.filter(x => x != null).length;
      previewStaveNotes[previewIndex].setStyle({fillStyle: 'rgba(0,0,0,0.4)', strokeStyle: 'rgba(0,0,0,0.4)'});

      previewNoteVoice.addTickables(previewStaveNotes)
      new Formatter().joinVoices([previewNoteVoice]).format([previewNoteVoice], this.stave.getWidth() - 60)
      previewNoteVoice.draw(context, this.stave);
    }
    counterpointVoice.draw(context, this.stave);
  }

  private addNote(clickYAxis: number) {
    let inputNote = this.getNoteGivenMouseY(clickYAxis);
    if (!inputNote) return;
    this.counterpoint[this.counterpoint.indexOf(null)] = inputNote;
    this.drawExercise()
  }

  private toVexKey(note: Note): string {
    return note.noteValue.toLowerCase() + '/' + note.pitchClass;
  }

  public onReset() {
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    this.counterpointResult.emit(null);
    this.drawExercise()
  }

  public onNextExercise() {
    this.cantusFirmus = this.getRandomCantusFirmus()
    this.counterpoint = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
    this.counterpointResult.emit(null);
    this.drawExercise()
  }

  public onCheck() {
    let counterpoint = this.counterpoint.filter(note => note !== null) as Note[];
    const brokenRules = this.counterpointValidator.getBrokenRules(this.cantusFirmus, counterpoint, this.disabledRules);
    this.counterpointResult.emit(brokenRules);
  }

  private getRandomCantusFirmus(): Note[] {
    const randomIndex = Math.floor(Math.random() * CANTUS_FIRMUS_LIST.length);
    if (CANTUS_FIRMUS_LIST[randomIndex] === this.cantusFirmus) {
      return this.getRandomCantusFirmus()
    }
    return CANTUS_FIRMUS_LIST[randomIndex];
  }

  private notesToStaveNotes(notes: (Note | null)[], rhythmicProportion: number) {
    const {GhostNote} = Vex;
    const duration = this.rhythmicProportionToNoteLength(rhythmicProportion);
    return notes.map(note =>
      note == null
        ? new GhostNote({duration})
        : new StaveNote({keys: [this.toVexKey(note)], duration})
    );
  }

  private staveNotesToNotes(staveNotes: StaveNote[]): Note[] {
    return staveNotes.map(sn => {
      const [notePart, octavePart] = sn.getKeys()[0].split('/');
      const noteName = notePart.charAt(0).toUpperCase() + notePart.slice(1);
      return new Note(noteName, parseInt(octavePart));
    });
  }

  private onMouseHover(clickYAxis: number) {
    let previewNote = this.getNoteGivenMouseY(clickYAxis);
    if (!previewNote) return;
    this.previewNote = previewNote;
    this.drawExercise()
  }

  getNoteGivenMouseY(mouseY: number): Note {
    const svg = this.staffContainer.nativeElement.querySelector('svg');
    let listOfPossibleInputNotes: Note[] = [
      new Note("G", 3),
      new Note("A", 3),
      new Note("B", 3),
      new Note("C", 4),
      new Note("D", 4),
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
      new Note("A", 5),
      new Note("B", 5)
    ];
    const rect = svg.getBoundingClientRect();
    mouseY = (mouseY - rect.top) / this.scaleFactor;
    let noteLineValue = this.stave.getLineForY(mouseY)
    let noteIndexRounded = Math.round(noteLineValue * 2) / 2
    let noteIndexInList = (6 - noteIndexRounded) / 0.5
    return listOfPossibleInputNotes[noteIndexInList]
  }

  private onMouseLeave() {
    this.previewNote = null
    this.drawExercise()
  }

  private rhythmicProportionToNoteLength(proportion: number): string {
    let rhythmToNoteList: string[] = ['w', 'h', 'q'];
    return rhythmToNoteList[proportion - 1]
  }
}
