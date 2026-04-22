
AFRAME.registerComponent("mindar-orientation-reset", {
  init: function () {
    this.handleChange = this.handleChange.bind(this);
    this.resetCamera = this.resetCamera.bind(this);

    window.addEventListener("orientationchange", this.handleChange);
    window.addEventListener("resize", this.handleChange);
  },

  remove: function () {
    window.removeEventListener("orientationchange", this.handleChange);
    window.removeEventListener("resize", this.handleChange);
  },

  handleChange: function () {
    setTimeout(() => {
      this.resetCamera();
    }, 300);
  },

  resetCamera: function () {
    const cameraEl = this.el;

    // Reset transform
    cameraEl.object3D.rotation.set(0, 0, 0);
    cameraEl.object3D.position.set(0, 0, 0);

    // Reset look-controls internal state
    const look = cameraEl.components["look-controls"];
    if (look) {
      look.pitchObject.rotation.x = 0;
      look.yawObject.rotation.y = 0;
    }
  }
});
