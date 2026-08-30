import { TestBed } from '@angular/core/testing';
import { InvertibleCounterpointService } from './invertible-counterpoint.service';
import { SuspensionTreatmentEnum } from '../models/SuspensionTreatmentEnum';
import { CalculatedIntervalList } from '../models/CalculatedIntervalList';
import { Interval } from '../models/Interval';

function collectAll(invertedIntervalsDetailed: CalculatedIntervalList): Interval[] {
  return [
    ...invertedIntervalsDetailed.fixedConsonances,
    ...invertedIntervalsDetailed.fixedDissonances,
    ...invertedIntervalsDetailed.variableConsonances,
    ...invertedIntervalsDetailed.variableDissonances,
  ];
}

function byUpper(intervalsWithSuspensions: Interval[], suspensionTreatmentEnum: SuspensionTreatmentEnum): number[] {
  return intervalsWithSuspensions.filter(x => x.upperSuspensionTreatment === suspensionTreatmentEnum).map(x => x.index).sort((a, b) => a - b);
}

function byLower(intervalsWithSuspensions: Interval[], suspensionTreatmentEnum: SuspensionTreatmentEnum): number[] {
  return intervalsWithSuspensions.filter(x => x.lowerSuspensionTreatment === suspensionTreatmentEnum).map(x => x.index).sort((a, b) => a - b);
}

describe('Suspension treatment parity with C#', () => {
  let invertibleCounterpointService: InvertibleCounterpointService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvertibleCounterpointService],
    });
    invertibleCounterpointService = TestBed.inject(InvertibleCounterpointService);
  });

  describe('Given JV index is 0', () => {
    let all: Interval[];

    beforeEach(() => {
      const res = invertibleCounterpointService.calculate(0);
      all = collectAll(res);
    });

    it('Then the correct suspension treatment is returned', () => {
            expect(byUpper(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([1]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 4, 7]);
      expect(byUpper(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([3, 6]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([5]);

            expect(byLower(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([6]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 5, 7]);
      expect(byLower(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([1, 3]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([4]);
    });
  });

  describe('Given JV index is 5', () => {
    let all: Interval[];

    beforeEach(() => {
      const res = invertibleCounterpointService.calculate(5);
      all = collectAll(res);
    });

    it('Then the correct suspension treatment is returned', () => {
            expect(byUpper(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([1]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 4, 7]);
      expect(byUpper(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([3, 5]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([]);
      expect(byUpper(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant))
        .toEqual([6]);

            expect(byLower(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([1, 6]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 4, 7]);
      expect(byLower(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([3]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([]);
      expect(byLower(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant))
        .toEqual([5]);
    });
  });

  describe('Given JV index is -11', () => {
    let all: Interval[];

    beforeEach(() => {
      const res = invertibleCounterpointService.calculate(-11);
      all = collectAll(res);
    });

    it('Then the correct suspension treatment is returned', () => {
            expect(byUpper(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([1, 5]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 4, 7]);
      expect(byUpper(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([3]);
      expect(byUpper(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([]);
      expect(byUpper(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant))
        .toEqual([6]);

            expect(byLower(all, SuspensionTreatmentEnum.CannotFormSuspension))
        .toEqual([6]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsDissonant))
        .toEqual([0, 2, 4, 7]);
      expect(byLower(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension))
        .toEqual([1, 3]);
      expect(byLower(all, SuspensionTreatmentEnum.NoteOfResolutionIsFree))
        .toEqual([]);
      expect(byLower(all, SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant))
        .toEqual([5]);
    });
  });
});
