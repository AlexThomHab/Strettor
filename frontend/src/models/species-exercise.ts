export class SpeciesExerciseModel {
  public name: string;
  public rhythmicProportion: number;
  public description: string;

  constructor(name: string, rhythmicProportion: number, description: string) {
    this.name = name;
    this.rhythmicProportion = rhythmicProportion;
    this.description = description;
  }
}
