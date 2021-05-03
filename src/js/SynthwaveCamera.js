import * as THREE from 'three';
import { Object3D } from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import TWEEN from '@tweenjs/tween.js';

const PosFreq = 0.15;
const PosAmp = 0.15;

const RotFreq = 0.15;
const RotAmp = 0.5;

const Simplex = new SimplexNoise();

export default class SynthwaveCamera {

	constructor(fov, aspect, near, far) {
		this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

		let xEulers = THREE.Math.degToRad(90.0);
		let yEulers = THREE.Math.degToRad(180.0);
		let zEulers = THREE.Math.degToRad(0.0);

		this._parentLookingToGridPos = new THREE.Vector3(0.0, 2.0, 50.0);
		this._parentLookingToGridRot = new THREE.Euler(xEulers, yEulers, zEulers);

		xEulers = THREE.Math.degToRad(-5.0);
		yEulers = THREE.Math.degToRad(180.0);
		zEulers = THREE.Math.degToRad(0.0);

		this._parentLookingToSunPos = new THREE.Vector3(0.0, 2.75, 0.0);
		this._parentLookingToSunRot = new THREE.Euler(xEulers, yEulers, zEulers);

		this._cameraParent = new Object3D();
		this._cameraParent.add(this._camera);
		this._shouldBreathe = false;
		this.setToLookingGridInstant();

		this._breathingTimer = 0.0;
		this._transitionTimeMs = 4000;
		const easing = TWEEN.Easing.Quintic.InOut;

		const fromPos = { x: this._parentLookingToGridPos.x, y: this._parentLookingToGridPos.y, z: this._parentLookingToGridPos.z };
		const toPos = { x: this._parentLookingToSunPos.x, y: this._parentLookingToSunPos.y, z: this._parentLookingToSunPos.z };

		this._tweenToLookSunPos = new TWEEN.Tween(fromPos)
			.to(toPos, this._transitionTimeMs)
			.easing(easing)
			.onUpdate(() => {
				this._cameraParent.position.set(fromPos.x, fromPos.y, fromPos.z);
			});

		const fromRot = { x: this._parentLookingToGridRot.x, y: this._parentLookingToGridRot.y, z: this._parentLookingToGridRot.z };
		const toRot = { x: this._parentLookingToSunRot.x, y: this._parentLookingToSunRot.y, z: this._parentLookingToSunRot.z };

		const tempEulers = new THREE.Euler(0.0, 0.0, 0.0);
		this._tweenToLookSunRot = new TWEEN.Tween(fromRot)
			.to(toRot, this._transitionTimeMs)
			.easing(easing)
			.onUpdate(() => {
				tempEulers.set(fromRot.x, fromRot.y, fromRot.z);
				this._cameraParent.setRotationFromEuler(tempEulers);
			});

		const fromFov = { x: fov };
		const toFov = { x: 60.0 };
		this._tweenToLookSunFov = new TWEEN.Tween(fromFov)
			.to(toFov, this._transitionTimeMs)
			.easing(easing)
			.onUpdate(() => {
				this._camera.fov = fromFov.x;
				this._camera.updateProjectionMatrix();
			});
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
		this._tweenToLookSunRot.start();
		this._tweenToLookSunPos.start();
		this._tweenToLookSunFov.start();
	}

	breathe(dt, time) {
		let intensity = 0.0;

		if (this._shouldBreathe) {
			this._breathingTimer += dt;
			const transitionSec = this._transitionTimeMs / 1000.0;
			this._breathingTimer = Math.min(this._breathingTimer, transitionSec);
			intensity = this._breathingTimer / transitionSec;
		}
		else {
			return;
		}

		const x = Simplex.noise(time * PosFreq, time * PosFreq, 0.0) * PosAmp * intensity;
		const y = Simplex.noise((time + 128.0) * PosFreq, (time + 128.0) * PosFreq, 0.0) * PosAmp * intensity;

		let xEulers = Simplex.noise((time + 64.0) * RotFreq, (time + 64.0) * RotFreq, 0.0) * RotAmp * intensity;
		let yEulers = Simplex.noise((time + 192.0) * RotFreq, (time + 192.0) * RotFreq, 0.0) * RotAmp * intensity;

		xEulers = THREE.MathUtils.degToRad(xEulers);
		yEulers = THREE.MathUtils.degToRad(yEulers);

		this._camera.position.set(x, y, 0.0);
		this._camera.rotation.set(xEulers, yEulers, 0.0);
	}
}