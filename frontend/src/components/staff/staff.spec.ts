import { describe, it, expect, beforeEach } from 'vitest';
import { Staff } from './staff';
import { Note } from '../../models/note';

describe('Staff - toVexKey', () => {
  let staff: Staff;

  beforeEach(() => {
    staff = new Staff();
  });

  it('converts a natural note to vex key format', () => {
    expect((staff as any).toVexKey(new Note('D', 4))).toBe('d/4');
  });

  it('converts a natural note in a higher octave', () => {
    expect((staff as any).toVexKey(new Note('G', 5))).toBe('g/5');
  });

  it('converts a sharp note to vex key format', () => {
    expect((staff as any).toVexKey(new Note('C#', 4))).toBe('c#/4');
  });

  it('converts a natural note in a lower octave', () => {
    expect((staff as any).toVexKey(new Note('E', 3))).toBe('e/3');
  });
});
