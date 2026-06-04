import {Rule, Severity} from './rule';

export class BrokenRule {
  private counterpointIndex: number | undefined;
  private rule: Rule;

  constructor(counterpointIndex: number | undefined, rule: Rule) {
    this.counterpointIndex = counterpointIndex
    this.rule = rule;
  }

  get id(): number         { return this.rule.id; }
  get description(): string { return this.rule.description; }
  get severity(): Severity  { return this.rule.severity; }
  get index(): number | undefined   { return this.counterpointIndex; }
}


