import * as THREE from 'three';
import SynthwaveSkyboxShader from './SynthwaveSkyboxShader';
import TWEEN from '@tweenjs/tween.js';

export default class SynthwaveSkybox {

	constructor() {
		this._geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1);
		const uniforms = THREE.UniformsUtils.clone(SynthwaveSkyboxShader.uniforms);
		this._material = new THREE.ShaderMaterial({
			side: THREE.BackSide,
			depthWrite: false,
			uniforms: uniforms,
			vertexShader: SynthwaveSkyboxShader.vertexShader,
			fragmentShader: SynthwaveSkyboxShader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._mesh.scale.setScalar(10000);

		const sunStripeFrom = { x: 1.33 };
		const sunStripeTo = { x: 0.03 };

		const sunStripeWidths = new THREE.Vector4(sunStripeFrom.x, 0.04, 0.05, 0.06);
		this._material.uniforms.sunStripeWidths.value = sunStripeWidths;

		this._makeSunAppearTween = new TWEEN.Tween(sunStripeFrom)
			.to(sunStripeTo, 3000)
			.easing(TWEEN.Easing.Quartic.InOut)
			.delay(3000)
			.onUpdate(() => {
				sunStripeWidths.setX(sunStripeFrom.x);
				this._material.uniforms.sunStripeWidths.value = sunStripeWidths;
			});
	}

	getMesh() {
		return this._mesh;
	}

	makeSunAppear() {
		this._makeSunAppearTween.start();
	}
}