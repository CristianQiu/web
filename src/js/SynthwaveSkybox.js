import * as THREE from '../../node_modules/three/build/three.module.js';
import SynthwaveSkyboxShader from './SynthwaveSkyboxShader.js';

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
    }

    getMesh() {
        return this._mesh;
    }
}