import { TestBed } from '@angular/core/testing';
import { InvertibleCounterpointService } from './invertible-counterpoint.service';

describe('InvertedIntervalsCalculator', () => {
  let calculator: InvertibleCounterpointService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [InvertibleCounterpointService]
    }).compileComponents();

    calculator = TestBed.inject(InvertibleCounterpointService);
  });

  type Case = [
    jvIndex: number,
    expectedFixedCons: number[],
    expectedFixedDis: number[],
    expectedVarCons: number[],
    expectedVarDis: number[]
  ];

  const positiveCases: Case[] = [
    [0,  [0, 2, 4, 5, 7], [1, 3, 6], [], []],
    [1,  [4],             [],        [0, 2, 5, 7], [1, 3, 6]],
    [2,  [0, 2, 5, 7],    [1, 6],    [4],         [3]],
    [3,  [2, 4],          [3],       [0, 5, 7],   [1, 6]],
    [4,  [0, 5, 7],       [6],       [2, 4],      [1, 3]],
    [5,  [0, 2, 4, 7],    [1, 3],    [5],         [6]],
    [6,  [5],             [],        [0, 2, 4, 7],[1, 3, 6]],
    [7,  [0, 2, 4, 5, 7], [1, 3, 6], [],          []],
  ];

  const negativeCases: Case[] = [
    [-11, [0, 2, 4, 7], [1, 3], [5],       [6]],
    [-6,  [2, 4],       [3],    [0, 5, 7], [1, 6]],
    [-5,  [0, 5, 7],    [6],    [2, 4],    [1, 3]],
    [-4,  [0, 2, 4],    [1, 3], [5, 7],    [6]],
    [-3,  [5, 7],       [6],    [0, 2, 4], [1, 3]],
    [-2,  [0, 2, 4, 7], [1, 3], [5],       [6]],
    [-1,  [5],          [],     [0, 2, 4, 7],[1, 3, 6]],
  ];

  function toNums(xs: any[]): number[] {
    return xs.map(x => (typeof x === 'number' ? x : x?.number));
  }

  function expectUnordered(actual: number[], expected: number[]) {
    expect([...actual].sort()).toEqual([...expected].sort());
  }

  positiveCases.forEach(([jv, fc, fd, vc, vd]) => {
    it(`should correctly classify intervals for positive JV ${jv}`, () => {
      const result = calculator.calculate(jv);
      expectUnordered(toNums(result.fixedConsonances), fc);
      expectUnordered(toNums(result.fixedDissonances), fd);
      expectUnordered(toNums(result.variableConsonances), vc);
      expectUnordered(toNums(result.variableDissonances), vd);
    });
  });

  negativeCases.forEach(([jv, fc, fd, vc, vd]) => {
    it(`should correctly classify intervals for negative JV ${jv}`, () => {
      const result = calculator.calculate(jv);
      expectUnordered(toNums(result.fixedConsonances), fc);
      expectUnordered(toNums(result.fixedDissonances), fd);
      expectUnordered(toNums(result.variableConsonances), vc);
      expectUnordered(toNums(result.variableDissonances), vd);
    });
  });
});
