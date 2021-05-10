import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import TWEEN from '@tweenjs/tween.js';
import SynthwaveCamera from './SynthwaveCamera';
import SynthwaveRenderer from './SynthwaveRenderer';
import SynthwaveSkybox from './SynthwaveSkybox';
import SynthwaveGrid from './SynthwaveGrid';
import AudioManager from './AudioManager';
import AudioSpectrumAnalyzer from './AudioSpectrumAnalyzer';
import { Vector3 } from 'three';

let stats;
let clock, camera, renderer, skybox, grid, audioManager, audioSpectrumAnalyzer;
let pointer, raycaster, hits;

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

	grid = new SynthwaveGrid(128, 128, 1.0);
	grid.generate();
	scene.add(grid.getMesh());

	audioManager = new AudioManager(camera.getCamera());

	pointer = new THREE.Vector2();
	raycaster = new THREE.Raycaster();
	hits = [];

	document.getElementById('join').addEventListener('click', onClickJoin);
	addEventListener('pointermove', onPointerMove);
	addEventListener('resize', onWindowResize, false);

	renderer.fadeInCrt();
};

let frames = 0.0;

const update = function () {
	requestAnimationFrame(update);

	const dt = clock.getDelta();
	const time = clock.getElapsedTime();

	// frames += dt;

	// if (frames >= 0.033) {
	// 	frames -= 0.033;

	// dt = 0.033;

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
	//}
};

const setGridIntersectedPoint = function (pointerX, pointerY) {
	pointer.set(pointerX * 2.0 - 1.0, -(pointerY * 2.0 - 1.0));
	raycaster.setFromCamera(pointer, camera.getCamera());

	hits.length = 0;
	const intersects = raycaster.intersectObject(grid.getMesh(), false, hits);

	if (intersects.length > 0)
		grid.setIntersectedPoint(intersects[0].point);
};

const removeUnneededElementsOnceJoined = function () {
	const removables = document.body.getElementsByClassName("removable");

	setTimeout(() => {
		for (let i = 0; i < removables.length; ++i) {
			removables[i].remove();
			--i;
		}
	}, 100);
};

const onClickJoin = function () {
	if (audioManager.isInitialized())
		return;

	removeUnneededElementsOnceJoined();

	const avHtml = document.getElementById("crt-av");
	avHtml.innerHTML = "AV-2";

	setTimeout(() => {
		avHtml.parentElement.remove();
	}, 5000);

	const nameHeader = document.getElementById("name");
	nameHeader.classList.add("fader");

	const infoBar = document.getElementById("info-bar");
	infoBar.classList.add("fader-delayed");

	audioManager.init();
	audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource());
	audioManager.loadAndPlayMusic();

	camera.setToLookingSun();
	skybox.makeSunAppear();
	renderer.turnOnCrt();
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
	setGridIntersectedPoint(x, y);
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