import { Euler, PerspectiveCamera, Vector3, Quaternion, Object3D, MathUtils } from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import TWEEN from '@tweenjs/tween.js';

export class SynthwaveCamera {

	constructor(fov, aspect, near, far) {
		this._tempEulers = new Euler(0.0, 0.0, 0.0);
		this._camera = new PerspectiveCamera(fov, aspect, near, far);

		let xEulers = MathUtils.degToRad(90.0);
		let yEulers = MathUtils.degToRad(180.0);
		let zEulers = MathUtils.degToRad(0.0);

		this._parentLookingToGridPos = new Vector3(0.0, 2.0, 75.0);
		this._parentLookingToGridRot = new Euler(xEulers, yEulers, zEulers);

		xEulers = MathUtils.degToRad(-5.0);
		yEulers = MathUtils.degToRad(180.0);
		zEulers = MathUtils.degToRad(0.0);
		this._targetParentRotQuat = new Quaternion().setFromEuler(this._parentLookingToGridRot);

		this._parentLookingToSunPos = new Vector3(0.0, 2.75, 0.0);
		this._parentLookingToSunRot = new Euler(xEulers, yEulers, zEulers);

		this._cameraParent = new Object3D();
		this._cameraParent.add(this._camera);
		this._shouldBreathe = false;
		this.setToLookingGridInstant();

		this._transitionTimeMs = 4000;
		this._easing = TWEEN.Easing.Quintic.InOut;
		this._createTweens();

		this._joined = false;
		this._isTransitioning = false;

		this._initBreathingNoiseSettings();
		this._mouseRotAmp = 2.0;
		this._mouseRotSmoothness = 0.25;
	}

	getCamera() {
		return this._camera;
	}

	getCameraParent() {
		return this._cameraParent;
	}

	setAspect(aspect) {
		this._camera.aspect = aspect;
	}

	updateProjectionMatrix() {
		this._camera.updateProjectionMatrix();
	}

	setToLookingGridInstant() {
		this._cameraParent.position.copy(this._parentLookingToGridPos);
		this._cameraParent.setRotationFromEuler(this._parentLookingToGridRot);
	}

	setToLookingSun() {
		this._shouldBreathe = true;
		this._tweenToLookSunPos.start();
		this._tweenToLookSunFov.start();

		const fromQuat = this._cameraParent.quaternion.clone();
		const tweenObj = { x: 0.0 };

		this._tweenToLookSunRot = new TWEEN.Tween(tweenObj)
			.to({ x: 1.0 }, this._transitionTimeMs)
			.easing(this._easing)
			.onStart(() => {
				this._joined = true;
				this._isTransitioning = true;
				this._targetParentRotQuat.setFromEuler(this._parentLookingToSunRot);
			})
			.onComplete(() => {
				this._isTransitioning = false;
			})
			.onUpdate(() => {
				this._cameraParent.quaternion.slerpQuaternions(fromQuat, this._targetParentRotQuat, tweenObj.x);
			})
			.start();
	}

	rotateAccordingToMouseWindowPos(mouseX, mouseY) {
		if (this._isTransitioning)
			return;

		const xRotOffset = !this._joined ? 90.0 : -5.0;

		let yRot = MathUtils.lerp(this._mouseRotAmp, -this._mouseRotAmp, mouseX) + 180.0;
		let xRot = MathUtils.lerp(-this._mouseRotAmp, this._mouseRotAmp, mouseY) + xRotOffset;

		yRot = MathUtils.degToRad(yRot);
		xRot = MathUtils.degToRad(xRot);

		this._tempEulers.set(xRot, yRot, 0.0);
		this._targetParentRotQuat.setFromEuler(this._tempEulers);
	}

	update(dt, time) {
		this._updateParentRotation(dt);
		// this._adjustFovDependingOnAspectRatio();

		if (!this._shouldBreathe)
			return;

		this._updateCameraBreathingNoise(dt, time);
	}

	_initBreathingNoiseSettings() {
		this._simplex = new SimplexNoise();
		this._breathingTimer = 0.0;

		this._posFreq = 0.15;
		this._posAmp = 0.15;

		this._rotFreq = 0.15;
		this._rotAmp = 0.5;
	}

	_createTweens() {
		const fromPos = { x: this._parentLookingToGridPos.x, y: this._parentLookingToGridPos.y, z: this._parentLookingToGridPos.z };
		const toPos = { x: this._parentLookingToSunPos.x, y: this._parentLookingToSunPos.y, z: this._parentLookingToSunPos.z };

		this._tweenToLookSunPos = new TWEEN.Tween(fromPos)
			.to(toPos, this._transitionTimeMs)
			.easing(this._easing)
			.onUpdate(() => {
				this._cameraParent.position.set(fromPos.x, fromPos.y, fromPos.z);
			});

		const fromFov = { x: this._camera.fov };
		const toFov = { x: 52.5 };
		this._tweenToLookSunFov = new TWEEN.Tween(fromFov)
			.to(toFov, this._transitionTimeMs)
			.easing(this._easing)
			.onUpdate(() => {
				this._camera.fov = fromFov.x;
				this._camera.updateProjectionMatrix();
			});
	}

	_updateParentRotation(dt) {
		if (this._isTransitioning)
			return;

		const currQuat = this._cameraParent.quaternion;
		currQuat.slerp(this._targetParentRotQuat, 1.0 - Math.pow(this._mouseRotSmoothness, dt));
	}

	_updateCameraBreathingNoise(dt, time) {
		this._breathingTimer += dt;
		const transitionSec = this._transitionTimeMs / 1000.0;
		this._breathingTimer = Math.min(this._breathingTimer, transitionSec);
		const intensity = this._shouldBreathe ? (this._breathingTimer / transitionSec) : 0.0;

		const simplex = this._simplex;
		const posFreq = this._posFreq;
		const posAmp = this._posAmp;

		const rotFreq = this._rotFreq;
		const rotAmp = this._rotAmp;

		const x = simplex.noise(time * posFreq, time * posFreq, 0.0) * posAmp * intensity;
		const y = simplex.noise((time + 128.0) * posFreq, (time + 128.0) * posFreq, 0.0) * posAmp * intensity;

		let xEulers = simplex.noise((time + 64.0) * rotFreq, (time + 64.0) * rotFreq, 0.0) * rotAmp * intensity;
		let yEulers = simplex.noise((time + 192.0) * rotFreq, (time + 192.0) * rotFreq, 0.0) * rotAmp * intensity;

		xEulers = MathUtils.degToRad(xEulers);
		yEulers = MathUtils.degToRad(yEulers);

		this._camera.position.set(x, y, 0.0);
		this._camera.rotation.set(xEulers, yEulers, 0.0);
	}

	_adjustFovDependingOnAspectRatio() {
		const minFov = 20.0;
		const maxFov = 90.0;

		const aspectMaxFov = 0.4;
		const aspectMinFov = 2.0;

		let t = innerWidth / innerHeight;
		t = MathUtils.clamp(t, aspectMaxFov, aspectMinFov);
		t = MathUtils.inverseLerp(aspectMaxFov, aspectMinFov, t);

		const fov = MathUtils.lerp(maxFov, minFov, t);

		const tanFOV = Math.tan(((Math.PI / 180) * 22.5 / 2));
		const newFov = (360.0 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / 720.0));

		this._camera.fov = newFov;
		this._camera.updateProjectionMatrix();
	}
}