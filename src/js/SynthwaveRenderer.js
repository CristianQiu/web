import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import UberPostFxPass from './UberPostFxPass';
import TWEEN from '@tweenjs/tween.js';

export default class SynthwaveRenderer {

	constructor(scene, camera, w, h, pixelRatio) {
		this._renderer = new THREE.WebGLRenderer();
		this._renderer.outputEncoding = THREE.LinearEncoding;
		// Note: this must be implemented in the postprocessing stack.
		// By default it does not work with the EffectComposer.
		// this._renderer.toneMapping = THREE.NoToneMapping;
		// this._renderer.toneMappingExposure = Math.pow(1.0, 4.0);

		this._scanLinesCountNormal = 1024.0;
		this._scanLinesCountLess = this._scanLinesCountNormal / 2.0;
		this._scanLinesCountMinimal = this._scanLinesCountNormal / 4.0;

		this._scanLineNormalThreshold = 300.0;
		this._scanLinesLessThreshold = 150.0;

		const startBloom = 0.0;
		const startSat = 0.0;
		const startNoise = 10.0;
		const startVig = 5.0;

		const res = new THREE.Vector2(w, h);
		this._scenePass = new RenderPass(scene, camera);
		this._bloomPass = new UnrealBloomPass(res, startBloom, 0.7, 0.59825);
		// this._uberPass = new UberPostFxPass(1.0, 0.4, this._scanLinesCountNormal, 0.05, 0.15, 1.25);
		this._uberPass = new UberPostFxPass(startSat, startNoise, this._scanLinesCountNormal, 0.1, startVig, 1.25);

		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(this._scenePass);
		this._composer.addPass(this._bloomPass);
		this._composer.addPass(this._uberPass);

		this.setPixelRatio(pixelRatio);
		this.setSize(w, h);

		const fromSat = { x: startSat };
		const toSat = { x: 0.75, };

		this._uberPass.setSaturation(fromSat.x);

		this._fadeToColorTween = new TWEEN.Tween(fromSat)
			.to(toSat, 3000)
			.easing(TWEEN.Easing.Quartic.InOut)
			.delay(3000)
			.onUpdate(() => {
				this._uberPass.setSaturation(fromSat.x);
			});

		const fromBloomVigNoise = { bloom: startBloom, noise: startNoise, vig: startVig };
		const toBloomVigNoise = { bloom: 1.0, noise: 0.4, vig: 0.25 };

		this._fadeVignetteNoise = new TWEEN.Tween(fromBloomVigNoise)
			.to(toBloomVigNoise, 2000)
			.easing(TWEEN.Easing.Quartic.InOut)
			.onUpdate(() => {
				this._bloomPass.strength = fromBloomVigNoise.bloom;

				this._uberPass.setNoiseWeight(fromBloomVigNoise.noise);
				this._uberPass.setVignetteFallOffIntensity(fromBloomVigNoise.vig);
			});
	}

	getDomElement() {
		return this._renderer.domElement;
	}

	setSize(w, h) {
		let scanLinesCount = h > this._scanLineNormalThreshold ? this._scanLinesCountNormal : this._scanLinesCountLess;
		scanLinesCount = h > this._scanLinesLessThreshold ? scanLinesCount : this._scanLinesCountMinimal;

		this._uberPass.setScanLinesCount(scanLinesCount);
		this._renderer.setSize(w, h);
		this._composer.setSize(w, h);
	}

	setPixelRatio(pixelRatio) {
		this._renderer.setPixelRatio(pixelRatio);
		this._composer.setPixelRatio(pixelRatio);
	}

	render() {
		this._composer.render();
	}

	fadeToColor() {
		this._fadeToColorTween.start();
		this._fadeVignetteNoise.start();
	}
}