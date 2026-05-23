import {Component, ViewChild} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Staff} from '../staff/staff';

@Component({
  selector: 'app-stretto-generator',
  imports: [RouterModule, Staff],
  templateUrl: './stretto-generator.html',
  styleUrl: './stretto-generator.css',
})
export class StrettoGenerator {
  @ViewChild('staff') staff!: Staff;
}
