AFRAME.registerComponent('target-marble-link', {
  schema: {
    marbleId: { type: 'string' }
  },

  init: function () {
    this.el.addEventListener('targetFound', () => {
      if (!window.bridgeConsoleController) return;
      window.bridgeConsoleController.onUpperTargetFound(this.data.marbleId);
    });
  }
});