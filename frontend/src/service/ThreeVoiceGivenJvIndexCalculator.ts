import { InvertibleCounterpointService } from "./invertible-counterpoint.service";
import { CalculatedIntervalList } from "../models/CalculatedIntervalList";

export class ThreeVoiceGivenJvIndexValuesCalculator {
  constructor(
    private readonly twoVoiceCalc = new InvertibleCounterpointService()
  ) {}

  calculate(jvPrime: number, jvDoublePrime: number, jvSigma: number): CalculatedIntervalList[] {
    const firstAndSecondVoice = this.twoVoiceCalc.calculate(jvPrime);
    const secondAndThirdVoice = this.twoVoiceCalc.calculate(jvDoublePrime);
    const firstAndThirdVoice = this.twoVoiceCalc.calculate(jvSigma);
    return [firstAndSecondVoice, secondAndThirdVoice, firstAndThirdVoice];
  }
}
