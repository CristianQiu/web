import * as THREE from 'three';
import { Object3D } from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import TWEEN from '@tweenjs/tween.js';

const simplex = new SimplexNoise();

export default class SynthwaveCamera {

    constructor(fov, aspect, near, far) {
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        let xEulers = THREE.Math.degToRad(0.0);
        let yEulers = THREE.Math.degToRad(180.0);
        let zEulers = THREE.Math.degToRad(0.0);

        this._anchoredRotation = new THREE.Euler(xEulers, yEulers, zEulers);
        this._camera.setRotationFromEuler(this._anchoredRotation);

        xEulers = THREE.Math.degToRad(90.0);
        yEulers = THREE.Math.degToRad(0.0);
        zEulers = THREE.Math.degToRad(0.0);

        this._parentLookingToGridPos = new THREE.Vector3(0.0, 15.0, 10.0);
        this._parentLookingToGridRot = new THREE.Euler(xEulers, yEulers, zEulers);

        xEulers = THREE.Math.degToRad(5.0);
        yEulers = THREE.Math.degToRad(0.0);
        zEulers = THREE.Math.degToRad(0.0);

        this._parentLookingToSunRot = new THREE.Euler(xEulers, yEulers, zEulers);

        this._cameraParent = new Object3D();
        this._cameraParent.add(this._camera);
        this._shouldBreathe = false;
        this.setToLookingToGridInstant();

        const scope = this;
        const fromRot = { x: scope._parentLookingToGridRot.x, y: scope._parentLookingToGridRot.y, z: scope._parentLookingToGridRot.z };
        const toRot = { x: scope._parentLookingToSunRot.x, y: scope._parentLookingToSunRot.y, z: scope._parentLookingToSunRot.z };

        this._tweenToLookScene = new TWEEN.Tween(fromRot)
            .to(toRot, 5000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                console.log("a");
            })
            .start();
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

    doBreathe() {
        this._shouldBreathe = true;
    }

    stopBreathe() {
        this._shouldBreathe = false;
    }

    setToLookingToGridInstant() {
        this._cameraParent.position.copy(this._parentLookingToGridPos);
        this._cameraParent.setRotationFromEuler(this._parentLookingToGridRot);
    }

    tweenToLookScene() {
        this._tweenToLookScene.start();
    }

    breathe(time) {
        if (!this._shouldBreathe)
            return;

        const posFreq = 0.15;
        const posAmp = 0.15;

        const rotFreq = 0.15;
        const rotAmp = 0.5;

        const x = simplex.noise(time * posFreq, time * posFreq, 0.0) * posAmp;
        const y = simplex.noise((time + 128.0) * posFreq, (time + 128.0) * posFreq, 0.0) * posAmp;

        let xEulers = simplex.noise((time + 64.0) * rotFreq, (time + 64.0) * rotFreq, 0.0) * rotAmp;
        let yEulers = simplex.noise((time + 192.0) * rotFreq, (time + 192.0) * rotFreq, 0.0) * rotAmp;

        xEulers = this._anchoredRotation.x + THREE.MathUtils.degToRad(xEulers);
        yEulers = this._anchoredRotation.y + THREE.MathUtils.degToRad(yEulers);

        this._camera.position.set(x, y, 0.0);
        this._camera.rotation.set(xEulers, yEulers, this._anchoredRotation.z);
    }
}