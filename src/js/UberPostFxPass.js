import {
	ShaderMaterial,
	UniformsUtils
} from 'three';
import { Pass, FullScreenQuad } from '../../node_modules/three/examples/jsm/postprocessing/Pass';
import UberPostFxShader from './UberPostFxShader';

export default class UberPostFxPass extends Pass {

	constructor(noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale) {
		super();

		const shader = UberPostFxShader;
		this._uniforms = UniformsUtils.clone(shader.uniforms);

		if (grayscale !== undefined)
			this._uniforms.grayScale.value = grayscale;
		if (noiseIntensity !== undefined)
			this._uniforms.nIntensity.value = noiseIntensity;
		if (scanlinesIntensity !== undefined)
			this._uniforms.sIntensity.value = scanlinesIntensity;
		if (scanlinesCount !== undefined)
			this._uniforms.sCount.value = scanlinesCount;

		this._material = new ShaderMaterial({
			uniforms: this._uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});

		this.fsQuad = new FullScreenQuad(this._material);
	}

	render(renderer, writeBuffer, readBuffer, deltaTime) {
		this._uniforms['tDiffuse'].value = readBuffer.texture;
		this._uniforms['time'].value += deltaTime;

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);
		} else {
			renderer.setRenderTarget(writeBuffer);
			if (this.clear)
				renderer.clear();
			this.fsQuad.render(renderer);
		}
	}
}