import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

const simplex = new SimplexNoise();

export default class SynthwaveCamera {

    constructor(fov, aspect, near, far) {
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._anchoredPosition = new THREE.Vector3(0.0, 2.5, 0.0);
        this._camera.position.copy(this._anchoredPosition);

        const xEulers = THREE.Math.degToRad(-5.0);
        const yEulers = THREE.Math.degToRad(180.0);
        const zEulers = THREE.Math.degToRad(0.0);

        this._anchoredRotation = new THREE.Euler(xEulers, yEulers, zEulers);
        this._camera.setRotationFromEuler(this._anchoredRotation);
    }

    getCamera() {
        return this._camera;
    }

    setAspect(aspect) {
        this._camera.aspect = aspect;
    }

    updateProjectionMatrix() {
        this._camera.updateProjectionMatrix();
    }

    breathe(time) {
        const posFreq = 0.15;
        const posAmp = 0.15;

        const rotFreq = 0.15;
        const rotAmp = 0.5;

        const x = this._anchoredPosition.x + simplex.noise(time * posFreq, time * posFreq, 0.0) * posAmp;
        const y = this._anchoredPosition.y + simplex.noise((time + 128.0) * posFreq, (time + 128.0) * posFreq, 0.0) * posAmp;

        let xEulers = simplex.noise((time + 64.0) * rotFreq, (time + 64.0) * rotFreq, 0.0) * rotAmp;
        let yEulers = simplex.noise((time + 192.0) * rotFreq, (time + 192.0) * rotFreq, 0.0) * rotAmp;

        xEulers = this._anchoredRotation.x + THREE.MathUtils.degToRad(xEulers);
        yEulers = this._anchoredRotation.y + THREE.MathUtils.degToRad(yEulers);

        this._camera.position.set(x, y, this._anchoredPosition.z);
        this._camera.rotation.set(xEulers, yEulers, this._anchoredRotation.z);
    }
}