import { describe, it, expect } from 'vitest';
import { StrettoGenerator } from './stretto-generator';
import { Note } from '../../models/note';

describe('StrettoGenerator', () => {

  const strettoGenerator = new StrettoGenerator();

  const lineOfQuarterNotes: (Note | null)[] = [
    new Note("C", 4), null, null, null,
    new Note("C", 4), null, null, null,
    new Note("C", 4), null, null, null,
    new Note("C", 4), null, null, null
  ];

  it('should generate the expected stretto lines', () => {
    const result = strettoGenerator.generate(lineOfQuarterNotes);

    const expected: (Note | null)[][] = [
      [
        new Note("E", 4), null, null, null,
        new Note("E", 4), null, null, null,
        new Note("E", 4), null, null, null,
        new Note("E", 4), null, null, null
      ],
      [
        new Note("G", 4), null, null, null,
        new Note("G", 4), null, null, null,
        new Note("G", 4), null, null, null,
        new Note("G", 4), null, null, null
      ],
      [
        new Note("A", 4), null, null, null,
        new Note("A", 4), null, null, null,
        new Note("A", 4), null, null, null,
        new Note("A", 4), null, null, null
      ],

      [
        new Note("A", 3), null, null, null,
        new Note("A", 3), null, null, null,
        new Note("A", 3), null, null, null,
        new Note("A", 3), null, null, null
      ],
      [
        new Note("F", 3), null, null, null,
        new Note("F", 3), null, null, null,
        new Note("F", 3), null, null, null,
        new Note("F", 3), null, null, null
      ],
      [
        new Note("E", 3), null, null, null,
        new Note("E", 3), null, null, null,
        new Note("E", 3), null, null, null,
        new Note("E", 3), null, null, null
      ],

    ];

    expect(result).toEqual(expected);
  });
});
