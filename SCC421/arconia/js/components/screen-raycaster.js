AFRAME.registerComponent('screen-raycaster', {
  init: function () {
    this.el.sceneEl.addEventListener('loaded', () => {
      this.setup();
    });
  },

  setup: function () {
    // ✅ Get correct camera (critical fix)
    this.cameraEl = this.el.sceneEl.camera.el;
    this.camera = this.cameraEl.getObject3D('camera');

    // ✅ Get cursor from same camera
    this.cursor = this.cameraEl.querySelector('a-cursor');

    if (!this.camera || !this.cursor) {
      console.warn('Camera or cursor not ready');
      return;
    }

    this.mouse = new THREE.Vector2();

    // Input listeners
    window.addEventListener('mousemove', (e) => this.onMove(e));
    window.addEventListener('touchmove', (e) => this.onTouch(e), { passive: false });

    console.log('screen-raycaster ready');
  },

  onMove: function (e) {
    this.updateRay(e.clientX, e.clientY);
  },

  onTouch: function (e) {
    const t = e.touches[0];
    if (!t) return;
    this.updateRay(t.clientX, t.clientY);
  },

  updateRay: function (x, y) {
    if (!this.camera || !this.cursor) return;

    const canvas = this.el.sceneEl.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Normalize screen coords → NDC
    this.mouse.set(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1
    );

    // Project into world
    const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
    vector.unproject(this.camera);

    // ✅ Correct world origin
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);

    const direction = vector.sub(origin).normalize();

    // ✅ Update raycaster directly
    const raycasterComp = this.cursor.components.raycaster;
    if (!raycasterComp) return;

    const raycaster = raycasterComp.raycaster;

    raycaster.ray.origin.copy(origin);
    raycaster.ray.direction.copy(direction);

    // Optional: rotate cursor visual
    const target = origin.clone().add(direction);
    this.cursor.object3D.lookAt(target);

    // ✅ Force intersection check
    raycasterComp.checkIntersections();

    // 🔍 Debug (throttled)
    if (!this._lastLog || Date.now() - this._lastLog > 200) {
      console.log(
        'INTERSECTIONS:',
        raycasterComp.intersections.map(el => el.id)
      );
      this._lastLog = Date.now();
    }
  }
});