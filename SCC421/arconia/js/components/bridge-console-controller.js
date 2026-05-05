AFRAME.registerComponent('bridge-console-controller', {
  init: function () {
    this.upperIds = ['m1', 'm2', 'm3', 'm4'];
    this.upperFound = new Set();
    this.currentLevel = 0;
    this.maxLevels = 5;
    this.roundResolved = false;
    this.inputLocked = false;
    this.topicLocked = false;
    this.upperCollection = document.querySelector("#upper-collection");
    this.xrClickPlayer = document.querySelector('#audio-manager').components['global-audio-manager'];

    this.topics = [
      'Thermotropism',
      'Gravitropism',
      'Phototropism',
      'Hydrotropism',
      'Thigmotropism',
    ];

    // Shuffle topic order once at start — each round gets a unique topic
    this.roundTopics = this.shuffleArray([0, 1, 2, 3, 4]);

    this.m1RotZ = null;
    this.m3RotZ = null;
    this.detectedTopic = null;
    this.requiredTopic = null;

    window.bridgeConsoleController = this;
    console.log('controller init');

    this.startRound();
  },

  shuffleArray: function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  getStar: function (id) {
    return document.querySelector('#' + id);
  },

  getBase: function (id) {
    return document.querySelector('#' + id + 'b');
  },

  setStarSpin: function (id, isOn) {
    const star = this.getStar(id);
    if (!star) return;
    star.emit(isOn ? 'spin-start' : 'spin-stop');
  },

  setBaseLit: function (id, isOn) {
    const base = this.getBase(id);
    if (!base) return;
    base.emit(isOn ? 'activate' : 'deactivate');
  },

  normaliseAngle: function (deg) {
    return ((deg % 360) + 360) % 360;
  },

  nearestSlot: function (deg) {
    return Math.round(this.normaliseAngle(deg) / 90) % 4 * 90;
  },

  // Detect topic index from m1 (TL) and m3 (BL) rotation slots.
  // CCW-positive: 90°CW → 270, 90°CCW → 90, 180° → 180, 0° → 0
  //
  //  Thermotropism : m1=0,   m3=270
  //  Gravitropism  : m1=0,   m3=0
  //  Phototropism  : m1=0,   m3=90
  //  Hydrotropism  : m1=0,   m3=180
  //  Thigmotropism : m1=270, m3=270
  detectTopic: function () {
    if (this.m3RotZ === null) return null;

    const m3Slot = this.nearestSlot(this.m3RotZ);

    if (m3Slot === 0)   return 1;  // Gravitropism
    if (m3Slot === 90)  return 2;  // Phototropism
    if (m3Slot === 180) return 3;  // Hydrotropism

    // m3Slot === 270: Thermotropism (m1=0) or Thigmotropism (m1=270)
    if (this.m1RotZ === null) return null;
    const m1Slot = this.nearestSlot(this.m1RotZ);
    return m1Slot === 270 ? 4 : 0;
  },

  startRound: function () {
    this.upperFound.clear();
    this.roundResolved = false;
    this.topicLocked = false;
    this.m1RotZ = null;
    this.m3RotZ = null;
    this.detectedTopic = null;
    this.requiredTopic = this.roundTopics[this.currentLevel];
    this.upperCollection.setAttribute("visible", true);
    this.updateRoundDisplay();
    console.log('Round', this.currentLevel + 1, '— find:', this.topics[this.requiredTopic]);
  },

  updateRoundDisplay: function (message) {
    const el = document.getElementById('round-display');
    if (!el) return;
    if (this.currentLevel >= this.maxLevels) {
      el.textContent = 'Complete!';
      return;
    }
    if (message) {
      el.textContent = message;
      return;
    }
    if (this.topicLocked) {
      el.textContent = this.topics[this.detectedTopic];
    } else {
      el.textContent = 'Find: ' + this.topics[this.requiredTopic];
    }
  },

  resetUpperRow: function () {
    this.upperIds.forEach((id) => {
      this.setStarSpin(id, false);
      this.setBaseLit(id, false);
      const star = this.getStar(id);
      if (star) star.setAttribute('rotation', {x: -90, y: 0, z: 0});
    });
    this.upperCollection.setAttribute("visible", false);
    this.upperFound.clear();
  },

  onUpperTargetFound: async function (upperId, rotZ) {
    if (this.roundResolved) return;
    if (this.inputLocked) return;
    if (this.upperFound.has(upperId)) return;

    // Try to detect/lock the topic from m1 and m3 rotations
    if (!this.topicLocked) {
      if (upperId === 'm1') this.m1RotZ = rotZ;
      if (upperId === 'm3') this.m3RotZ = rotZ;

      if (upperId === 'm1' || upperId === 'm3') {
        const topic = this.detectTopic();
        if (topic === null) return; // need both m1 and m3 — wait for the other one

        console.log('[topic] detected:', this.topics[topic], '| required:', this.topics[this.requiredTopic], '| m1RotZ:', this.m1RotZ, '| m3RotZ:', this.m3RotZ);

        if (topic !== this.requiredTopic) {
          // Silently reset — don't reveal what was detected or show an error
          this.m1RotZ = null;
          this.m3RotZ = null;
          return;
        }

        this.detectedTopic = topic;
        this.topicLocked = true;
        this.updateRoundDisplay();
      }
    }

    // Marbles only count once the correct slide is confirmed
    if (!this.topicLocked) return;

    this.upperFound.add(upperId);
    try { if (this.xrClickPlayer) this.xrClickPlayer.playSound(1); } catch (e) { console.warn('audio error', e); }
    this.setStarSpin(upperId, true);
    this.setBaseLit(upperId, true);

    // Phototropism: m2 (TR) is mirrored and undetectable — complete on m1+m3+m4
    const isPhototropism = this.detectedTopic === 2;
    const phototropismDone = isPhototropism && ['m1','m3','m4'].every(id => this.upperFound.has(id));

    if (this.upperFound.size === 4 || phototropismDone) {
      this.roundResolved = true;
      this.inputLocked = true;
      try { if (this.xrClickPlayer) this.xrClickPlayer.playSound(2); } catch (e) { console.warn('audio error', e); }
      await this.delay(400);
      await this.blinkUpperBasesTwice();
      this.resetUpperRow();

      this.currentLevel++;
      this.updateEnergyGauge(this.currentLevel);
      await this.showProgressStar(this.currentLevel);

      if (this.currentLevel < this.maxLevels) {
        this.inputLocked = false;
        this.startRound();
      } else {
        try { if (this.xrClickPlayer) this.xrClickPlayer.playSound(3); } catch (e) { console.warn('audio error', e); }
        this.inputLocked = false;
        this.updateRoundDisplay();
        console.log('All levels complete — navigating to final.html');
        setTimeout(() => { window.location.href = './final.html'; }, 2000);
      }
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

  showProgressStar: async function (level) {
    const pm = document.getElementById('pm' + level);
    if (!pm) return;

    const pos = pm.object3D.position;
    const x = pos.x.toFixed(2);
    const z = pos.z.toFixed(2);
    const restY = pos.y.toFixed(2);

    // Marble rises into place
    pm.setAttribute('animation__scale', 'property: scale; from: 0 0 0; to: 0.12 0.12 0.12; dur: 500; easing: easeOutBack');
    pm.setAttribute('animation__rise', `property: position; from: ${x} ${(pos.y - 0.35).toFixed(2)} ${z}; to: ${x} ${restY} ${z}; dur: 700; delay: 100; easing: easeOutCubic`);

    await this.delay(600);

    const rig = document.getElementById('camera-rig');
    const portal = document.getElementById('portal');
    if (rig) {
      // Ensure rig is at centre before panning
      rig.object3D.rotation.set(0, 0, 0);

      // Hide the AR camera and pan to the progress shelf
      if (portal) portal.style.display = 'none';
      rig.setAttribute('animation__pan', 'property: rotation; to: 0 80 0; dur: 1400; easing: easeInOutSine');
      await this.delay(2400);

      // Pan back to centre and restore the portal
      rig.setAttribute('animation__pan', 'property: rotation; to: 0 0 0; dur: 1400; easing: easeInOutSine');
      await this.delay(1500);
      if (portal) portal.style.display = 'block';
    }
  },

  updateEnergyGauge: function (level) {
    const fill = document.getElementById('energy-bar-fill');
    if (!fill) return;
    fill.style.height = ((level / this.maxLevels) * 100) + '%';
  },

  delay: function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});
