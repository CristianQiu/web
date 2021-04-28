import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TWEEN from '@tweenjs/tween.js';
import SynthwaveCamera from './SynthwaveCamera';
import SynthwaveRenderer from './SynthwaveRenderer';
import SynthwaveSkybox from './SynthwaveSkybox';
import SynthwaveGrid from './SynthwaveGrid';
import AudioManager from './AudioManager';
import AudioSpectrumAnalyzer from './AudioSpectrumAnalyzer';

let stats, clock;
let camera, renderer, grid, audioManager, audioSpectrumAnalyzer;
let controls;

const start = function () {
    stats = new Stats();
    clock = new THREE.Clock();

    document.body.appendChild(stats.dom);

    const scene = new THREE.Scene();

    const w = innerWidth;
    const h = innerHeight;

    camera = new SynthwaveCamera(50.0, w / h, 0.3, 250);
    scene.add(camera.getCameraParent());

    const pixelRatio = Math.min(devicePixelRatio, 0.875);

    renderer = new SynthwaveRenderer(scene, camera.getCamera(), w, h, pixelRatio);
    document.body.appendChild(renderer.getDomElement());

    const skybox = new SynthwaveSkybox();
    scene.add(skybox.getMesh());

    grid = new SynthwaveGrid(128, 128, 1.0);
    grid.generate();
    scene.add(grid.getMesh());

    // controls = new OrbitControls(camera.getCamera(), renderer.getDomElement());
    // controls.minDistance = 1;
    // controls.maxDistance = 30;
    // controls.update();

    audioManager = new AudioManager(camera.getCamera());

    document.getElementById('musicButton').addEventListener('click', onClickPlayMusicButton);
    addEventListener('resize', onWindowResize, false);
};

const update = function () {
    requestAnimationFrame(update);

    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    stats.update();
    // TWEEN.update(time);

    // controls.update();
    camera.breathe(time);

    const validSpectrumAnalyzer = audioSpectrumAnalyzer !== undefined && audioSpectrumAnalyzer !== null;

    if (validSpectrumAnalyzer) {
        audioSpectrumAnalyzer.analyzeFrameMeans(dt, audioManager.getAudioListenerSampleRate());
        grid.animate(time, audioSpectrumAnalyzer.getMeans(true));
    }
    else {
        grid.animate(time);
    }

    renderer.render();
};

const onClickPlayMusicButton = function () {
    if (audioManager.isInitialized())
        return;

    audioManager.init();
    audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource(), 8192);
    audioManager.loadAndPlayMusic();
};

const onClickJoin = function () {
    // tween the camera

    // trigger the animation of the "button"
};

const onWindowResize = function () {
    const w = innerWidth;
    const h = innerHeight;

    camera.setAspect(w / h);
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
};

start();
update();