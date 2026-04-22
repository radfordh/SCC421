AFRAME.registerComponent('bridge-console-controller', {
  init: function () {
    this.lowerIds = ['m5', 'm6', 'm7', 'm8', 'm9'];
    this.upperIds = ['m1', 'm2', 'm3', 'm4'];

    this.selectedLowerId = null;
    this.lockedLowerId = null;
    this.upperFound = new Set();

    this.roundResolved = false;
    this.inputLocked = false;
	this.upperCollection = document.querySelector("#upper-collection");
	this.upperCollection.setAttribute("visible", false);
    this.xrClickPlayer = document.querySelector('#audio-manager').components['global-audio-manager'];

    this.lowerIds.forEach((id) => {
      const marble = document.querySelector('#' + id);
      marble.addEventListener('click', () => this.onLowerMarbleClicked(id));
    });

    window.bridgeConsoleController = this;
	console.log('controller init');
  },

  getMarble: function (id) {
    return document.querySelector('#' + id);
  },

  getBase: function (id) {
    return document.querySelector('#' + id + 'b');
  },

  setMarbleSpin: function (id, isOn) {
    const marble = this.getMarble(id);
    if (!marble) return;
    marble.emit(isOn ? 'spin-start' : 'spin-stop');
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
	this.upperCollection.setAttribute("visible", false);
    this.upperFound.clear();
  },

  onLowerMarbleClicked: function (id) {
	    
    if (this.inputLocked) return;
    if (this.lockedLowerId === id) return;
	console.log('DEBUG: lower marble click:', id);
	this.xrClickPlayer.playSound(0);
    // If this lower marble is already selected, leave it selected.
    if (this.selectedLowerId === id) return;
	


    // Deselect previously selected lower marble if it is still selectable.
    if (this.selectedLowerId && this.selectedLowerId !== this.lockedLowerId) {
      this.setBaseLit(this.selectedLowerId, false);
    }

    this.selectedLowerId = id;
    this.setBaseLit(id, true);

    // First-time lower selection for this round:
    // deselect all upper row marbles, unlight bases, stop rotation.
    this.resetUpperRow();
	this.upperCollection.setAttribute("visible", true);
    this.roundResolved = false;

  },

  onUpperTargetFound: async function (upperId) {
    if (this.roundResolved) return;
    if (!this.selectedLowerId) return;
    if (this.upperFound.has(upperId)) return;

    this.upperFound.add(upperId);

    if (this.xrClickPlayer) {
	  console.log("DEBUG: sound-upper");
      this.xrClickPlayer.playSound(1);
    }

    this.setMarbleSpin(upperId, true);
    this.setBaseLit(upperId, true);

    if (this.upperFound.size === 4) {
      this.roundResolved = true;
      this.inputLocked = true;
	  this.xrClickPlayer.playSound(2);
      await this.delay(400);
      await this.blinkUpperBasesTwice();
      this.resetUpperRow();

      // Finalize selected lower marble:
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