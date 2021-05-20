import { BoxBufferGeometry, UniformsUtils, ShaderMaterial, BackSide, Mesh, Vector3, MathUtils } from 'three';
import { SynthwaveSkyboxShader } from './SynthwaveSkyboxShader';
import TWEEN from '@tweenjs/tween.js';

export class SynthwaveSkybox {

	constructor() {
		this._geometry = new BoxBufferGeometry(1, 1, 1, 1, 1, 1);
		const shader = SynthwaveSkyboxShader;
		this._uniforms = UniformsUtils.clone(shader.uniforms);
		const material = new ShaderMaterial({
			side: BackSide,
			depthWrite: false,
			uniforms: this._uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			extensions: {
				derivatives: true
			}
		});
		this._mesh = new Mesh(this._geometry, material);
		this._mesh.scale.setScalar(10000);

		this._initSunRotationVars();
		this._createMakeSunAppearTween();
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
		this._uniforms.sunPosition.value.lerp(this._sunTargetPosSpherical, t);
	}

	_setSunStripeWidthX(x) {
		this._uniforms.sunStripeWidths.value.setX(x);
	}

	_initSunRotationVars() {
		this._sunPhiOffsetAmp = 0.4;
		this._sunThetaAmp = 1.0;
		this._sunMovementSmoothness = 0.25;
		this._sunTargetPosSpherical = new Vector3().copy(this._uniforms.sunPosition.value);
	}

	_createMakeSunAppearTween() {
		const from = { x: 1.33 };
		const to = { x: 0.03 };
		const fadeTime = 3000;
		const easing = TWEEN.Easing.Quartic.InOut;
		const fadeDelay = 3000;

		this._setSunStripeWidthX(from.x);

		this._makeSunAppearTween = new TWEEN.Tween(from)
			.to(to, fadeTime)
			.easing(easing)
			.delay(fadeDelay)
			.onUpdate(() => {
				this._setSunStripeWidthX(from.x);
			});
	}
}