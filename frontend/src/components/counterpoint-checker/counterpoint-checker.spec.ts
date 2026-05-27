import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterpointChecker } from './counterpoint-checker';

describe('CounterpointChecker', () => {
  let component: CounterpointChecker;
  let fixture: ComponentFixture<CounterpointChecker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterpointChecker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterpointChecker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
