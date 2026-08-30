import {SuspensionTreatmentEnum} from './SuspensionTreatmentEnum';

export interface Interval {
  index: number;
  semitones: number;
  name: string;
  isConsonant: boolean;
  upperSuspensionTreatment: SuspensionTreatmentEnum;
  lowerSuspensionTreatment: SuspensionTreatmentEnum;
  imperfectBecomesPerfect?: boolean;
  becomesAFourth?: boolean;
}
