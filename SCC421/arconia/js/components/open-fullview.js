/* global AFRAME */

AFRAME.registerComponent('open-fullview', {
  schema: {
    full: { type: 'string' },
    caption: { type: 'string', default: '' }
  },

  init() {
    this._onClick = () => {
      this.el.sceneEl.emit('open-fullview', {
        full: this.data.full,
        caption: this.data.caption
      });
    };

    this.el.addEventListener('click', this._onClick);
  },

  remove() {
    this.el.removeEventListener('click', this._onClick);
  }
});