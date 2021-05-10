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
	}

	animate(elapsedTime, audioMeans = undefined) {
		elapsedTime *= speed;
		// Note: good readings on how the buffer attribute works
		// https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html
		// https://threejs.org/docs/#api/en/core/BufferAttribute
		this._material.uniforms.time.value = elapsedTime;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const halfResX = this._vertexResX * 0.5;
		const resX = this._vertexResX;

		elapsedTime *= Freq;

		const avgMean = calcArrayAvg(audioMeans);

		const count = this._positionsBuffer.count;
		for (let i = 0; i < count; ++i) {
			const col = i % resX;
			const x = Maths.fastRemap(0.0, resX - 1.0, -halfResX, halfResX, col);
			const xAbs = Maths.fastAbs(x);
			const z = Maths.fastFloor(i / resX);

			let corridor = xAbs - CorridorWidth;
			corridor = Maths.fastMax(0.0, corridor);
			corridor = Math.log(corridor + 1.0);
			corridor = THREE.MathUtils.smoothstep(corridor, 0.0, MountainEdgeSmoothness);

			let edge = halfResX - xAbs;
			edge = Maths.fastMax(0.0, edge);
			edge = Math.log(edge + 1.0);
			edge = THREE.MathUtils.smoothstep(edge, 0.0, MountainEdgeSmoothness);

			const finalCorridorEdge = Maths.fastMin(corridor, edge);

			let t = z / this._vertexResY;

			const noise = (Simplex.noise(x * Freq, elapsedTime + z * Freq) * 0.5 + 0.5) * Amp;
			const power = Maths.fastLerp(MinH, MaxH, t * t);

			// onst a = (Math.sin((x + z) * Freq * 3.0) + 1.0) * 0.5 * 2.0 * avgMean * 0.01 * finalCorridorEdge;
			// let a = (Math.sin(x * Freq * 3.0) + 1.0) * 0.5 * Amp;
			// const b = (Math.sin(z * Freq * 3.0) + 1.0) * 0.5 * Amp;
			// a = Math.min(a, b) * power;

			// pow eats 4 fps. 34 to 30 approx
			this._positionsBuffer.setY(i, Math.pow(noise, power) * finalCorridorEdge * avgMean * 0.006);
			// this._positionsBuffer.setY(i, 1.0 * finalCorridorEdge * avgMean * 0.006);

			// experiments
			// const noise = Simplex.noise(0.0, 0.0) * Amp;
			// this._positionsBuffer.setY(i, x) * Amp;

			// const othery = Math.sin(z);
			// const index = (audioMeans.length - 1.0) - Math.floor(z / 3.0) % audioMeans.length;

			// let val = audioMeans[index] * 0.05;

			// if (x <= 8.0 && x >= -8.0)
			// 	val = 0.0;

			// if (z % 3 != 1)
			// 	val = 0.0;

			// this._positionsBuffer.setY(i, val * 0.15);
			// this._positionsBuffer.setY(i, (power * finalCorridorEdge) + Math.pow(noise, 1.0) * finalCorridorEdge + (val * 0.2 * finalCorridorEdge));
		}

		this._positionsBuffer.needsUpdate = true;
	}
}