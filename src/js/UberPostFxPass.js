import * as THREE from 'three';
import { Pass, FullScreenQuad } from '../../node_modules/three/examples/jsm/postprocessing/Pass';
import UberPostFxShader from './UberPostFxShader';

export default class UberPostFxPass extends Pass {

	constructor(scanlinesCount, scanlinesIntensity, grayScaleIntensity) {
		super();
		const shader = UberPostFxShader;
		this._uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		if (grayScaleIntensity !== undefined)
			this._uniforms.grayScaleIntensity.value = grayScaleIntensity;
		if (scanlinesCount !== undefined)
			this._uniforms.scanLineCount.value = scanlinesCount;
		if (scanlinesIntensity !== undefined)
			this._uniforms.scanLineIntensity.value = scanlinesIntensity;

		this._material = new THREE.ShaderMaterial({
			uniforms: this._uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});

		this.fsQuad = new FullScreenQuad(this._material);
	}

	render(renderer, writeBuffer, readBuffer, deltaTime) {
		this._uniforms.tDiffuse.value = readBuffer.texture;
		this._uniforms.time.value += deltaTime;

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
		}
		else {
			renderer.setRenderTarget(writeBuffer);
			if (this.clear)
				renderer.clear();
		}

		this.fsQuad.render(renderer);
	}

	setScanLinesCount(count) {
		this._uniforms.scanLineCount.value = count;
	}
}