// AudioComponentFactory.js (event-aware version)

const AudioComponentFactory = (() => {
  if (typeof AFRAME !== 'undefined' && !AFRAME.components['global-audio-manager']) {
    AFRAME.registerComponent('global-audio-manager', {
      schema: {
        sources: { type: 'array', default: [] },
        volume: { type: 'number', default: 0.18 }
      },

      init() {
        this._started = false;

        this.ambient = null;
        this.eventAudios = [];

        const sources = this.data.sources.length
          ? this.data.sources
          : ['/assets/sounds/ambient-pad.m4a'];

        // --- Ambient (first entry)
        const ambientSrc = sources[0];
        this.ambient = new Audio();
        this.ambient.src = ambientSrc;
        this.ambient.loop = true;
        this.ambient.preload = 'metadata';
        this.ambient.playsInline = true;
        this.ambient.crossOrigin = 'anonymous';
        this.ambient.volume = this.data.volume;

        // --- Event-triggered pool (rest)
        for (let i = 1; i < sources.length; i++) {
          const a = new Audio();
          a.src = sources[i];
		  console.log("DEBUG:", a.src);
          a.loop = false;
          a.preload = 'auto';
          a.playsInline = true;
          a.crossOrigin = 'anonymous';
          a.volume = this.data.volume;
          this.eventAudios.push(a);
        }

        this._onFirstGesture = this._onFirstGesture.bind(this);

        window.addEventListener('pointerdown', this._onFirstGesture, { once: true, passive: true });
        window.addEventListener('touchend', this._onFirstGesture, { once: true, passive: true });
        window.addEventListener('click', this._onFirstGesture, { once: true, passive: true });
      },

      remove() {
        window.removeEventListener('pointerdown', this._onFirstGesture);
        window.removeEventListener('touchend', this._onFirstGesture);
        window.removeEventListener('click', this._onFirstGesture);

        if (this.ambient) {
          try { this.ambient.pause(); } catch {}
          this.ambient.src = '';
        }

        this.eventAudios.forEach(a => {
          try { a.pause(); } catch {}
          a.src = '';
        });

        this.eventAudios = [];
      },

      async _onFirstGesture() {
        if (this._started) return;
        this._started = true;

        try { this.ambient.load(); } catch {}

        try {
          const p = this.ambient.play();
          if (p && typeof p.then === 'function') await p;
        } catch (e) {
          console.error('[global-audio-manager] ambient play failed:', e);
        }
      },

      // --- PUBLIC API: trigger by index
      playSound(index = 0) {
		console.log("DEBUG: Playing ", index, this.eventAudios[index].src);
        const audio = this.eventAudios[index];
        if (!audio) return;

        try {
          audio.currentTime = 0; // restart
          audio.play().catch(() => {});
        } catch {}
      }
    });
  }

  function create({
    sources = ['assets/sounds/ambient-pad.m4a'],
    volume = 0.18
  } = {}) {
    const e = document.createElement('a-entity');
    e.id = 'audio-manager';

    const resolvedSources = sources.map(src =>
      new URL(src, document.baseURI).href
    );

    e.setAttribute(
      'global-audio-manager',
      `sources: ${resolvedSources.join(',')}; volume: ${volume}`
    );

    return e;
  }

  return { create };
})();