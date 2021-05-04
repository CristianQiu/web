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

		const res = new THREE.Vector2(w, h);
		this._scenePass = new RenderPass(scene, camera);
		this._bloomPass = new UnrealBloomPass(res, 1.0, 0.7, 0.59825);
		this._uberPass = new UberPostFxPass(1.0, h, 0.05, 1.33);

		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(this._scenePass);
		this._composer.addPass(this._bloomPass);
		this._composer.addPass(this._uberPass);

		this.setSize(w, h);
		this.setPixelRatio(pixelRatio);

		const saturationFrom = { x: 0.0 };
		const saturationTo = { x: 1.0 };

		this._uberPass.setSaturation(saturationFrom.x);

		this._fadeToColorTween = new TWEEN.Tween(saturationFrom)
			.to(saturationTo, 3000)
			.easing(TWEEN.Easing.Quartic.InOut)
			.delay(3000)
			.onUpdate(() => {
				this._uberPass.setSaturation(saturationFrom.x);
			});
	}

	getDomElement() {
		return this._renderer.domElement;
	}

	setSize(w, h) {
		this._uberPass.setScanLinesCount(h);
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
	}
}