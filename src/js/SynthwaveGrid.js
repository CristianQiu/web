import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import SynthwaveGridShader from './SynthwaveGridShader';
import Maths from './Maths';

const Freq = 0.07;
const Amp = 3.0;

const CorridorWidth = 2.0 * 4;
const MountainEdgeSmoothness = 1.75;

const MinH = 1.25;
const MaxH = 2.5;

const speed = 1.25;

const Simplex = new SimplexNoise();

const calcArrayAvg = function (array) {
	let avgMean = 0.0;
	for (let i = 0; i < array.length; ++i) {
		avgMean += array[i];
	}
	avgMean /= array.length;
	return avgMean;
};

export default class SynthwaveGrid {

	constructor(vertexResX = 64, vertexResY = 64, quadSize = 1.0) {
		this._vertexResX = vertexResX;
		this._vertexResY = vertexResY;
		this._quadSize = quadSize;

		this._geometry = new THREE.BufferGeometry();
		const uniforms = THREE.UniformsUtils.clone(SynthwaveGridShader.uniforms);
		this._material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: SynthwaveGridShader.vertexShader,
			fragmentShader: SynthwaveGridShader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new THREE.Mesh(this._geometry, this._material);

		this._worker = new Worker(new URL('../js/SynthwaveGridAnimationWorkerJob.js', import.meta.url));
		// this._worker.onmessage = () => {
		// 	console.log("Worker has finished?");
		// };
	}

	getMesh() {
		return this._mesh;
	}

	generate() {
		const vertices = [];
		const startPos = new THREE.Vector3(0.0, 0.0, 0.0);
		const halfSizeX = (this._vertexResX - 1) / 2.0 * this._quadSize;

		for (let i = 0; i < this._vertexResY; ++i) {
			for (let j = 0; j < this._vertexResX; ++j) {
				const x = startPos.x - halfSizeX + j * this._quadSize;
				const y = startPos.y;
				const z = startPos.z + i * this._quadSize;

				vertices.push(x, y, z);
			}
		}

		this._positionsBuffer = new THREE.Float32BufferAttribute(vertices, 3);
		this._positionsBuffer.setUsage(THREE.DynamicDrawUsage);

		const indices = [];
		const quadsX = this._vertexResX - 1;
		const quadsY = this._vertexResY - 1;
		const quadsResolution = quadsX * quadsY;

		for (let numQuad = 0; numQuad < quadsResolution; ++numQuad) {
			const quadRow = numQuad / (this._vertexResX - 1);

			const a = quadRow + numQuad;
			const b = quadRow + numQuad + 1;
			const c = quadRow + numQuad + this._vertexResX;
			const d = quadRow + numQuad + 1 + this._vertexResX;

			indices.push(a, c, b);
			indices.push(c, d, b);
		}

		this._geometry.setIndex(indices);
		this._geometry.setAttribute('position', this._positionsBuffer);

		const positionsBufferCopy = new THREE.Float32BufferAttribute(this._positionsBuffer.array).array;

		console.log(positionsBufferCopy.buffer)

		this._worker.postMessage({
			// resX: this._vertexResX,
			// resY: this._vertexResY,
			// corridorWidth: CorridorWidth,
			// MountainEdgeSmoothness
			name: 'buffer',
			data: positionsBufferCopy.buffer
		}, [positionsBufferCopy.buffer]);
	}

	animate(elapsedTime, audioMeans = undefined) {
		return;
		elapsedTime *= speed;
		// Note: good readings on how the buffer attribute works
		// https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html
		// https://threejs.org/docs/#api/en/core/BufferAttribute
		this._material.uniforms.time.value = elapsedTime;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const resX = this._vertexResX;
		const halfResX = resX * 0.5;
		const minusHalfResX = -halfResX;
		const resXMinusOne = resX - 1.0;

		elapsedTime *= Freq;

		const avgMean = calcArrayAvg(audioMeans) * 0.006;
		const count = this._positionsBuffer.count;

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

			let corridor = xAbs - CorridorWidth;
			corridor = Maths.fastMax(0.0, corridor);
			corridor = Maths.fastLog(corridor + 1.0);
			corridor = Maths.smoothstep(corridor, 0.0, MountainEdgeSmoothness);

			let edge = halfResX - xAbs;
			edge = Maths.fastMax(0.0, edge);
			edge = Maths.fastLog(edge + 1.0);
			edge = Maths.smoothstep(edge, 0.0, MountainEdgeSmoothness);

			const finalCorridorEdge = Maths.fastMin(corridor, edge);

			let t = z / this._vertexResY;

			const noise = (Simplex.noise(x * Freq, elapsedTime + z * Freq) * 0.5 + 0.5) * Amp;
			const power = Maths.fastLerp(MinH, MaxH, t * t);

			this._positionsBuffer.setY(i, Math.pow(noise, power) * finalCorridorEdge * avgMean);
		}

		this._positionsBuffer.needsUpdate = true;
	}
}