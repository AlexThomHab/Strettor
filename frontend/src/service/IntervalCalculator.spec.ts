import {IntervalCalculator} from './IntervalCalculator';
import {Note} from '../models/note';
import {describe, it, expect, beforeEach} from 'vitest';

describe('Interval Calculator', () => {
  let intervalCalculator: IntervalCalculator;

  beforeEach(() => {
    intervalCalculator = new IntervalCalculator();
  });

  it('C4 to C4 should be 0 (Perfect Unison)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("C", 4))).toBe(0);
  });

  it('C4 to D4 should be 2 (Major Second)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("D", 4))).toBe(2);
  });

  it('C4 to E4 should be 4 (Major Third)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("E", 4))).toBe(4);
  });

  it('C4 to F4 should be 5 (Perfect Fourth)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("F", 4))).toBe(5);
  });

  it('C4 to F#4 should be 6 (Tritone)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("F#", 4))).toBe(6);
  });

  it('C4 to G4 should be 7 (Perfect Fifth)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("G", 4))).toBe(7);
  });

  it('C4 to A4 should be 9 (Major Sixth)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("A", 4))).toBe(9);
  });

  it('C4 to B4 should be 11 (Major Seventh)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("B", 4))).toBe(11);
  });

  it('C4 to C5 should be 12 (Octave)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 4), new Note("C", 5))).toBe(12);
  });

  // Cross-octave
  it('B4 to C5 should be 1 (Minor Second)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("B", 4), new Note("C", 5))).toBe(1);
  });

  it('A4 to D5 should be 5 (Perfect Fourth)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("A", 4), new Note("D", 5))).toBe(5);
  });

  it('G4 to C5 should be 5 (Perfect Fourth)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("G", 4), new Note("C", 5))).toBe(5);
  });

  // Direction should not matter
  it('G4 to C4 should be 7 (same as C4 to G4)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("G", 4), new Note("C", 4))).toBe(7);
  });

  it('C5 to B4 should be 1 (same as B4 to C5)', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 5), new Note("B", 4))).toBe(1);
  });

  // Two octaves apart
  it('C3 to C5 should be 24', () => {
    expect(intervalCalculator.calculateSemitoneInterval(new Note("C", 3), new Note("C", 5))).toBe(24);
  });

});
