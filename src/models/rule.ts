export enum Severity {
  Warning = 'WARNING',
  Error = 'ERROR'
}

export interface Rule {
  description: string;
  severity: Severity;
}
