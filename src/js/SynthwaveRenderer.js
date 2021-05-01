import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import UberPostFxPass from './UberPostFxPass';

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
		this._uberPass = new UberPostFxPass(h, 0.1, 0.0, 1.0);

		this._composer = new EffectComposer(this._renderer);
		this._composer.addPass(this._scenePass);
		this._composer.addPass(this._bloomPass);
		this._composer.addPass(this._uberPass);

		this.setSize(w, h);
		this.setPixelRatio(pixelRatio);
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
}