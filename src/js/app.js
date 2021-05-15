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

	camera = new SynthwaveCamera(150.0, w / h, 0.3, 250);
	scene.add(camera.getCameraParent());

	const pixelRatio = Math.max(0.9, devicePixelRatio * 0.6);
	renderer = new SynthwaveRenderer(scene, camera.getCamera(), w, h, pixelRatio);
	document.body.appendChild(renderer.getDomElement());

	skybox = new SynthwaveSkybox();
	scene.add(skybox.getMesh());

	grid = new SynthwaveGrid(232, 232, 0.75);
	grid.generate();
	scene.add(grid.getMesh());

	audioManager = new AudioManager(camera.getCamera());

	document.getElementById('join').addEventListener('click', onClickJoin);
	if (DeviceMotionEvent) {
		addEventListener('devicemotion', onDeviceMotion);

	}
	addEventListener('pointermove', onPointerMove);
	addEventListener('resize', onWindowResize); // false? opt

	renderer.fadeInCrt();
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

	// const canvas = document.getElementsByTagName("canvas");

	// const w = innerWidth;
	// const h = innerHeight;

	// if (canvas.width != w || canvas.height != h) {
	// 	camera.setAspect(w / h);
	// 	camera.updateProjectionMatrix();

	// 	renderer.setSize(w, h);
	// }
};

const onClickJoin = function () {
	if (audioManager.isInitialized())
		return;

	const removables = document.body.getElementsByClassName('removable');
	setTimeout(() => {
		for (let i = 0; i < removables.length; ++i) {
			removables[i].remove();
			--i;
		}
	}, 100);

	const avHtml = document.getElementById('crt-av');
	avHtml.innerHTML = 'AV-2';
	setTimeout(() => {
		avHtml.parentElement.remove();
	}, 5000);

	const nameHeader = document.getElementById('name');
	nameHeader.classList.add('fader');

	// nameHeader.remove();

	const infoBar = document.getElementById('info-bar');
	infoBar.classList.add('fader-delayed');

	// infoBar.remove();

	audioManager.init();
	audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource());
	audioManager.loadAndPlayMusic();

	camera.setToLookingSun();
	skybox.makeSunAppear();
	renderer.turnOnCrt();
};

const onDeviceMotion = function (e) {
	const debugMotion = document.getElementById("motionDebug");
	debugMotion.innerHTML = e.acceleration;
};

const onPointerMove = function (e) {
	if (!audioManager.isInitialized())
		return;

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
};

start();
update();