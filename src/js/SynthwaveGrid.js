import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import SynthwaveGridShader from './SynthwaveGridShader';

const freq = 0.1;
const amp = 3.0;

const corridorWidth = 2.25 * 4;
const mountainEdgeSmoothness = 1.75;

const minH = 1.5;
const maxH = 2.5;

const simplex = new SimplexNoise();

const remap = function (a, b, c, d, x) {
	let s = (x - a) / (b - a);
	s = THREE.MathUtils.clamp(s, 0.0, 1.0);
	return THREE.MathUtils.lerp(c, d, s);
};

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
		// Note: good readings on how the buffer attribute works
		// https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html
		// https://threejs.org/docs/#api/en/core/BufferAttribute
		this._material.uniforms.time.value = elapsedTime;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const halfResX = this._vertexResX * 0.5;
		const resX = this._vertexResX;

		elapsedTime *= freq;

		const avgMean = calcArrayAvg(audioMeans);

		for (let i = 0; i < this._positionsBuffer.count; ++i) {
			const col = i % resX;
			const x = remap(0.0, resX - 1.0, -halfResX, halfResX, col);
			const xAbs = Math.abs(x);
			const z = Math.floor(i / resX);

			// smoothly flatten the mountains at their edges and flatten the middle corridor
			let corridor = xAbs - corridorWidth;
			corridor = Math.max(0.0, corridor);
			corridor = Math.log(corridor + 1.0);
			corridor = THREE.MathUtils.smoothstep(corridor, 0.0, mountainEdgeSmoothness);

			let edge = halfResX - xAbs;
			edge = Math.max(0.0, edge);
			edge = Math.log(edge + 1.0);
			edge = THREE.MathUtils.smoothstep(edge, 0.0, mountainEdgeSmoothness);

			const finalCorridorEdge = Math.min(corridor, edge);

			let t = z / this._vertexResY;
			t *= t;

			const noise = (simplex.noise3d(x * freq, elapsedTime + z * freq, avgMean * 0.0015) * 0.5 + 0.5) * amp;
			const power = THREE.MathUtils.lerp(minH, maxH, t);
			this._positionsBuffer.setY(i, Math.pow(noise, power) * finalCorridorEdge * avgMean * 0.006);
		}

		this._positionsBuffer.needsUpdate = true;
	}
}