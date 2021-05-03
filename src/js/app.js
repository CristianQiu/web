import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import TWEEN from '@tweenjs/tween.js';
import SynthwaveCamera from './SynthwaveCamera';
import SynthwaveRenderer from './SynthwaveRenderer';
import SynthwaveSkybox from './SynthwaveSkybox';
import SynthwaveGrid from './SynthwaveGrid';
import AudioManager from './AudioManager';
import AudioSpectrumAnalyzer from './AudioSpectrumAnalyzer';
import SocialMediaReel from './SocialMediaReel';

let stats, clock, camera, renderer, grid, audioManager, audioSpectrumAnalyzer, socialMediaReel;

const start = function () {
	stats = new Stats();
	clock = new THREE.Clock();

	document.body.appendChild(stats.dom);

	const scene = new THREE.Scene();
	const sceneOverlay = new THREE.Scene();

	const w = innerWidth;
	const h = innerHeight;

	camera = new SynthwaveCamera(150.0, w / h, 0.3, 250);
	scene.add(camera.getCameraParent());

	const pixelRatio = Math.min(devicePixelRatio, 0.9);

	renderer = new SynthwaveRenderer(scene, sceneOverlay, camera.getCamera(), w, h, pixelRatio);
	document.body.appendChild(renderer.getDomElement());

	const skybox = new SynthwaveSkybox();
	scene.add(skybox.getMesh());

	grid = new SynthwaveGrid(128, 128, 1.0);
	grid.generate();
	scene.add(grid.getMesh());

	audioManager = new AudioManager(camera.getCamera());
	socialMediaReel = new SocialMediaReel(scene, camera.getCamera(), 3);

	document.getElementById('musicButton').addEventListener('click', onClickJoin);
	addEventListener('resize', onWindowResize, false);
};

const update = function () {
	requestAnimationFrame(update);

	const dt = clock.getDelta();
	const time = clock.getElapsedTime();

	stats.update();
	TWEEN.update();

	camera.breathe(dt, time);

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

const onClickJoin = function () {
	if (audioManager.isInitialized())
		return;

	const nameHeader = document.getElementById("name");
	nameHeader.classList.add("fader");
	nameHeader.style.visibility = "visible";

	audioManager.init();
	audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource(), 8192);
	audioManager.loadAndPlayMusic();

	camera.setToLookingSun();
	socialMediaReel.showIcons();
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