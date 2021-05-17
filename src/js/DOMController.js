export default class DOMController {

	constructor() {
		this._hamburgerDivBg = document.getElementById('hamburger-container');
		this._hamburgerMenuButton = document.getElementById('hamburger-button');
		this._hamburgerBefore = document.getElementById('hamburger-before');
		this._hamburgerCenter = document.getElementById('hamburger-center');
		this._hamburgerAfter = document.getElementById('hamburger-after');

		this._addListeners();
	}

	appendBodyChild(child) {
		document.body.appendChild(child);
	}

	removeItemsAfterLogin(timeMs = 100) {
		const removables = document.body.getElementsByClassName('removable');
		setTimeout(() => {
			for (let i = 0; i < removables.length; ++i) {
				removables[i].remove();
				--i;
			}
		}, timeMs);
	}

	changeAvChannelAndRemoveAfter(timeMs = 5000) {
		const avHtml = document.getElementById('crt-av');
		avHtml.innerHTML = 'AV-2';
		setTimeout(() => {
			avHtml.parentElement.remove();
		}, timeMs);
	}

	addFadeClassesAfterLogin() {
		const nameHeader = document.getElementById('name');
		nameHeader.classList.add('fader');

		// const infoBar = document.getElementById('info-bar');
		// infoBar.classList.add('fader-delayed');
	}

	_addListeners() {
		this._hamburgerMenuButton.addEventListener('click', this._onClickHamburguerMenu.bind(this));
	}

	_onClickHamburguerMenu() {
		this._hamburgerDivBg.classList.toggle('hamburger-unfolded');
		this._hamburgerBefore.classList.toggle('hamburger-cross-left');
		this._hamburgerCenter.classList.toggle('hamburger-cross-right');
		this._hamburgerAfter.classList.toggle('hamburger-cross-left');
	}
}