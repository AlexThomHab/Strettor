import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntervalRow } from './interval-row';

describe('IntervalRow', () => {
  let component: IntervalRow;
  let fixture: ComponentFixture<IntervalRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntervalRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntervalRow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
