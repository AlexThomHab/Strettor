import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import Vex, { Stave } from 'vexflow';

@Component({
  selector: 'app-stretto-generator',
  imports: [],
  templateUrl: './stretto-generator.html',
  styleUrl: './stretto-generator.css',
})
export class StrettoGenerator implements AfterViewInit {

  @ViewChild('staffContainer')
  private staffContainer!: ElementRef;

  private readonly scaleFactor = 1.5;
  private stave!: Stave;

  ngAfterViewInit(): void {
    this.drawStaff();
  }

  private drawStaff(): void {

    const { Renderer, Stave } = Vex;

    const containerWidth =
      this.staffContainer.nativeElement.clientWidth;

    const renderer = new Renderer(
      this.staffContainer.nativeElement,
      Renderer.Backends.SVG
    );

    const svgWidth = containerWidth;

    renderer.resize(svgWidth, 350);

    const context = renderer.getContext();

    context.scale(
      this.scaleFactor,
      this.scaleFactor
    );

    const staveWidth =
      (svgWidth - 30) / this.scaleFactor;

    // @ts-ignore
    this.stave = new Stave(
      10,
      65,
      staveWidth,
      {
        spacingBetweenLinesPx: 20
      }
    );

    this.stave.addClef('treble');

    this.stave
      .setContext(context)
      .draw();
  }
}
