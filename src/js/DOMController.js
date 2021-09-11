export class DOMController {

	constructor() {
		// this.setLocationHash('#main');
		history.replaceState(null, null, '#main');

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

		this._aboutContainer = document.querySelector('.about-container');
		this._rotuleContainer = document.querySelector('.rotule');

		this._projectContainer = document.querySelector('.project-container');
		this._projects = document.querySelectorAll('.project-container > .project');

		this._contactContainer = document.querySelector('.contact-container');
		this._contactIcons = document.querySelectorAll('.contact-icon');

		this._unmutedSoundIcon = document.querySelector('.unmuted-icon');
		this._mutedSoundIcon = document.querySelector('.muted-icon');

		this._addListeners();

		this._menuOpened = false;
		this._onOpenMenu = null;
		this._onCloseMenu = null;

		this._onShowProjectsCallback = null;
		this._onHideProjectsCallback = null;

		this._onShowContactCallback = null;
		this._onHideContactCallback = null;

		this._onClickSoundIconCallback = null;

		this._initialJoinAnimationFinished = false;
	}

	appendBodyChild(child) {
		document.body.appendChild(child);
	}

	setOnOpenMenuCallback(callback) {
		this._onOpenMenu = callback;
	}

	setOnCloseMenuCallback(callback) {
		this._onCloseMenu = callback;
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

	setOnClickSoundIconCallback(callback) {
		this._onClickSoundIconCallback = callback;
	}

	joinWeb() {
		history.replaceState(null, null, '#about');
		this.setLocationHash('#about', true);

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

	isInProjectsSection() {
		return location.hash === '#projects';
	}

	setLocationHash(locationHash, force = false) {
		if (locationHash === location.hash && !force) {
			return;
		}

		location.hash = locationHash;
		let navBurgerItemIndex = -1;

		if (this._currSelectedNavBurgerItem >= 0)
			this._navBurgerItems[this._currSelectedNavBurgerItem].classList.toggle('selected-navburger-item');

		this._showMenuFromLocationHash(locationHash);

		navBurgerItemIndex = this._navBurgerItemsHashIndexPairs[locationHash];

		if (navBurgerItemIndex >= 0) {
			this._currSelectedNavBurgerItem = navBurgerItemIndex;
			this._navBurgerItems[navBurgerItemIndex].classList.toggle('selected-navburger-item');
		}
	}

	_showMenuFromLocationHash(locationHash) {
		switch (locationHash) {
			case ('#about'):
				this._hideProjects();
				this._hideContact();
				this._showAbout();
				break;
			case ('#projects'):
				this._hideContact();
				this._hideAbout();
				this._showProjects();
				break;
			case ('#contact'):
				this._hideProjects();
				this._hideAbout();
				this._showContact();
				break;
			default:
				break;
		}
	}

	_toggleHamburgerMenu() {
		this._menuOpened = !this._menuOpened;

		this._hamburgerDivBg.classList.toggle('hamburger-unfolded');
		this._hamburgerBefore.classList.toggle('hamburger-cross-left');
		this._hamburgerCenter.classList.toggle('hamburger-cross-right');
		this._hamburgerAfter.classList.toggle('hamburger-cross-left');

		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].classList.toggle('unfolded-navburger-item');

		if (this._menuOpened)
			this._onOpenMenu();
		else
			this._onCloseMenu();
	}

	_toggleNavBurgerPointerEvents() {
		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].classList.toggle('no-pointer-events');
	}

	_showAbout() {
		// Note: for some odd reason safari glitches with opacity, so just go with hidden.
		// Note that it is the same effect as opacity is not being animated in "aboutContainer"
		this._rotuleContainer.classList.remove('hide-opacity');
		this._aboutContainer.classList.remove('visibility-hidden');
	}

	_hideAbout() {
		this._rotuleContainer.classList.add('hide-opacity');
		this._aboutContainer.classList.add('visibility-hidden');
	}

	_showProjects() {
		this._projectContainer.classList.remove('hide-project-container');

		for (let i = 0; i < this._projects.length; ++i)
			this._projects[i].classList.remove('hide-project');

		this._onShowProjectsCallback();
		document.body.classList.add('overflow-y-scroll');
	}

	_hideProjects() {
		this._projectContainer.classList.add('hide-project-container');

		for (let i = 0; i < this._projects.length; ++i)
			this._projects[i].classList.add('hide-project');

		this._onHideProjectsCallback();
		document.body.classList.remove('overflow-y-scroll');
	}

	_showContact() {
		for (let i = 0; i < this._contactIcons.length; ++i)
			this._contactIcons[i].classList.add('show-contact-icon');

		this._onShowContactCallback();
	}

	_hideContact() {
		for (let i = 0; i < this._contactIcons.length; ++i)
			this._contactIcons[i].classList.remove('show-contact-icon');

		this._onHideContactCallback();
	}

	_toggleMute() {
		this._unmutedSoundIcon.classList.toggle('display-initial');
		this._unmutedSoundIcon.classList.toggle('display-none');

		this._mutedSoundIcon.classList.toggle('display-initial');
		this._mutedSoundIcon.classList.toggle('display-none');

		this._onClickSoundIconCallback();
	}

	_addListeners() {
		this._hamburgerMenuButton.addEventListener('click', this._onClickHamburgerMenu.bind(this));
		for (let i = 0; i < this._navBurgerItems.length; ++i)
			this._navBurgerItems[i].addEventListener('click', this._onClickNavBurgerItem.bind(this, i));

		this._mutedSoundIcon.addEventListener('click', this._onClickSoundIcon.bind(this));
		this._unmutedSoundIcon.addEventListener('click', this._onClickSoundIcon.bind(this));
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
				this.setLocationHash(item);
				this._toggleHamburgerMenu();
				this._toggleNavBurgerPointerEvents();
			}
		}
	}

	_onClickSoundIcon() {
		this._toggleMute();
	}
}