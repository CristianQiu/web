export class DOMController {

	constructor() {
		this._setLocationHash('#main');

		this._hamburgerDivBg = document.querySelector('#hamburger-container');
		this._hamburgerMenuButton = document.querySelector('#hamburger-button');
		this._hamburgerBefore = document.querySelector('#hamburger-before');
		this._hamburgerCenter = document.querySelector('#hamburger-center');
		this._hamburgerAfter = document.querySelector('#hamburger-after');

		this._navBurgerItems = document.querySelectorAll('.navburger-item');

		this._projectContainer = document.querySelector('.project-container');
		this._projects = document.querySelectorAll('.project-container > .project');

		this._currSelectedNavBurgerItem = -1;
		this._navBurgerItemsHashIndexPairs = [];
		this._navBurgerItemsHashIndexPairs['#about'] = 0;
		this._navBurgerItemsHashIndexPairs['#projects'] = 1;
		this._navBurgerItemsHashIndexPairs['#contact'] = 2;

		this._addListeners();

		this._initialJoinAnimationFinished = false;

		this._onShowProjectsCallback = null;
		this._onHideProjectsCallback = null;

		this._onShowContactCallback = null;
		this._onHideContactCallback = null;
	}

	appendBodyChild(child) {
		document.body.appendChild(child);
	}

	setOnShowProjectsCallback(callback) {
		this._onShowProjectsCallback = callback;
	}

	setOnHideProjectsCallback(callback) {
		this._onHideProjectsCallback = callback;
	}

	setOnShowContactCallback(callback) {
		this._onShowContactCallback = callback;
	}

	setOnHideContactCallback(callback) {
		this._onHideContactCallback = callback;
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
		if (locationHash === location.hash)
			return;

		location.hash = locationHash;
		if (locationHash === '#main')
			return;

		let navBurgerItemIndex = -1;

		if (this._currSelectedNavBurgerItem >= 0) {
			this._navBurgerItems[this._currSelectedNavBurgerItem].classList.toggle('selected-navburger-item');

			switch (locationHash) {
				case ('#about'):
					this._hideProjects();
					break;
				case ('#projects'):
					this._showProjects();
					break;
				case ('#contact'):
					this._hideProjects();
					break;
				default:
					break;
			}
		}

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

	_showProjects() {
		this._projectContainer.classList.remove('hide-project-container');

		for (let i = 0; i < this._projects.length; ++i) {
			this._projects[i].classList.remove('hide-project');
		}

		this._onShowProjectsCallback();

		document.body.classList.add('overflow-y-scroll');
	}

	_hideProjects() {
		this._projectContainer.classList.add('hide-project-container');

		for (let i = 0; i < this._projects.length; ++i) {
			this._projects[i].classList.add('hide-project');
		}

		this._onHideProjectsCallback();

		document.body.classList.remove('overflow-y-scroll');
	}

	_addListeners() {
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