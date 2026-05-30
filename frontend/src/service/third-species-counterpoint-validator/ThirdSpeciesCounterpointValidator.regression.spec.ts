import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note';
import { ThirdSpeciesCounterpointValidator } from './ThirdSpeciesCounterpointValidator';

describe('ThirdSpeciesCounterpointValidator - regression', () => {
  let validator: ThirdSpeciesCounterpointValidator;

  beforeEach(() => {
    validator = new ThirdSpeciesCounterpointValidator();
  });

});
