import { UniformsUtils, ShaderMaterial } from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { UberPostFxShader } from './UberPostFxShader';

export class UberPostFxPass extends Pass {

	constructor(saturationIntensity, noiseWeight, scanlineCount, scanlineIntensity, vignetteFallOffIntensity, vignetteFocusIntensity, turnOnIntensity, exposure) {
		super();

		const shader = UberPostFxShader;
		this._uniforms = UniformsUtils.clone(shader.uniforms);

		this.setSaturation(saturationIntensity);
		this.setNoise(noiseWeight);
		this.setScanLineCountIntensity(scanlineCount, scanlineIntensity);
		this.setVignetteFallOffFocusIntensity(vignetteFallOffIntensity, vignetteFocusIntensity);
		this.setTurnOnIntensity(turnOnIntensity);
		this.setExposure(exposure);

		const material = new ShaderMaterial({
			uniforms: this._uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});

		this.fsQuad = new FullScreenQuad(material);
	}

	setSaturation(intensity) {
		this._uniforms.saturationIntensity.value = intensity;
	}

	setNoise(weight) {
		this._uniforms.noiseWeight.value = weight;
	}

	setScanLineCountIntensity(count = undefined, intensity = undefined) {
		if (count !== undefined)
			this._uniforms.scanLineCount.value = count;
		if (intensity !== undefined)
			this._uniforms.scanLineIntensity.value = intensity;
	}

	setVignetteFallOffFocusIntensity(fallOff = undefined, focus = undefined) {
		if (fallOff !== undefined)
			this._uniforms.vignetteFallOffIntensity.value = fallOff;
		if (focus !== undefined)
			this._uniforms.vignetteFocusIntensity.value = focus;
	}

	setTurnOnIntensity(intensity) {
		this._uniforms.turnOnIntensity.value = intensity;
	}

	setExposure(value) {
		this._uniforms.exposure.value = value;
	}

	render(renderer, writeBuffer, readBuffer, dt) {
		this._uniforms.tDiffuse.value = readBuffer.texture;
		this._uniforms.time.value += dt;

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
}