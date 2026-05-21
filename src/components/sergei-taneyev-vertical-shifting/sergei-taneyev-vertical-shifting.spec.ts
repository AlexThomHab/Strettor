import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SergeiTaneyevVerticalShifting } from './sergei-taneyev-vertical-shifting';

describe('SergeiTaneyevVerticalShifting', () => {
  let component: SergeiTaneyevVerticalShifting;
  let fixture: ComponentFixture<SergeiTaneyevVerticalShifting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SergeiTaneyevVerticalShifting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SergeiTaneyevVerticalShifting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
