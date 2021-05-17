export default class DOMController {

	constructor() {
		this._addListeners();
		this._hamburgerMenu = document.getElementsByClassName('hamburger-container')[0];
		this._hamburgerMenuOpened = false;
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
		this._hamburgerMenu.addEventListener('click', this._onClickHamburguerMenu.bind(this));
	}

	_onClickHamburguerMenu() {
		this._hamburgerMenuOpened = !this._hamburgerMenuOpened;
		this._hamburgerMenu.style.width = '100%';
	}
}