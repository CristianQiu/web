import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera = new SynthwaveCamera(50.0, w / h, 0.3, 250);
    // scene.add(camera.getCamera());

    const pixelRatio = Math.min(window.devicePixelRatio, 0.875);
    // document.getElementById('musicButton').innerHTML = pixelRatio;

    renderer = new SynthwaveRenderer(scene, camera.getCamera(), w, h, pixelRatio);
    document.body.appendChild(renderer.getDomElement());

    const skybox = new SynthwaveSkybox();
    scene.add(skybox.getMesh());

    grid = new SynthwaveGrid(128, 128, 1.0);
    grid.generate();
    scene.add(grid.getMesh());

    controls = new OrbitControls(camera.getCamera(), renderer.getDomElement());
    controls.minDistance = 1;
    controls.maxDistance = 30;
    controls.update();

    audioManager = new AudioManager(camera.getCamera());
    document.getElementById('musicButton').addEventListener('click', onClickPlayMusicButton);
    window.addEventListener('resize', onWindowResize, false);
};

const update = function () {
    stats.update();

    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    controls.update();

    const validSpectrumAnalyzer = audioSpectrumAnalyzer !== undefined && audioSpectrumAnalyzer !== null;

    if (validSpectrumAnalyzer) {
        audioSpectrumAnalyzer.analyzeFrameMeans(dt, audioManager.getAudioListenerSampleRate());
        grid.animate(time, audioSpectrumAnalyzer.getMeans(true));
    }
    else {
        grid.animate(time);
    }

    camera.breathe(time);

    renderer.render();

    requestAnimationFrame(update);
};

const onClickPlayMusicButton = function () {
    if (audioManager.isInitialized())
        return;

    audioManager.init();
    audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource(), 8192);
    audioManager.loadAndPlayMusic();
};

const onWindowResize = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.setAspect(w / h);
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);

    // document.getElementById('musicButton').innerHTML = window.devicePixelRatio;
};

start();
update();