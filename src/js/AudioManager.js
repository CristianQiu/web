import { AudioLoader, AudioListener, Audio } from 'three';
import { Maths } from './Maths';
import TWEEN from '@tweenjs/tween.js';

export class AudioManager {

	constructor(mainCameraListener) {
		this._musicFile = '../../resources/BeyondMemory.mp3';
		this._initialized = false;
		this._loadingMusic = false;

		this._audioLoader = null;
		this._audioListener = null;
		this._mainCameraListener = mainCameraListener;
		this._audioSource = null;

		this._createFadeTween();
	}

	getAudioSource() {
		return this._audioSource;
	}

	getAudioListenerSampleRate() {
		return this._audioSource.context.sampleRate;
	}

	isInitialized() {
		return this._initialized;
	}

	init() {
		this._audioLoader = new AudioLoader();
		this._audioListener = new AudioListener();
		this._mainCameraListener.add(this._audioListener);
		this._audioSource = new Audio(this._audioListener);
		this._initialized = true;
	}

	loadAndPlayMusic() {
		if (this._audioSource.isPlaying || this._loadingMusic)
			return;

		this._loadingMusic = true;
		const callback = this._onMusicLoaded.bind(this);
		this._audioLoader.load(this._musicFile, callback);
	}

	setVolume(volume) {
		const vol = Maths.fastClamp(volume, 0.0, 1.0);
		this._audioSource.setVolume(vol);
	}

	_createFadeTween() {
		const fromVol = { x: 0.0 };
		const toVol = { x: 0.5 };
		const fadeTime = 4000;
		const easing = TWEEN.Easing.Quintic.InOut;

		this._fadeInVolTween = new TWEEN.Tween(fromVol)
			.to(toVol, fadeTime)
			.easing(easing)
			.onUpdate(() => {
				this.setVolume(fromVol.x);
			});
	}

	_onMusicLoaded(buffer) {
		this._audioSource.setBuffer(buffer);
		this._loadingMusic = false;
		this._fadeInVolTween.start();
		this._audioSource.setLoop(true);
		this._audioSource.play();
	}
}