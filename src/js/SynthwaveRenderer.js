import { WebGLRenderer, Vector2, LinearEncoding } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { UberPostFxPass } from './UberPostFxPass';
import TWEEN from '@tweenjs/tween.js';

export class SynthwaveRenderer {

	constructor(scene, camera, width, height, pixelRatio) {
		this._renderer = new WebGLRenderer();
		this._renderer.outputEncoding = LinearEncoding;
		// Note: this must be implemented in the postprocessing stack.
		// By default it does not work with the EffectComposer.
		// this._renderer.toneMapping = THREE.NoToneMapping;
		// this._renderer.toneMappingExposure = Math.pow(1.0, 4.0);

		this._createSettings();

		const scanLinesCount = this._scanLineSettings.countNormal;
		const scanLinesIntensity = this._tweenSettings.startScanLinesIntensity;
		const startVigFallOff = this._tweenSettings.startVignetteFallOff;
		const startVigFocus = this._tweenSettings.startVignetteFocus;
		const startTurnOnCrt = this._tweenSettings.startTurnOnCrt;

		const res = new Vector2(width, height);
		this._scenePass = new RenderPass(scene, camera);
		this._bloomPass = new UnrealBloomPass(res, 1.0, 0.7, 0.59825);
		this._uberPass = new UberPostFxPass(0.8, 0.33, scanLinesCount, scanLinesIntensity, startVigFallOff, startVigFocus, startTurnOnCrt, 1.125);

		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(this._scenePass);
		this._composer.addPass(this._bloomPass);
		this._composer.addPass(this._uberPass);

		this.setPixelRatio(pixelRatio);
		this.setSize(width, height);

		this._createFadeTweens();
	}

	getDomElement() {
		return this._renderer.domElement;
	}

	setSize(width, height) {
		this._updateScanLines(height);
		this._renderer.setSize(width, height);
		this._composer.setSize(width, height);
	}

	setPixelRatio(pixelRatio) {
		this._renderer.setPixelRatio(pixelRatio);
		this._composer.setPixelRatio(pixelRatio);
	}

	render() {
		this._composer.render();
	}

	fadeInCrt() {
		this._fadeVignette.start();
	}

	turnOnCrt() {
		this._fadeTurnOn.start();
	}

	_createSettings() {
		this._scanLineSettings =
		{
			countNormal: 1024.0,
			countLess: 1024.0 / 2.0,
			countMinimal: 1024.0 / 4.0,
			normalThreshold: 300.0,
			lessThreshold: 150.0
		};

		this._tweenSettings =
		{
			startScanLinesIntensity: 0.25,
			endScanLinesIntensity: 0.0,
			startVignetteFallOff: 5.0,
			endVignetteFallOff: 0.15,
			startVignetteFocus: 5.0,
			endVignetteFocus: 15.0,
			startTurnOnCrt: 0.0,
			endTurnOnCrt: 1.0
		};
	}

	_createFadeTweens() {
		const fromVig = { x: this._tweenSettings.startVignetteFallOff, y: this._tweenSettings.startVignetteFocus };
		const toVig = { x: this._tweenSettings.endVignetteFallOff, y: this._tweenSettings.endVignetteFocus };
		const vigFadeTime = 1250;
		const vignetteEasing = TWEEN.Easing.Quartic.InOut;

		this._fadeVignette = new TWEEN.Tween(fromVig)
			.to(toVig, vigFadeTime)
			.easing(vignetteEasing)
			.onUpdate(() => {
				this._uberPass.setVignetteFallOffFocusIntensity(fromVig.x, fromVig.y);
			});

		const fromTurnOn = { x: this._tweenSettings.startScanLinesIntensity, y: this._tweenSettings.startTurnOnCrt };
		const toTurnOn = { x: this._tweenSettings.endScanLinesIntensity, y: this._tweenSettings.endTurnOnCrt };
		const turnOnFadeTime = 2000;
		const turnOnEasing = TWEEN.Easing.Quartic.InOut;

		this._fadeTurnOn = new TWEEN.Tween(fromTurnOn)
			.to(toTurnOn, turnOnFadeTime)
			.easing(turnOnEasing)
			.onUpdate(() => {
				this._uberPass.setScanLineCountIntensity(undefined, fromTurnOn.x);
				this._uberPass.setTurnOnIntensity(fromTurnOn.y);
			});
	}

	_updateScanLines(height) {
		const normalThreshold = this._scanLineSettings.normalThreshold;
		const lessThreshold = this._scanLineSettings.lessThreshold;

		const countNormal = this._scanLineSettings.countNormal;
		const countLess = this._scanLineSettings.countLess;
		const countMin = this._scanLineSettings.countMinimal;

		let lines = (height > normalThreshold) ? countNormal : countLess;
		lines = (height > lessThreshold) ? lines : countMin;

		this._uberPass.setScanLineCountIntensity(lines);
	}
}