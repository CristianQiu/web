import { AudioAnalyser } from 'three';
import { Maths } from './Maths';

const NumBands = 32;
const BandsBoundsFactor = 1.12246;
const Bands = [
	16.0, 20.0, 25.0, 31.5,
	40.0, 50.0, 63.0, 80.0,
	100.0, 125.0, 160.0, 200.0,
	250.0, 315.0, 400.0, 500.0,
	630.0, 800.0, 1000.0, 1250.0,
	1600.0, 2000.0, 2500.0, 3150.0,
	4000.0, 5000.0, 6300.0, 8000.0,
	10000.0, 12500.0, 16000.0, 20000.0
];

export class AudioSpectrumAnalyzer extends AudioAnalyser {

	constructor(audio, fftSize = 2048) {
		super(audio, fftSize);

		this._rawMeans = new Array(NumBands).fill(0.0);
		this._smoothedMeans = new Array(NumBands).fill(0.0);
		this._decayRate = 75.0;
		this._sensibility = 50;
	}

	getMeans(smoothed) {
		return smoothed ? this._smoothedMeans : this._rawMeans;
	}

	analyzeFrameMeans(dt, sampleRate) {
		const spectrum = this.getFrequencyData();
		const decayRateTimesDt = this._decayRate * dt;
		const twiceSpectrumLength = 2.0 * spectrum.length;
		const spectrumLengthMinusOne = spectrum.length - 1;
		const length = Bands.length;

		const filter = Math.exp(-this._sensibility * dt);

		for (let i = 0; i < length; ++i) {
			const prevFrameSmoothedMean = this._smoothedMeans[i];
			const decayed = prevFrameSmoothedMean - decayRateTimesDt;
			this._smoothedMeans[i] = Maths.fastMax(0.0, decayed);

			const lowerBound = Bands[i] / BandsBoundsFactor;
			const upperBound = Bands[i] * BandsBoundsFactor;

			let minIndex = Maths.fastFloor((lowerBound / sampleRate) * twiceSpectrumLength);
			let maxIndex = Maths.fastFloor((upperBound / sampleRate) * twiceSpectrumLength);

			minIndex = Maths.fastClamp(minIndex, 0, spectrumLengthMinusOne);
			maxIndex = Maths.fastClamp(maxIndex, 0, spectrumLengthMinusOne);

			let mean = 0.0;
			let max = 0.0;

			for (let j = minIndex; j <= maxIndex; ++j) {
				const spec = spectrum[j];
				mean += spec;
				max = Maths.fastMax(spec, max);
			}

			// Note: this actually makes peak levels instead means but keep the name since I may tweak it.
			mean /= (maxIndex - minIndex + 1.0);
			this._rawMeans[i] = max;
			this._smoothedMeans[i] = Maths.fastMax(this._smoothedMeans[i], max - (max - mean) * filter);
		}
	}
}