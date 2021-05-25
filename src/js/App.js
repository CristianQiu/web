import { Clock, Scene } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { SynthwaveCamera } from './SynthwaveCamera';
import { SynthwaveRenderer } from './SynthwaveRenderer';
import { SynthwaveSkybox } from './SynthwaveSkybox';
import { SynthwaveGrid } from './SynthwaveGrid';
import { AudioManager } from './AudioManager';
import { AudioSpectrumAnalyzer } from './AudioSpectrumAnalyzer';
import { DOMController } from './DOMController';
import TWEEN from '@tweenjs/tween.js';

class App {

	constructor() {
		const w = innerWidth;
		const h = innerHeight;
		const pixelRatio = Math.max(0.9, devicePixelRatio * 0.6);

		this._stats = new Stats();
		this._clock = new Clock();

		this._scene = new Scene();
		this._camera = new SynthwaveCamera(150.0, w / h, 0.3, 250);
		this._renderer = new SynthwaveRenderer(this._scene, this._camera.getCamera(), w, h, pixelRatio);
		this._skybox = new SynthwaveSkybox();
		this._grid = new SynthwaveGrid(232, 232, 0.75);
		this._audioManager = new AudioManager(this._camera.getCamera());
		this._audioSpectrumAnalyzer = null;
		this._updateCallback = this.update.bind(this);

		this._domController = new DOMController();
	}

	init() {
		// this._domController.appendBodyChild(this._stats.dom);
		this._domController.appendBodyChild(this._renderer.getDomElement());

		this._grid.generate();

		this._scene.add(this._camera.getCameraParent());
		this._scene.add(this._skybox.getMesh());
		this._scene.add(this._grid.getMesh());

		this._renderer.fadeInCrt();

		this._addListeners();
	}

	update() {
		const dt = this._clock.getDelta();
		const time = this._clock.getElapsedTime();

		this._stats.update();
		TWEEN.update();

		this._skybox.update(dt);
		this._camera.update(dt, time);

		const validSpectrumAnalyzer = this._audioSpectrumAnalyzer !== undefined && this._audioSpectrumAnalyzer !== null;

		if (validSpectrumAnalyzer) {
			this._audioSpectrumAnalyzer.analyzeFrameMeans(dt, this._audioManager.getAudioListenerSampleRate());
			this._grid.animate(time, this._audioSpectrumAnalyzer.getMeans(true));
		}
		else {
			this._grid.animate(time);
		}

		this._renderer.render();

		requestAnimationFrame(this._updateCallback);
	}

	_addListeners() {
		document.querySelector('#join').addEventListener('click', this._onClickJoin.bind(this));
		addEventListener('pointermove', this._onPointerMove.bind(this));
		addEventListener('resize', this._onWindowResize.bind(this));
	}

	_onClickJoin() {
		if (this._audioManager.isInitialized())
			return;

		this._domController.joinWeb();

		this._audioManager.init();
		this._audioSpectrumAnalyzer = new AudioSpectrumAnalyzer(this._audioManager.getAudioSource());
		this._audioManager.loadAndPlayMusic();

		this._camera.setToLookingSun();
		this._skybox.makeSunAppear();
		this._renderer.turnOnCrt();
	}

	_onPointerMove(e) {
		if (!this._audioManager.isInitialized())
			return;

		const w = innerWidth;
		const h = innerHeight;

		let x = e.clientX / w;
		let y = e.clientY / h;

		this._camera.rotateAccordingToMouseWindowPos(x, y);
		this._skybox.moveSunAccordingToMouseWindowPos(x, y);
	}

	_onWindowResize() {
		const w = innerWidth;
		const h = innerHeight;

		this._camera.setAspect(w / h);
		this._camera.updateProjectionMatrix();

		this._renderer.setSize(w, h);
	}
}

const app = new App();

app.init();
app.update();