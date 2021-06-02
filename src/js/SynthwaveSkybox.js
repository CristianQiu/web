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

		this._initSunRotationVars();
		this._createMakeSunAppearTween();

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

		Maths.applyColorLerpDamp(this._currHorizonColor, this._targetHorizonColor, this._skyColorSmoothness, dt);
		Maths.applyColorLerpDamp(this._currZenithColor, this._targetZenithColor, this._skyColorSmoothness, dt);

		this._uniforms.horizonColor.value.copy(this._currHorizonColor);
		this._uniforms.zenithColor.value.copy(this._currZenithColor);
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
		this._sunTargetPosSpherical = this._uniforms.sunPosition.value.clone();

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

	_initSkyColorVars() {
		this._primaryHorizonColor = this._uniforms.horizonColor.value.clone();
		this._secondaryHorizonColor = new Color(0.6, 0.1, 0.0);
		this._currHorizonColor = this._primaryHorizonColor.clone();
		this._targetHorizonColor = this._primaryHorizonColor;

		this._primaryZenithColor = this._uniforms.zenithColor.value.clone();
		this._secondaryZenithColor = new Color(0.0, 0.2, 1.0);
		this._currZenithColor = this._primaryZenithColor.clone();
		this._targetZenithColor = this._primaryZenithColor;

		this._skyColorSmoothness = 1.0;
	}
}