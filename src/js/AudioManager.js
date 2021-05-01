import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

const onMusicLoaded = function (buffer) {
	this._audioSource.setBuffer(buffer);
	this._loadingMusic = false;
	this._fadeInVolTween.start();
	this._audioSource.setLoop(true);
	this._audioSource.play();
};

export default class AudioManager {

	constructor(mainCameraListener) {
		this._musicFile = '../../resources/Like Before Royalty Free Planet INTLCMD.mp3';
		this._initialized = false;
		this._loadingMusic = false;

		this._audioLoader = null;
		this._audioListener = null;
		this._mainCameraListener = mainCameraListener;
		this._audioSource = null;

		const fromVol = { x: 0.0 };
		const toVol = { x: 0.5 };
		const easing = TWEEN.Easing.Quintic.InOut;

		this._fadeInVolTween = new TWEEN.Tween(fromVol)
			.to(toVol, 4000)
			.easing(easing)
			.onUpdate(() => {
				this.setVolume(fromVol.x);
			});
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
		this._audioLoader = new THREE.AudioLoader();
		this._audioListener = new THREE.AudioListener();
		this._mainCameraListener.add(this._audioListener);
		this._audioSource = new THREE.Audio(this._audioListener);
		this._initialized = true;
	}

	loadAndPlayMusic() {
		if (this._audioSource.isPlaying || this._loadingMusic)
			return;

		this._loadingMusic = true;
		const callback = onMusicLoaded.bind(this);
		this._audioLoader.load(this._musicFile, callback);
	}

	setVolume(volume) {
		const vol = THREE.MathUtils.clamp(volume, 0.0, 1.0);
		this._audioSource.setVolume(vol);
	}
}