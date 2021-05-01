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
import { PlaneBufferGeometry } from 'three';

let stats, clock;
let camera, renderer, grid, audioManager, audioSpectrumAnalyzer;
let controls;
// let textGeo;

const start = function () {
	stats = new Stats();
	clock = new THREE.Clock();

	document.body.appendChild(stats.dom);

	const scene = new THREE.Scene();

	const w = innerWidth;
	const h = innerHeight;

	camera = new SynthwaveCamera(150.0, w / h, 0.3, 250);
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

	// const loader = new THREE.FontLoader();

	// loader.load('../../resources/Monoton-Regular.json', function (font) {
	// 	textGeo = new THREE.TextGeometry('HELLO', {
	// 		font: font,
	// 		size: 4,
	// 		height: 0.1,
	// 		curveSegments: 12,
	// 		bevelEnabled: false,
	// 		bevelThickness: 1,
	// 		bevelSize: 1,
	// 		bevelOffset: 0,
	// 		bevelSegments: 5
	// 	});

	// 	textGeo.computeBoundingBox();

	// 	let textMesh1 = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));

	// 	textMesh1.position.x = 0.0;
	// 	textMesh1.position.y = 15.0;
	// 	textMesh1.position.z = 50.0;

	// 	scene.add(textMesh1);
	// });

	// const texture = new THREE.TextureLoader().load('../../resources/Test.png');

	const geometry = new THREE.PlaneGeometry(0.3, 24, 4);
	const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(100.0, 0.6, 0.6), side: THREE.DoubleSide });
	const plane = new THREE.Mesh(geometry, material);
	const plane2 = new THREE.Mesh(geometry, material);

	plane.position.set(8.0, 0.0, 30.0);
	plane2.position.set(-8.0, 0.0, 30.0);

	plane.rotateZ(THREE.MathUtils.degToRad(45));
	plane2.rotateZ(THREE.MathUtils.degToRad(-45));

	scene.add(plane);
	scene.add(plane2);

	document.getElementById('musicButton').addEventListener('click', onClickPlayMusic);
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

const onClickPlayMusic = function () {
	if (audioManager.isInitialized())
		return;

	audioManager.init();
	audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(audioManager.getAudioSource(), 8192);
	audioManager.loadAndPlayMusic();

	camera.setToLookingSun();
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