import { Vector2, BufferGeometry, UniformsUtils, ShaderMaterial, Mesh, Vector3, Float32BufferAttribute, MathUtils } from 'three';
import { SynthwaveGridShader } from './SynthwaveGridShader';
import { Maths } from './Maths';

export class SynthwaveGrid {

	constructor(vertexResX = 64, vertexResY = 64, quadSize = 1.0) {
		this._vertexRes = new Vector2(vertexResX, vertexResY);
		this._quadSize = quadSize;
		this._openedCorridorWidth = 2.25 * 3.5;
		this._closedCorridorWidth = -2.25 * 1.75;
		this._targetCorridorWidth = this._openedCorridorWidth;
		this._corridorOpenCloseTransitionSpeed = 2.0;
		this._mountainEdgeSmoothness = 2.25 * 2.0;
		this._speed = 1.5;

		this._geometry = new BufferGeometry();
		const shader = SynthwaveGridShader;
		this._uniforms = UniformsUtils.clone(shader.uniforms);
		const material = new ShaderMaterial({
			uniforms: this._uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new Mesh(this._geometry, material);
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

		// Note: good readings on how the buffer attribute works.
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

	openCorridor() {
		this._targetCorridorWidth = this._openedCorridorWidth;
	}

	closeCorridor() {
		this._targetCorridorWidth = this._closedCorridorWidth;
	}

	animate(dt, elapsedTime, audioMeans = undefined) {
		elapsedTime *= this._speed;

		this._uniforms.time.value = elapsedTime;
		this._uniforms.resolution.value = this._vertexRes;
		this._uniforms.quadScale.value = this._quadSize;

		const corridorWidth = MathUtils.damp(this._uniforms.corridorWidth.value, this._targetCorridorWidth, this._corridorOpenCloseTransitionSpeed, dt);
		this._uniforms.corridorWidth.value = corridorWidth;
		this._uniforms.mountainEdgeSmoothness.value = this._mountainEdgeSmoothness;

		if (audioMeans === undefined || audioMeans === null)
			return;

		const avgMean = Maths.calcArrayAvg(audioMeans);
		this._uniforms.audioAvgMean.value = avgMean;
	}
}