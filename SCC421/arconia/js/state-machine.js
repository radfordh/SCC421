AFRAME.registerComponent('bridge-console-controller', {
  init: function () {
    this.lowerIds = ['m5', 'm6', 'm7', 'm8', 'm9'];
    this.upperIds = ['m1', 'm2', 'm3', 'm4'];

    this.selectedLowerId = null;
    this.lockedLowerId = null;
    this.upperFound = new Set();

    this.roundResolved = false;
    this.inputLocked = false;

    this.xrClickPlayer = document.querySelector('#xr-click-player');

    this.lowerIds.forEach((id) => {
      const star = document.querySelector('#' + id);
      star.addEventListener('click', () => this.onLowerMarbleClicked(id));
    });

    window.bridgeConsoleController = this;
  },

  getMarble: function (id) {
    return document.querySelector('#' + id);
  },

  getBase: function (id) {
    return document.querySelector('#' + id + 'b');
  },

  setMarbleSpin: function (id, isOn) {
    const star = this.getMarble(id);
    if (!star) return;
    star.emit(isOn ? 'spin-start' : 'spin-stop');
  },

  setBaseLit: function (id, isOn) {
    const base = this.getBase(id);
    if (!base) return;
    base.emit(isOn ? 'activate' : 'deactivate');
  },

  resetUpperRow: function () {
    this.upperIds.forEach((id) => {
      this.setMarbleSpin(id, false);
      this.setBaseLit(id, false);
    });
    this.upperFound.clear();
  },

  onLowerMarbleClicked: function (id) {
    if (this.inputLocked) return;
    if (this.lockedLowerId === id) return;

    // If this lower star is already selected, leave it selected.
    if (this.selectedLowerId === id) return;

    // Deselect previously selected lower star if it is still selectable.
    if (this.selectedLowerId && this.selectedLowerId !== this.lockedLowerId) {
      this.setBaseLit(this.selectedLowerId, false);
    }

    this.selectedLowerId = id;
    this.setBaseLit(id, true);

    // First-time lower selection for this round:
    // deselect all upper row stars, unlight bases, stop rotation.
    this.resetUpperRow();
    this.roundResolved = false;
  },

  onUpperTargetFound: async function (upperId) {
    if (this.roundResolved) return;
    if (!this.selectedLowerId) return;
    if (this.upperFound.has(upperId)) return;

    this.upperFound.add(upperId);

    if (this.xrClickPlayer && this.xrClickPlayer.components.sound) {
      this.xrClickPlayer.components.sound.playSound();
    }

    this.setMarbleSpin(upperId, true);
    this.setBaseLit(upperId, true);

    if (this.upperFound.size === 4) {
      this.roundResolved = true;
      this.inputLocked = true;

      await this.delay(400);
      await this.blinkUpperBasesTwice();
      this.resetUpperRow();

      // Finalize selected lower star:
      this.lockedLowerId = this.selectedLowerId;
      this.setMarbleSpin(this.lockedLowerId, true);
      this.setBaseLit(this.lockedLowerId, true);

      this.inputLocked = false;
    }
  },

  blinkUpperBasesTwice: async function () {
    for (let i = 0; i < 2; i++) {
      this.upperIds.forEach((id) => this.setBaseLit(id, false));
      await this.delay(140);

      this.upperIds.forEach((id) => this.setBaseLit(id, true));
      await this.delay(140);
    }

    this.upperIds.forEach((id) => this.setBaseLit(id, false));
    await this.delay(80);
  },

  delay: function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});