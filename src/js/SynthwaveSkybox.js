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
			});

		this._sunPhiOffsetAmp = 0.4;
		this._sunThetaAmp = 1.0;
		this._sunMovementSmoothness = 0.25;
		this._sunTargetPosSpherical = new THREE.Vector3().copy(SynthwaveSkyboxShader.uniforms.sunPosition.value);
	}

	getMesh() {
		return this._mesh;
	}

	makeSunAppear() {
		this._makeSunAppearTween.start();
	}

	moveSunAccordingToMouseWindowPos(mouseX, mouseY) {
		let phi = THREE.MathUtils.lerp(-this._sunPhiOffsetAmp, this._sunPhiOffsetAmp, mouseY);
		let theta = THREE.MathUtils.lerp(-this._sunThetaAmp, this._sunThetaAmp, mouseX);

		phi = THREE.MathUtils.degToRad(phi + 87.5);
		theta = THREE.MathUtils.degToRad(theta);

		this._sunTargetPosSpherical.setFromSphericalCoords(1.0, phi, theta);
	}

	update(dt) {
		const t = 1.0 - Math.pow(this._sunMovementSmoothness, dt);
		this._material.uniforms.sunPosition.value.lerp(this._sunTargetPosSpherical, t);
	}
}