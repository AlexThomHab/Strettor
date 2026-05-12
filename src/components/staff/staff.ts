import {Component, ElementRef, ViewChild} from '@angular/core';
import Vex from 'vexflow'

@Component({
  selector: 'app-staff',
  imports: [],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
})


export class Staff {
  @ViewChild('staffContainer')
  private staffContainer! : ElementRef;

  ngAfterViewInit() {
    const { Renderer, Stave } = Vex;
    const renderer = new Renderer(this.staffContainer.nativeElement, Renderer.Backends.SVG);
    renderer.resize(500, 200);
    const context = renderer.getContext();
    const stave = new Stave(10, 40, 400);
    stave.addClef('treble');
    stave.setContext(context).draw();
  }
}
