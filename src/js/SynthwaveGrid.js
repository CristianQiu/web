import * as THREE from 'three';
import SynthwaveGridShader from './SynthwaveGridShader';
import Maths from './Maths';

const CorridorWidth = 2.25 * 3.0;
const MountainEdgeSmoothness = 1.75;

const Speed = 1.25;

export default class SynthwaveGrid {

	constructor(vertexResX = 64, vertexResY = 64, quadSize = 1.0) {
		this._vertexRes = new THREE.Vector2(vertexResX, vertexResY);
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
		this._receivedWorkFromThread = true;
	}

	getMesh() {
		return this._mesh;
	}

	generate() {
		const vertices = [];
		const startPos = new THREE.Vector3(0.0, 0.0, 0.0);
		const halfSizeX = (this._vertexRes.x - 1) / 2.0 * this._quadSize;

		for (let i = 0; i < this._vertexRes.y; ++i) {
			for (let j = 0; j < this._vertexRes.x; ++j) {
				const x = startPos.x - halfSizeX + j * this._quadSize;
				const y = startPos.y;
				const z = startPos.z + i * this._quadSize;

				vertices.push(x, y, z);
			}
		}

		// Note: good readings on how the buffer attribute.
		// https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html
		// https://threejs.org/docs/#api/en/core/BufferAttribute
		this._positionsBuffer = new THREE.Float32BufferAttribute(vertices, 3);

		const indices = [];
		const quadsX = this._vertexRes.x - 1;
		const quadsY = this._vertexRes.y - 1;
		const quadsResolution = quadsX * quadsY;

		for (let numQuad = 0; numQuad < quadsResolution; ++numQuad) {
			const quadRow = numQuad / (this._vertexRes.x - 1);

			const a = quadRow + numQuad;
			const b = quadRow + numQuad + 1;
			const c = quadRow + numQuad + this._vertexRes.x;
			const d = quadRow + numQuad + 1 + this._vertexRes.x;

			indices.push(a, c, b);
			indices.push(c, d, b);
		}

		this._geometry.setIndex(indices);
		this._geometry.setAttribute('position', this._positionsBuffer);
	}

	animate(elapsedTime, audioMeans = undefined) {
		elapsedTime *= Speed;

		this._material.uniforms.time.value = elapsedTime;
		this._material.uniforms.resolution.value = this._vertexRes;
		this._material.uniforms.corridorWidth.value = CorridorWidth;
		this._material.uniforms.mountainEdgeSmoothness.value = MountainEdgeSmoothness;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const avgMean = Maths.calcArrayAvg(audioMeans) * 0.006;
		this._material.uniforms.audioAvgMean.value = avgMean;

		// const resX = this._vertexRes.x;
		// const halfResX = resX * 0.5;
		// const minusHalfResX = -halfResX;
		// const resXMinusOne = resX - 1.0;

		// elapsedTime *= Freq;

		// const count = this._positionsBuffer.count;

		// // Very important note: this code is EXTREMELY slower on iOS.
		// // I actually don't know if the issue is Safari itself or something related to Apple's CPUs.
		// // At least is not strictly related to Safari because Chrome has the same issue on iOS.
		// // I have even tested on an Iphone 12 and it is slow to a NONSENSE degree.
		// // For reference, my Pixel 3a runs 60fps rock solid even before the optimization process.

		// for (let i = this.start; i < count; i += 2) {
		// 	const col = i % resX;
		// 	const x = Maths.fastRemap(0.0, resXMinusOne, minusHalfResX, halfResX, col);
		// 	const xAbs = Maths.fastAbs(x);
		// 	const z = Maths.fastFloor(i / resX);

		// 	let corridor = xAbs - CorridorWidth;
		// 	corridor = Maths.fastMax(0.0, corridor);
		// 	corridor = Maths.fastLog(corridor + 1.0);
		// 	corridor = Maths.smoothstep(corridor, 0.0, MountainEdgeSmoothness);

		// 	let edge = halfResX - xAbs;
		// 	edge = Maths.fastMax(0.0, edge);
		// 	edge = Maths.fastLog(edge + 1.0);
		// 	edge = Maths.smoothstep(edge, 0.0, MountainEdgeSmoothness);

		// 	const finalCorridorEdge = Maths.fastMin(corridor, edge);

		// 	let t = z / this._vertexRes.y;

		// 	const noise = (Simplex.noise(x * Freq, elapsedTime + z * Freq) * 0.5 + 0.5) * Amp;
		// 	const power = Maths.fastLerp(MinH, MaxH, t * t);

		// 	this._positionsBuffer.setY(i, Math.pow(noise, power) * finalCorridorEdge * avgMean);
		// }
	}
}