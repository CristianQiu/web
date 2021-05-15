import { Vector2, BufferGeometry, UniformsUtils, ShaderMaterial, Mesh, Vector3, Float32BufferAttribute } from 'three';
import SynthwaveGridShader from './SynthwaveGridShader';
import Maths from './Maths';

export default class SynthwaveGrid {

	constructor(vertexResX = 64, vertexResY = 64, quadSize = 1.0) {
		this._vertexRes = new Vector2(vertexResX, vertexResY);
		this._quadSize = quadSize;
		this._corridorWidth = 2.25 * 3.0;
		this._mountainEdgeSmoothness = 2.25 * 2.0;
		this._speed = 1.5;

		this._geometry = new BufferGeometry();
		const uniforms = UniformsUtils.clone(SynthwaveGridShader.uniforms);
		this._material = new ShaderMaterial({
			uniforms: uniforms,
			vertexShader: SynthwaveGridShader.vertexShader,
			fragmentShader: SynthwaveGridShader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new Mesh(this._geometry, this._material);
	}

	getMesh() {
		return this._mesh;
	}

	generate() {
		const vertices = [];
		const startPos = new Vector3(0.0, 0.0, 0.0);
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
		this._positionsBuffer = new Float32BufferAttribute(vertices, 3);

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
		elapsedTime *= this._speed;

		this._material.uniforms.time.value = elapsedTime;
		this._material.uniforms.resolution.value = this._vertexRes;
		this._material.uniforms.corridorWidth.value = this._corridorWidth;
		this._material.uniforms.mountainEdgeSmoothness.value = this._mountainEdgeSmoothness;
		this._material.uniforms.quadScale.value = this._quadSize;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const avgMean = Maths.calcArrayAvg(audioMeans) * 0.006;
		this._material.uniforms.audioAvgMean.value = avgMean;
	}
}