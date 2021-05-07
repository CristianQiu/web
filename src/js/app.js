import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import TWEEN from '@tweenjs/tween.js';
import SynthwaveCamera from './SynthwaveCamera';
import SynthwaveRenderer from './SynthwaveRenderer';
import SynthwaveSkybox from './SynthwaveSkybox';
import SynthwaveGrid from './SynthwaveGrid';
import AudioManager from './AudioManager';
import AudioSpectrumAnalyzer from './AudioSpectrumAnalyzer';

let stats;
let clock, camera, renderer, skybox, grid, audioManager, audioSpectrumAnalyzer;

const start = function () {
	stats = new Stats();
	document.body.appendChild(stats.dom);

	clock = new THREE.Clock();

	const scene = new THREE.Scene();

	const w = innerWidth;
	const h = innerHeight;

	camera = new SynthwaveCamera(160.0, w / h, 0.3, 250);
	scene.add(camera.getCameraParent());

	const pixelRatio = Math.min(devicePixelRatio, 0.85);

	renderer = new SynthwaveRenderer(scene, camera.getCamera(), w, h, pixelRatio);
	document.body.appendChild(renderer.getDomElement());

	skybox = new SynthwaveSkybox();
	scene.add(skybox.getMesh());

	grid = new SynthwaveGrid(128, 128, 1.0);
	grid.generate();
	scene.add(grid.getMesh());

	audioManager = new AudioManager(camera.getCamera());

	document.getElementById('meet').addEventListener('click', onClickJoin);
	addEventListener('mousemove', onMouseMove);
	addEventListener('resize', onWindowResize, false);

	document.getElementById('debug').innerHTML = (w / h);
};

const update = function () {
	requestAnimationFrame(update);

	const dt = clock.getDelta();
	const time = clock.getElapsedTime();

	stats.update();
	TWEEN.update();

	skybox.update(dt);
	camera.update(dt, time);

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

	const joinButton = document.getElementById("meet").parentElement;
	joinButton.classList.add("fader-reverse");

	const nameHeader = document.getElementById("name");
	nameHeader.classList.add("fader");

	const infoBar = document.getElementById("info-bar");
	infoBar.classList.add("fader-delayed");

	audioManager.init();
	audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource());
	audioManager.loadAndPlayMusic();

	camera.setToLookingSun();
	skybox.makeSunAppear();
	renderer.fadeToColor();
};

const onMouseMove = function (e) {
	const w = innerWidth;
	const h = innerHeight;

	let x = e.clientX / w;
	let y = e.clientY / h;

	camera.rotateAccordingToMouseWindowPos(x, y);
	skybox.moveSunAccordingToMouseWindowPos(x, y);
};

const onWindowResize = function () {
	const w = innerWidth;
	const h = innerHeight;

	camera.setAspect(w / h);
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);

	document.getElementById('debug').innerHTML = (w / h);
};

start();
update();