import { BoxBufferGeometry, UniformsUtils, ShaderMaterial, BackSide, Mesh, Vector4, Vector3, MathUtils } from 'three';
import SynthwaveSkyboxShader from './SynthwaveSkyboxShader';
import TWEEN from '@tweenjs/tween.js';

export default class SynthwaveSkybox {

	constructor() {
		this._geometry = new BoxBufferGeometry(1, 1, 1, 1, 1, 1);
		const uniforms = UniformsUtils.clone(SynthwaveSkyboxShader.uniforms);
		this._material = new ShaderMaterial({
			side: BackSide,
			depthWrite: false,
			uniforms: uniforms,
			vertexShader: SynthwaveSkyboxShader.vertexShader,
			fragmentShader: SynthwaveSkyboxShader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new Mesh(this._geometry, this._material);
		this._mesh.scale.setScalar(10000);

		const sunStripeFrom = { x: 1.33 };
		const sunStripeTo = { x: 0.03 };
		const sunStripeFadeTime = 3000;
		const sunStripeEasing = TWEEN.Easing.Quartic.InOut;
		const sunStripeFadeDelay = 3000;

		const sunStripeWidths = new Vector4(sunStripeFrom.x, 0.04, 0.05, 0.06);
		this._material.uniforms.sunStripeWidths.value = sunStripeWidths;

		this._makeSunAppearTween = new TWEEN.Tween(sunStripeFrom)
			.to(sunStripeTo, sunStripeFadeTime)
			.easing(sunStripeEasing)
			.delay(sunStripeFadeDelay)
			.onUpdate(() => {
				sunStripeWidths.setX(sunStripeFrom.x);
			});

		this._sunPhiOffsetAmp = 0.4;
		this._sunThetaAmp = 1.0;
		this._sunMovementSmoothness = 0.25;
		this._sunTargetPosSpherical = new Vector3().copy(SynthwaveSkyboxShader.uniforms.sunPosition.value);
	}

	getMesh() {
		return this._mesh;
	}

	makeSunAppear() {
		this._makeSunAppearTween.start();
	}

	moveSunAccordingToMouseWindowPos(mouseX, mouseY) {
		let phi = MathUtils.lerp(-this._sunPhiOffsetAmp, this._sunPhiOffsetAmp, mouseY);
		let theta = MathUtils.lerp(-this._sunThetaAmp, this._sunThetaAmp, mouseX);

		phi = MathUtils.degToRad(phi + 87.5);
		theta = MathUtils.degToRad(theta);

		this._sunTargetPosSpherical.setFromSphericalCoords(1.0, phi, theta);
	}

	update(dt) {
		const t = 1.0 - Math.pow(this._sunMovementSmoothness, dt);
		this._material.uniforms.sunPosition.value.lerp(this._sunTargetPosSpherical, t);
	}
}