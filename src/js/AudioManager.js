import * as THREE from 'three';

export default class AudioManager {

    constructor(mainCameraListener) {
        this._musicFile = '../../resources/Like Before Royalty Free Planet INTLCMD.mp3';
        this._initialized = false;
        this._loadingMusic = false;

        this._audioLoader = null;
        this._audioListener = null;
        this._mainCameraListener = mainCameraListener;
        this._audioSource = null;
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
        const callback = this._onMusicLoaded.bind(this);
        this._audioLoader.load(this._musicFile, callback);
    }

    setVolume(volume) {
        const vol = THREE.MathUtils.clamp(volume, 0.0, 1.0);
        this._audioSource.setVolume(vol);
    }

    _onMusicLoaded(buffer) {
        this._audioSource.setBuffer(buffer);
        this._loadingMusic = false;
        this.setVolume(0.5);
        this._audioSource.setLoop(true);
        this._audioSource.play();
    }
}