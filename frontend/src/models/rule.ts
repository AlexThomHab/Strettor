export enum Severity {
  Suggestion = 'Suggestion',
  Warning = 'WARNING',
  Error = 'ERROR'
}

export class Rule {
  public id: number;
  public description: string;
  public severity: Severity;

  constructor(id: number, description: string, severity: Severity) {
    this.id = id;
    this.description = description;
    this.severity = severity;
  }

}

