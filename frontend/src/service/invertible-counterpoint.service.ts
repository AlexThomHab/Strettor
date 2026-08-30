import {Injectable} from '@angular/core';
import {Interval} from '../models/Interval';
import {CalculatedIntervalList} from '../models/CalculatedIntervalList';
import {SuspensionTreatmentEnum} from '../models/SuspensionTreatmentEnum';

@Injectable({providedIn: 'root'})
export class InvertibleCounterpointService {
  private static readonly N = 8;
  private static readonly PERFECT = new Set([0, 4, 7]);
  private static readonly IMPERFECT = new Set([2, 5]);

  private static copyInterval(interval: Interval): Interval {
    return {
      index: interval.index,
      semitones: interval.semitones,
      name: interval.name,
      isConsonant: interval.isConsonant,
      upperSuspensionTreatment: interval.upperSuspensionTreatment,
      lowerSuspensionTreatment: interval.lowerSuspensionTreatment,
    };
  }

  private static strictMostSuspensionTreatmentEnum(
    originalIntervalSuspension: SuspensionTreatmentEnum,
    newIntervalSuspension: SuspensionTreatmentEnum
  ): SuspensionTreatmentEnum {

    if ((originalIntervalSuspension === SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension && newIntervalSuspension === SuspensionTreatmentEnum.NoteOfResolutionIsDissonant) || (originalIntervalSuspension === SuspensionTreatmentEnum.NoteOfResolutionIsDissonant && newIntervalSuspension === SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension)) {
      return SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspensionAndNoteOfResolutionIsDissonant;
    }

    return (originalIntervalSuspension as number) < (newIntervalSuspension as number) ? originalIntervalSuspension : newIntervalSuspension;
  }

  private readonly _intervals: Record<number, Interval> = {
    0: {
      index: 0, semitones: 0, name: 'Unison', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    1: {
      index: 1, semitones: 1, name: 'Second', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.CannotFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension
    },
    2: {
      index: 2, semitones: 2, name: 'Third', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    3: {
      index: 3, semitones: 3, name: 'Fourth', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension
    },
    4: {
      index: 4, semitones: 4, name: 'Fifth', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsFree
    },
    5: {
      index: 5, semitones: 5, name: 'Sixth', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsFree,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    6: {
      index: 6, semitones: 6, name: 'Seventh', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.CannotFormSuspension
    },
    7: {
      index: 7, semitones: 7, name: 'Octave', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
  };

  private readonly _intervalsInverted: Record<number, Interval> = {
    0: {
      index: 0, semitones: 0, name: 'Unison', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    1: {
      index: 1, semitones: -1, name: 'Second', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.CannotFormSuspension
    },
    2: {
      index: 2, semitones: -2, name: 'Third', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    3: {
      index: 3, semitones: -3, name: 'Fourth', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension
    },
    4: {
      index: 4, semitones: -4, name: 'Fifth', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsFree,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
    5: {
      index: 5, semitones: -5, name: 'Sixth', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsFree
    },
    6: {
      index: 6, semitones: -6, name: 'Seventh', isConsonant: false,
      upperSuspensionTreatment: SuspensionTreatmentEnum.CannotFormSuspension,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension
    },
    7: {
      index: 7, semitones: -7, name: 'Octave', isConsonant: true,
      upperSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant,
      lowerSuspensionTreatment: SuspensionTreatmentEnum.NoteOfResolutionIsDissonant
    },
  };

  public calculate(jvIndex: number): CalculatedIntervalList {
    const out: CalculatedIntervalList = {
      fixedConsonances: [],
      fixedDissonances: [],
      variableConsonances: [],
      variableDissonances: [],
    };

    const N = InvertibleCounterpointService.N;

    for (let i = 0; i < N; i++) {
      const remainder = (i + jvIndex) % 7;
      const targetIndex = Math.abs(remainder);
      const jv0Interval = this._intervals[i];
      let targetInterval = this._intervals[targetIndex];

      const bothConsonant = jv0Interval.isConsonant && targetInterval.isConsonant;
      const bothDissonant = !jv0Interval.isConsonant && !targetInterval.isConsonant;
      const consToDiss = jv0Interval.isConsonant && !targetInterval.isConsonant;

      const shiftedIndexAbs = Math.abs(jvIndex + i);
      const compareIndex = shiftedIndexAbs % 7;
      const isLargeShift = shiftedIndexAbs > 7;

      targetInterval = jvIndex < 0
        ? this._intervalsInverted[compareIndex]
        : this._intervals[compareIndex];

      const mergeSuspensions = (
        jv0IntervalToCopy: Interval,
        targetIndexIntervalToCopy: Interval,
        tweakSecondOnUpper: boolean
      ): Interval => {
        const jv0Interval = InvertibleCounterpointService.copyInterval(jv0IntervalToCopy);
        const targetInterval = InvertibleCounterpointService.copyInterval(targetIndexIntervalToCopy);

        if (isLargeShift && targetInterval.name === 'Second') {
          if (tweakSecondOnUpper) {
            targetInterval.upperSuspensionTreatment = SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension;
          } else {
            targetInterval.lowerSuspensionTreatment = SuspensionTreatmentEnum.IfOnDownbeatMustFormSuspension;
          }
        }

        jv0Interval.upperSuspensionTreatment =
          InvertibleCounterpointService.strictMostSuspensionTreatmentEnum(
            jv0Interval.upperSuspensionTreatment, targetInterval.upperSuspensionTreatment
          );
        jv0Interval.lowerSuspensionTreatment =
          InvertibleCounterpointService.strictMostSuspensionTreatmentEnum(
            jv0Interval.lowerSuspensionTreatment, targetInterval.lowerSuspensionTreatment
          );

        return jv0Interval;
      };

      if (bothConsonant) {
        const merged = mergeSuspensions(jv0Interval, targetInterval, jvIndex >= 0);

        merged.imperfectBecomesPerfect =
          InvertibleCounterpointService.IMPERFECT.has(jv0Interval.index) &&
          InvertibleCounterpointService.PERFECT.has(Math.abs(targetInterval.semitones));

        out.fixedConsonances.push(merged);
        continue;
      }

      if (bothDissonant) {
        const merged = mergeSuspensions(jv0Interval, targetInterval, jvIndex >= 0);
        merged.becomesAFourth = targetInterval.name == "Fourth" && jvIndex != 0;
        out.fixedDissonances.push(merged);
        continue;
      }

      if (consToDiss) {
        const merged = mergeSuspensions(jv0Interval, targetInterval, jvIndex >= 0);
        merged.becomesAFourth = targetInterval.name == "Fourth";
        out.variableConsonances.push(merged);
        continue;
      }
      {
        const merged = mergeSuspensions(jv0Interval, targetInterval, jvIndex >= 0);
        out.variableDissonances.push(merged);
      }
    }
    return out;
  }
}
