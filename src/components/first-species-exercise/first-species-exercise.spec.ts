import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstSpeciesExercise } from './first-species-exercise';

describe('FirstSpeciesExercise', () => {
  let component: FirstSpeciesExercise;
  let fixture: ComponentFixture<FirstSpeciesExercise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstSpeciesExercise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirstSpeciesExercise);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
