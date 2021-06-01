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

	sunset() {
		this._targetBasePhi = this._basePhiSunset;
	}

	sunrise() {
		this._targetBasePhi = this._basePhiSunrise;
	}

	moveSunAccordingToMouseWindowPos(mouseX, mouseY) {
		this._currMouseWindowX = mouseX;
		this._currMouseWindowY = mouseY;
	}

	update(dt) {
		this._currentBasePhi = MathUtils.damp(this._currentBasePhi, this._targetBasePhi, this._sunsetSunriseSmoothness, dt);

		let phi = MathUtils.lerp(-this._sunPhiOffsetAmp, this._sunPhiOffsetAmp, this._currMouseWindowY);
		let theta = MathUtils.lerp(-this._sunThetaAmp, this._sunThetaAmp, this._currMouseWindowX);

		phi = MathUtils.degToRad(phi + this._currentBasePhi);
		theta = MathUtils.degToRad(theta);

		this._sunTargetPosSpherical.setFromSphericalCoords(1.0, phi, theta);

		const t = 1.0 - Math.pow(this._sunMovementSmoothness, dt);
		this._uniforms.sunPosition.value.lerp(this._sunTargetPosSpherical, t);
	}

	_setSunStripeWidthX(x) {
		this._uniforms.sunStripeWidths.value.setX(x);
	}

	_initSunRotationVars() {
		this._basePhiSunset = 87.5;
		this._basePhiSunrise = 81.0;
		this._targetBasePhi = this._basePhiSunset;
		this._currentBasePhi = this._basePhiSunset;
		this._sunsetSunriseSmoothness = 2.0;
		this._sunPhiOffsetAmp = 0.4;
		this._sunThetaAmp = 1.0;
		this._sunMovementSmoothness = 0.25;
		this._sunTargetPosSpherical = new Vector3().copy(this._uniforms.sunPosition.value);

		this._currMouseWindowX = 0.5;
		this._currMouseWindowY = 0.5;
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