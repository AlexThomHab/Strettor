import {Note} from '../../models/note';
import {majorAbsoluteIntervalsData} from '../../data/major-absolute-intervals.data';
import {IntervalCalculator} from '../IntervalCalculator';
import {
  FirstSpeciesCounterpointValidator
} from '../first-species-counterpoint-validator/FirstSpeciesCounterpointValidator';

export class StrettoGenerator{

  private intervalCalculator : IntervalCalculator = new IntervalCalculator();
  private firstSpeciesValidator : FirstSpeciesCounterpointValidator = new FirstSpeciesCounterpointValidator();


  public generate(line: (Note | null)[]): Note[][] {

    let normaliseToFirst = this.normaliseToFirstSpecies(line);
    let possibleStretto : Note[][] = [];
    //compare a copy with every interval in the diatonic (major) scale
    majorAbsoluteIntervalsData.forEach((interval) => {
      let counterpoint = this.generateCounterpointGivenInterval(interval, normaliseToFirst); //generate the counterpoint given each interval
      const ruleNumbers: number[] = [];
      if (this.firstSpeciesValidator.isValidSolution(normaliseToFirst, counterpoint, ruleNumbers)) {
          possibleStretto.push(counterpoint);
      }
    })

    return possibleStretto
  }

  private generateCounterpointGivenInterval(interval: number, line: Note[]) : Note[] {

    let result: Note[] = [];
    for (let i = 0; i < line.length; i++) {
      let absNewNote = this.intervalCalculator.getNoteValue(line[i]) + interval;
      //convert to real note
      let absNewNoteToNote = this.intervalCalculator.absNoteToNote(absNewNote)
      result.push(absNewNoteToNote);
    }
    return result;

  }
  private normaliseToFirstSpecies(line: (Note | null)[]){

    let result = line.filter(x => x !== null)

    return result
  }

}
