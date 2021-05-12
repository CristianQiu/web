import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import Maths from './Maths';

let Freq = 0.07;
let Amp = 3.0;

let corridorWidth = 2.0 * 4;
let mountainEdgeSmoothness = 1.75;

let minH = 1.25;
let maxH = 2.5;

let resX = 96;
let resY = 128;

let avgMean = 1.0;
let dt = 0.0;

const Simplex = new SimplexNoise();

onmessage = function (obj) {
	const tArray = obj.data.typedArray;

	const start = this.performance.now();
	execute(tArray);
	const ms = (this.performance.now() - start);
	dt += 0.1115;

	postMessage({
		name: 'buffer',
		ms: ms,
		typedArray: tArray
	}, [tArray.buffer]);
};

function execute(typedArray) {
	const halfResX = resX * 0.5;
	const minusHalfResX = -halfResX;
	const resXMinusOne = resX - 1.0;

	// elapsedTime *= Freq;
	const elapsedTime = dt;

	// const avgMean = Maths.calcArrayAvg(audioMeans) * 0.006;
	const count = Maths.fastFloor(typedArray.length / 3.0);

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

		const noise = (Simplex.noise(x * Freq, elapsedTime + z * Freq) * 0.5 + 0.5) * Amp;
		const power = Maths.fastLerp(minH, maxH, t * t);

		typedArray[i * 3 + 1] = Math.pow(noise, power) * finalCorridorEdge * avgMean;
	}
}