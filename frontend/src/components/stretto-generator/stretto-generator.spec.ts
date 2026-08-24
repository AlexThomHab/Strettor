import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrettoGenerator } from './stretto-generator';

describe('StrettoGenerator', () => {
  let component: StrettoGenerator;
  let fixture: ComponentFixture<StrettoGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrettoGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrettoGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
