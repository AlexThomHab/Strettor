import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import Vex, {Stave, StaveNote, Dot, Voice} from 'vexflow'
import {Note} from '../../models/note';
import {ICounterpointValidator} from '../../service/ICounterpointValidator';
import {FirstSpeciesCounterpointValidator} from '../../service/first-species-counterpoint-validator/FirstSpeciesCounterpointValidator';
import {Rule} from '../../models/rule';
import {CANTUS_FIRMUS_LIST} from '../../data/cantus-firmus.data';

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
  @Input() counterpointValidator: ICounterpointValidator = new FirstSpeciesCounterpointValidator();
  @Input() disabledRules: number[] = [];
  cantusFirmus: Note[] = [];
  @Input() counterpoint: (Note | null)[] = Array(0).fill(null);
  @Output() counterpointResult: EventEmitter<Rule[] | null> = new EventEmitter();
  @Input() rhythmicProportion: number = 1;
  private previewNote: (Note | null) = null;
  private previewNoteXIndex: number = 0;

  ngAfterViewInit() {
    this.drawExercise()
    this.staffContainer.nativeElement.addEventListener('click', (e: MouseEvent) => {
      this.addNote(e.clientY, e.clientX)
    })
    this.staffContainer.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
      this.onMouseHover(e.clientY, e.clientX)
    })
    this.staffContainer.nativeElement.addEventListener('mouseleave', (e: MouseEvent) => {
      this.onMouseLeave()
    })
  }

  private drawExercise(): void {
    this.staffContainer.nativeElement.innerHTML = "";

    const {Renderer, Stave, StaveNote, Voice, Formatter} = Vex;
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

    const cantusFirmusStaveNotes = this.cantusfirmusNotesToStaveNotes(this.cantusFirmus, this.getCantusFirmusNoteLength());

    // @ts-ignore
    this.stave = new Stave(10, 65, (width - 30) / this.scaleFactor, {spacing_between_lines_px: 20});
    this.stave.addClef('treble');
    this.stave.setContext(context).draw();

    cantusFirmusVoice.addTickables(cantusFirmusStaveNotes)

    const counterpointVoice = new Voice({
      numBeats: this.cantusFirmus.length * this.rhythmicProportion,
      beatValue: this.rhythmicProportion
    })
    counterpointVoice.setStrict(false)
    let counterpointStaveNotes = this.counterpointNotesToStaveNotes(this.counterpoint, this.rhythmicProportion)
    counterpointVoice.addTickables(counterpointStaveNotes)

    // Join voices only when CP ticks divide evenly into a whole note (4096 ticks).
    // Odd proportions like 3 produce a tick mismatch and distort the CF if joined.
    const ticksAlign = 4096 % this.rhythmicProportion === 0;
    if (ticksAlign) {
      new Formatter()
        .joinVoices([cantusFirmusVoice, counterpointVoice])
        .format([cantusFirmusVoice, counterpointVoice], this.stave.getWidth() - 60)
    } else {
      new Formatter().joinVoices([cantusFirmusVoice]).format([cantusFirmusVoice], this.stave.getWidth() - 60)
      new Formatter().joinVoices([counterpointVoice]).format([counterpointVoice], this.stave.getWidth() - 60)
    }

    cantusFirmusVoice.draw(context, this.stave);

    if (this.previewNote != null && this.counterpoint.filter(x => x != null).length != this.cantusFirmus.length * this.rhythmicProportion) {
      const previewNoteVoice = new Voice({
        numBeats: this.cantusFirmus.length * this.rhythmicProportion,
        beatValue: this.rhythmicProportion
      })
      previewNoteVoice.setStrict(false)

      const previewNoteArray = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
      previewNoteArray[this.previewNoteXIndex] = this.previewNote

      const previewStaveNotes = this.counterpointNotesToStaveNotes(previewNoteArray, this.rhythmicProportion);
      previewStaveNotes[this.previewNoteXIndex].setStyle({fillStyle: 'rgba(0,0,0,0.4)', strokeStyle: 'rgba(0,0,0,0.4)'});

      previewNoteVoice.addTickables(previewStaveNotes)
      const previewCFVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
      previewCFVoice.setStrict(false)
      previewCFVoice.addTickables(this.counterpointNotesToStaveNotes(this.cantusFirmus, 1))
      new Formatter()
        .joinVoices([previewCFVoice, previewNoteVoice])
        .format([previewCFVoice, previewNoteVoice], this.stave.getWidth() - 60)
      previewNoteVoice.draw(context, this.stave);
    }

    counterpointVoice.draw(context, this.stave);
  }

  private getCantusFirmusNoteLength() {
    if (this.rhythmicProportion == 3){
      return 2.5 //if we're doing 3:1 counterpoint return a dotted half note
    }
    return 1;

  }

  private addNote(clickYAxis: number, clickXAxis: number): void {
    let inputNote = this.getNoteGivenMouseY(clickYAxis);
    let beatIndex = this.getBeatPositionGivenMouseX(clickXAxis)
    if (!inputNote) return;
    this.counterpoint[beatIndex] = inputNote;
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

  private counterpointNotesToStaveNotes(notes: (Note | null)[], rhythmicProportion: number) {
    const duration = this.counterpointRhythmicProportionToNoteLength(rhythmicProportion);
    return notes.map(note => {
      if (note == null) {
        const placeholder = new StaveNote({keys: ['b/4'], duration});
        placeholder.setStyle({fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)'});
        return placeholder;
      }
      return new StaveNote({keys: [this.toVexKey(note)], duration});
    });
  }
  private cantusfirmusNotesToStaveNotes(notes: Note[], rhythmicProportion: number) : StaveNote[] {
    if (rhythmicProportion == 2.5) {
      const noteList = notes.map(note => new StaveNote({keys: [this.toVexKey(note)], duration: 'h'}));
      Dot.buildAndAttach(noteList, { all: true });
      return noteList;
    }
    return notes.map(note => new StaveNote({keys: [this.toVexKey(note)], duration: 'w'}));
  }

  /* private staveNotesToNotes(staveNotes: StaveNote[]): Note[] {
     return staveNotes.map(sn => {
       const [notePart, octavePart] = sn.getKeys()[0].split('/');
       const noteName = notePart.charAt(0).toUpperCase() + notePart.slice(1);
       return new Note(noteName, parseInt(octavePart));
     });
   }
 */
  private onMouseHover(hoverYAxis: number, hoverXAxis: number) {
    let previewNote = this.getNoteGivenMouseY(hoverYAxis);
    this.previewNoteXIndex = this.getBeatPositionGivenMouseX(hoverXAxis);
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

  private counterpointRhythmicProportionToNoteLength(proportion: number): string {
    let rhythmToNoteList: string[] = ['w', 'h', 'q', 'q'];
    return rhythmToNoteList[proportion - 1]
  }

  private getBeatPositionGivenMouseX(hoverXAxis: number): number {
    const svg = this.staffContainer.nativeElement.querySelector('svg');
    const rect = svg.getBoundingClientRect();
    const x = (hoverXAxis - rect.left) / this.scaleFactor;
    const noteStartX = this.stave.getNoteStartX();
    const noteWidth = this.stave.getWidth() - 60;
    const totalSlots = this.cantusFirmus.length * this.rhythmicProportion;
    const division = noteWidth / totalSlots;
    let rawIndex = ((x - noteStartX) / division) ;
    if (this.rhythmicProportion > 1) {
      rawIndex = rawIndex - (1/this.rhythmicProportion);
    }
    return Math.max(0, Math.min(totalSlots - 1, Math.floor(rawIndex)));
  }
}
