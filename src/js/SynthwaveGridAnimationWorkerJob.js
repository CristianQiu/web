// import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
// import { Float32BufferAttribute } from 'three';
import Maths from './Maths';

// const Simplex = new SimplexNoise();

let freq = 0.07;
let amp = 3.0;

let corridorWidth = 2.0 * 4;
let mountainEdgeSmoothness = 1.75;

let minH = 1.25;
let maxH = 2.5;

let resX = 96;
let resY = 128;

let avgMean = 1.0;
// let positionsBuffer;

onmessage = function (objEvent) {
	const buffer = objEvent.data;

	const start = this.performance.now();

	const typedArr = new Float32Array(buffer);
	// const bufferAttr = new Float32BufferAttribute();
	// execute(buffer);

	console.log(buffer.data);
	// buffer.set
	// console.log(this.performance.now() - start);
};

// const calcArrayAvg = function (array) {
// 	let avgMean = 0.0;
// 	for (let i = 0; i < array.length; ++i) {
// 		avgMean += array[i];
// 	}
// 	avgMean /= array.length;
// 	return avgMean;
// };

function execute(positionsBuffer) {
	const halfResX = resX * 0.5;
	const minusHalfResX = -halfResX;
	const resXMinusOne = resX - 1.0;

	elapsedTime *= Freq;

	// const avgMean = calcArrayAvg(audioMeans) * 0.006;
	const count = positionsBuffer.count;

	// Very important note: this code is EXTREMELY slower on iOS.
	// I actually don't know if the issue is Safari itself or something related to Apple's CPUs.
	// At least is not strictly related to Safari because Chrome has the same issue on iOS.
	// I have even tested on an Iphone 12 and it is slow to a NONSENSE degree.
	// For reference, my Pixel 3a runs 60fps rock solid even before the optimization process.
	for (let i = 0; i < count; ++i) {
		const col = i % resX;
		const x = Maths.fastRemap(0.0, resXMinusOne, minusHalfResX, halfResX, col);
		const xAbs = Maths.fastAbs(x);
		const z = Maths.fastFloor(i / resX);

		let corridor = xAbs - corridorWidth;
		corridor = Maths.fastMax(0.0, corridor);
		corridor = Maths.fastLog(corridor + 1.0);
		corridor = Maths.smoothstep(corridor, 0.0, mountainEdgeSmoothness);

		let edge = halfResX - xAbs;
		edge = Maths.fastMax(0.0, edge);
		edge = Maths.fastLog(edge + 1.0);
		edge = Maths.smoothstep(edge, 0.0, mountainEdgeSmoothness);

		const finalCorridorEdge = Maths.fastMin(corridor, edge);

		let t = z / resY;

		// const noise = (Simplex.noise(x * Freq, elapsedTime + z * Freq) * 0.5 + 0.5) * Amp;
		const power = Maths.fastLerp(minH, maxH, t * t);

		positionsBuffer.setY(i, Math.pow(z, power) * finalCorridorEdge * avgMean);
		// this._positionsBuffer.setY(i, Math.pow(noise, power) * finalCorridorEdge * avgMean);
	}

	positionsBuffer.needsUpdate = true;
}