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
// import { PlaneBufferGeometry } from 'three';

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

	const pixelRatio = Math.min(devicePixelRatio, 0.9);

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

	// const geometry = new THREE.PlaneGeometry(0.2, 27.25, 4);
	// const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(10.6, 0.4, 10.6), side: THREE.DoubleSide });
	// const plane = new THREE.Mesh(geometry, material);
	// const plane2 = new THREE.Mesh(geometry, material);

	// const plane3 = new THREE.Mesh(geometry, material);
	// const plane4 = new THREE.Mesh(geometry, material);
	// const plane5 = new THREE.Mesh(geometry, material);
	// const plane6 = new THREE.Mesh(geometry, material);

	// const x = 6.8;
	// plane.position.set(x, 0.0, 20.0);
	// plane2.position.set(-x, 0.0, 20.0);
	// plane3.position.set(x, 0.0, 40.0);
	// plane4.position.set(-x, 0.0, 40.0);
	// plane5.position.set(x, 0.0, 60.0);
	// plane6.position.set(-x, 0.0, 60.0);

	// plane.rotateZ(THREE.MathUtils.degToRad(30));
	// plane2.rotateZ(THREE.MathUtils.degToRad(-30));
	// plane3.rotateZ(THREE.MathUtils.degToRad(30));
	// plane4.rotateZ(THREE.MathUtils.degToRad(-30));
	// plane5.rotateZ(THREE.MathUtils.degToRad(30));
	// plane6.rotateZ(THREE.MathUtils.degToRad(-30));

	// scene.add(plane);
	// scene.add(plane2);
	// scene.add(plane3);
	// scene.add(plane4);
	// scene.add(plane5);
	// scene.add(plane6);

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