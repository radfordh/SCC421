AFRAME.registerComponent('base-indicator', {
  schema: {
    intensity: { default: 0.5 },
    startEvent: { default: 'activate' },
    endEvent: { default: 'deactivate' }
  },

  init: function () {
    const el = this.el;

    // Base material
    el.setAttribute('material', {
      shader: 'standard',
      color: '#333',
      emissive: '#fff',
      emissiveIntensity: 0
    });

    // Glow ON
    el.setAttribute('animation__on', {
      property: 'material.emissiveIntensity',
      to: this.data.intensity,
      dur: 150,
      startEvents: this.data.startEvent
    });

    // Glow OFF
    el.setAttribute('animation__off', {
      property: 'material.emissiveIntensity',
      to: 0,
      dur: 150,
      startEvents: this.data.endEvent
    });
  }
});