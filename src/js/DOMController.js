export class DOMController {

	constructor() {
		this._setLocationHash('#main');

		this._hamburgerDivBg = document.querySelector('#hamburger-container');
		this._hamburgerMenuButton = document.querySelector('#hamburger-button');
		this._hamburgerBefore = document.querySelector('#hamburger-before');
		this._hamburgerCenter = document.querySelector('#hamburger-center');
		this._hamburgerAfter = document.querySelector('#hamburger-after');

		this._navBurgerItems = document.querySelectorAll('.navburger-item');
		this._currSelectedNavBurgerItem = -1;
		this._navBurgerItemsHashIndexPairs = [];
		this._navBurgerItemsHashIndexPairs['#about'] = 0;
		this._navBurgerItemsHashIndexPairs['#projects'] = 1;
		this._navBurgerItemsHashIndexPairs['#contact'] = 2;

		this._addListeners();

		this._initialJoinAnimationFinished = false;
	}

	appendBodyChild(child) {
		document.body.appendChild(child);
	}

	joinWeb() {
		this._setLocationHash('#about');

		const removables = document.querySelectorAll('.removable');
		setTimeout(() => {
			for (let i = 0; i < removables.length; ++i) {
				removables[i].remove();
			}
		}, 100);

		const avHtml = document.querySelector('#crt-av');
		avHtml.innerHTML = 'AV-2';
		setTimeout(() => {
			avHtml.parentElement.remove();
		}, 5000);

		const rotuleContainer = document.querySelector('.rotule-container');
		rotuleContainer.classList.add('fader');

		const aboutContainer = document.querySelector('.about-container');
		aboutContainer.classList.add('fader');

		const hamburgerContainer = document.querySelector('.hamburger-container');
		hamburgerContainer.classList.add('fader-hamburger');

		// Note: workaround for Safari, because it is unable to animate the pointer events attribute and glitches out
		hamburgerContainer.addEventListener('animationend', () => {
			this._initialJoinAnimationFinished = true;
		});
	}

	_setLocationHash(locationHash) {
		location.hash = locationHash;
		if (locationHash === '#main')
			return;

		let navBurgerItemIndex = -1;

		if (this._currSelectedNavBurgerItem >= 0)
			this._navBurgerItems[this._currSelectedNavBurgerItem].classList.toggle('selected-navburger-item');

		navBurgerItemIndex = this._navBurgerItemsHashIndexPairs[locationHash];

		if (navBurgerItemIndex >= 0) {
			this._currSelectedNavBurgerItem = navBurgerItemIndex;
			this._navBurgerItems[navBurgerItemIndex].classList.toggle('selected-navburger-item');
		}
	}

	_toggleHamburgerMenu() {
		this._hamburgerDivBg.classList.toggle('hamburger-unfolded');
		this._hamburgerBefore.classList.toggle('hamburger-cross-left');
		this._hamburgerCenter.classList.toggle('hamburger-cross-right');
		this._hamburgerAfter.classList.toggle('hamburger-cross-left');

		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].classList.toggle('unfolded-navburger-item');
	}

	_toggleNavBurgerPointerEvents() {
		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].classList.toggle('no-pointer-events');
	}

	_addListeners() {
		this._addAllHamburgerListeners();
	}

	_addAllHamburgerListeners() {
		this._hamburgerMenuButton.addEventListener('click', this._onClickHamburgerMenu.bind(this));
		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].addEventListener('click', this._onClickNavBurgerItem.bind(this, i));
	}

	_onClickHamburgerMenu() {
		if (!this._initialJoinAnimationFinished)
			return;

		this._toggleHamburgerMenu();
		this._toggleNavBurgerPointerEvents();
	}

	_onClickNavBurgerItem(index) {
		for (let item in this._navBurgerItemsHashIndexPairs) {
			if (this._navBurgerItemsHashIndexPairs[item] === index) {
				this._setLocationHash(item);
				this._toggleHamburgerMenu();
				this._toggleNavBurgerPointerEvents();
			}
		}
	}
}