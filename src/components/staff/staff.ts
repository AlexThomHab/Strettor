import {Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import Vex, {Stave, StaveNote, Dot, StaveTie} from 'vexflow'
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
  private stave!: Stave;
  private readonly scaleFactor = 1.5;
  @Input() disabledRules: number[] = [];
  @Input() cantusFirmus: Note[] = [];
  @Input() counterpoint: (Note | null)[] = [];
  @Output() counterpointChange = new EventEmitter<(Note | null)[]>();
  @Input() rhythmicProportion: number = 1;
  @Input() species!: string;
  private previewNote: (Note | null) = null;
  private previewNoteXIndex: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (!this.staffContainer) return;

    if (changes['cantusFirmus'] || changes['counterpoint']) {
      this.drawExercise()
    }
  }

  ngAfterViewInit() {
    this.setRhythmicProportionGivenSpecies()
    this.drawExercise()
    this.staffContainer.nativeElement.addEventListener('click', (e: MouseEvent) => {
      this.addNoteGivenClick(e.clientY, e.clientX)
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
    // @ts-ignore
    this.stave = new Stave(10, 65, (width - 30) / this.scaleFactor, {spacing_between_lines_px: 20});
    this.stave.addClef('treble');
    this.stave.setContext(context).draw();

    const cantusFirmusVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
    cantusFirmusVoice.setStrict(false)

    const cantusFirmusStaveNotes = this.cantusfirmusNotesToStaveNotes(this.cantusFirmus);

    cantusFirmusVoice.addTickables(cantusFirmusStaveNotes)

    const counterpointVoice = new Voice({
      numBeats: this.cantusFirmus.length * this.rhythmicProportion,
      beatValue: this.rhythmicProportion
    })
    counterpointVoice.setStrict(false)
    const counterpointStaveNotes = this.counterpointNotesToStaveNotes(this.counterpoint)

    counterpointVoice.addTickables(counterpointStaveNotes)

    new Formatter()
      .joinVoices([cantusFirmusVoice, counterpointVoice])
      .format([cantusFirmusVoice, counterpointVoice], this.stave.getWidth() - 60)

    cantusFirmusVoice.draw(context, this.stave);

    if (this.previewNote != null) {
      const previewNoteArray = Array(this.cantusFirmus.length * this.rhythmicProportion).fill(null)
      previewNoteArray[this.previewNoteXIndex] = this.previewNote

      const previewStaveNotes = this.counterpointNotesToStaveNotes(previewNoteArray)
      previewStaveNotes[this.previewNoteXIndex].setStyle({
        fillStyle: 'rgba(0,0,0,0.4)',
        strokeStyle: 'rgba(0,0,0,0.4)'
      })

      const previewNoteVoice = new Voice({
        numBeats: this.cantusFirmus.length * this.rhythmicProportion,
        beatValue: this.rhythmicProportion
      })
      previewNoteVoice.setStrict(false)
      previewNoteVoice.addTickables(previewStaveNotes)

      const previewCFVoice = new Voice({numBeats: this.cantusFirmus.length, beatValue: 1})
      previewCFVoice.setStrict(false)
      previewCFVoice.addTickables(this.cantusfirmusNotesToStaveNotes(this.cantusFirmus))

      new Formatter()
        .joinVoices([previewCFVoice, previewNoteVoice])
        .format([previewCFVoice, previewNoteVoice], this.stave.getWidth() - 60)

      previewNoteVoice.draw(context, this.stave);
    }

    counterpointVoice.draw(context, this.stave);

    if (this.species === "fourth") {
      for (let i = 1; i < counterpointStaveNotes.length - 1; i += 2) {
        if (this.counterpoint[i] == null && i < this.counterpoint.length) continue;
        if (i + 1 === counterpointStaveNotes.length - 2) continue;
        const tie = new StaveTie({
          firstNote: counterpointStaveNotes[i],
          lastNote: counterpointStaveNotes[i + 1],
          firstIndexes: [0],
          lastIndexes: [0]
        });
        tie.setContext(context).draw();
      }
    }
  }

  private addNoteGivenClick(clickYAxis: number, clickXAxis: number): void {
    let inputNote = this.getNoteGivenMouseY(clickYAxis);
    let beatIndex = this.getBeatPositionGivenMouseX(clickXAxis)
    if (!inputNote) return;

    if (this.species === "fourth" && beatIndex != 0 && beatIndex < this.counterpoint.length - 2) {
      const pairStart = beatIndex % 2 == 1 ? beatIndex : beatIndex - 1;
      this.counterpoint[pairStart] = inputNote;
      if (pairStart + 1 !== this.counterpoint.length - 2) {
        this.counterpoint[pairStart + 1] = inputNote;
      }
    }

    else if (this.species === "fourth" && (beatIndex == 0 || beatIndex == this.counterpoint.length - 1)) {

    }

    else {
      this.counterpoint[beatIndex] = inputNote;
    }
    this.drawExercise()
  }

  private toVexKey(note: Note): string {
    return note.noteValue.toLowerCase() + '/' + note.pitchClass;
  }


  private counterpointNotesToStaveNotes(notes: (Note | null)[]) {
    const duration = this.counterpointRhythmicProportionToNoteLength(this.rhythmicProportion);
    return notes.map((note, index) => {
      if (note == null) {
        const placeholder = new StaveNote({keys: ['f/5'], duration});
        placeholder.setStyle({fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)'});
        return placeholder;
      }
      if (this.species === "fourth" && index === notes.length - 2) {
        return new StaveNote({keys: [this.toVexKey(note)], duration: 'w'});
      }
      if (this.species === "fourth" && index === notes.length - 3) {
        return new StaveNote({keys: [this.toVexKey(note)], duration: 'h'});
      }
      return new StaveNote({keys: [this.toVexKey(note)], duration});
    });

  }

  private cantusfirmusNotesToStaveNotes(notes: Note[]): StaveNote[] {
    return notes.map(note => new StaveNote({keys: [this.toVexKey(note)], duration: 'w'}));
  }

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
      new Note("B", 5),
      new Note("C", 6),

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
    let rawIndex = ((x - noteStartX) / division);
    if (this.rhythmicProportion > 1) {
      rawIndex = rawIndex - (1 / this.rhythmicProportion);
    }
    return Math.max(0, Math.min(totalSlots - 1, Math.floor(rawIndex)));
  }

  setRhythmicProportionGivenSpecies() {
    var speciesToRhythmicProportion: Record<string, number> = {
      "first": 1,
      "second": 2,
      "third": 4,
      "fourth": 2,
    }
    this.rhythmicProportion = speciesToRhythmicProportion[this.species];
  }
}
