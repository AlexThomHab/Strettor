import {Interval} from './Interval';

export interface CalculatedIntervalList {
  fixedConsonances: Interval[];
  fixedDissonances: Interval[];
  variableConsonances: Interval[];
  variableDissonances: Interval[];
}
