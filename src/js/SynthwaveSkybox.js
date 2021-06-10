import { BoxBufferGeometry, UniformsUtils, ShaderMaterial, BackSide, Mesh, MathUtils, Color } from 'three';
import { SynthwaveSkyboxShader } from './SynthwaveSkyboxShader';
import { Maths } from './Maths';
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

		this._createMakeSunAppearTween();
		this._initSunRotationVars();
		this._initSkyColorVars();
	}

	getMesh() {
		return this._mesh;
	}

	makeSunAppear() {
		this._makeSunAppearTween.start();
	}

	sunset() {
		this._targetBasePhi = this._basePhiSunset;
		this._targetHorizonColor = this._primaryHorizonColor;
		this._targetZenithColor = this._primaryZenithColor;
	}

	sunrise() {
		this._targetBasePhi = this._basePhiSunrise;
		this._targetHorizonColor = this._secondaryHorizonColor;
		this._targetZenithColor = this._secondaryZenithColor;
	}

	moveSunAccordingToMouseWindowPos(mouseX, mouseY) {
		if (!this._sunRotationWithMouseEnabled)
			return;

		this._currMouseWindowX = mouseX;
		this._currMouseWindowY = mouseY;
	}

	enableSunMouseMovement(enable) {
		this._sunRotationWithMouseEnabled = enable;

		if (!this._sunRotationWithMouseEnabled) {
			this._currMouseWindowX = 0.5;
			this._currMouseWindowY = 0.5;
		}
	}

	update(dt) {
		this._currBasePhi = MathUtils.damp(this._currBasePhi, this._targetBasePhi, this._sunsetSunriseTransitionSpeed, dt);

		const targetPhiOffset = MathUtils.lerp(-this._sunPhiOffsetAmp, this._sunPhiOffsetAmp, this._currMouseWindowY);
		const targetThetaOffset = MathUtils.lerp(-this._sunThetaAmp, this._sunThetaAmp, this._currMouseWindowX);

		this._currPhiOffset = MathUtils.damp(this._currPhiOffset, targetPhiOffset, this._sunMovementTransitionSpeed, dt);
		this._currThetaOffset = MathUtils.damp(this._currThetaOffset, targetThetaOffset, this._sunMovementTransitionSpeed, dt);

		const currPhiRad = MathUtils.degToRad(this._currBasePhi + this._currPhiOffset);
		const currThetaRad = MathUtils.degToRad(this._currThetaOffset);

		this._sunTargetPosSpherical.setFromSphericalCoords(1.0, currPhiRad, currThetaRad);
		this._uniforms.sunPosition.value.copy(this._sunTargetPosSpherical);

		Maths.applyColorLerpDamp(this._currHorizonColor, this._targetHorizonColor, this._skyColorTransitionSpeed, dt);
		Maths.applyColorLerpDamp(this._currZenithColor, this._targetZenithColor, this._skyColorTransitionSpeed, dt);

		this._uniforms.horizonColor.value.copy(this._currHorizonColor);
		this._uniforms.zenithColor.value.copy(this._currZenithColor);
	}

	_setSunStripeWidthX(x) {
		this._uniforms.sunStripeWidths.value.setX(x);
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

	_initSunRotationVars() {
		this._basePhiSunset = 87.0;
		this._basePhiSunrise = 82.0;
		this._targetBasePhi = this._basePhiSunset;
		this._currBasePhi = this._basePhiSunset;
		this._sunsetSunriseTransitionSpeed = 2.0;
		this._sunPhiOffsetAmp = 0.4;
		this._sunThetaAmp = 1.0;
		this._sunMovementTransitionSpeed = 2.0;
		this._sunTargetPosSpherical = this._uniforms.sunPosition.value.clone();
		this._currPhiOffset = MathUtils.radToDeg(this._sunTargetPosSpherical.y);
		this._currThetaOffset = MathUtils.radToDeg(this._sunTargetPosSpherical.x);

		this._currMouseWindowX = 0.5;
		this._currMouseWindowY = 0.5;

		this._sunRotationWithMouseEnabled = true;
	}

	_initSkyColorVars() {
		this._primaryHorizonColor = this._uniforms.horizonColor.value.clone();
		this._secondaryHorizonColor = new Color(0.6, 0.1, 0.0);
		this._currHorizonColor = this._primaryHorizonColor.clone();
		this._targetHorizonColor = this._primaryHorizonColor;

		this._primaryZenithColor = this._uniforms.zenithColor.value.clone();
		this._secondaryZenithColor = new Color(0.0, 0.2, 1.0);
		this._currZenithColor = this._primaryZenithColor.clone();
		this._targetZenithColor = this._primaryZenithColor;

		this._skyColorTransitionSpeed = 2.0;
	}
}