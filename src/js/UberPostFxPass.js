import { UniformsUtils, ShaderMaterial } from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import UberPostFxShader from './UberPostFxShader';

export default class UberPostFxPass extends Pass {

	constructor(saturationIntensity, noiseWeight, scanlinesCount, scanlinesIntensity, vignetteFallOffIntensity, vignetteFocusIntensity, exposure, turnOnIntensity) {
		super();
		const shader = UberPostFxShader;
		this._uniforms = UniformsUtils.clone(shader.uniforms);

		if (saturationIntensity !== undefined)
			this._uniforms.saturationIntensity.value = saturationIntensity;
		if (noiseWeight !== undefined)
			this._uniforms.noiseWeight.value = noiseWeight;
		if (scanlinesCount !== undefined)
			this._uniforms.scanLineCount.value = scanlinesCount;
		if (scanlinesIntensity !== undefined)
			this._uniforms.scanLineIntensity.value = scanlinesIntensity;
		if (vignetteFallOffIntensity !== undefined)
			this._uniforms.vignetteFallOffIntensity.value = vignetteFallOffIntensity;
		if (vignetteFocusIntensity !== undefined)
			this._uniforms.vignetteFocusIntensity.value = vignetteFocusIntensity;
		if (exposure !== undefined)
			this._uniforms.exposure.value = exposure;
		if (turnOnIntensity !== undefined)
			this._uniforms.turnOnIntensity.value = turnOnIntensity;

		this._material = new ShaderMaterial({
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

	setSaturation(intensity) {
		this._uniforms.saturationIntensity.value = intensity;
	}

	setNoiseWeight(weight) {
		this._uniforms.noiseWeight.value = weight;
	}

	setScanLinesCount(count) {
		this._uniforms.scanLineCount.value = count;
	}

	setVignetteFallOffFocusIntensity(fallOff, focus) {
		this._uniforms.vignetteFallOffIntensity.value = fallOff;
		this._uniforms.vignetteFocusIntensity.value = focus;
	}

	setTurnOnIntensity(intensity) {
		this._uniforms.turnOnIntensity.value = intensity;
	}
}