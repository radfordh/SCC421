AFRAME.registerComponent('target-marble-link', {
  schema: {
    marbleId: { type: 'string' }
  },

  init: function () {
    this.active = false;
    this.frameCount = 0;
    // Reuse allocations to avoid GC pressure in tick
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._euler = new THREE.Euler();

    this.el.addEventListener('targetFound', () => {
      this.active = true;
      this.frameCount = 0;
    });

    this.el.addEventListener('targetLost', () => {
      this.active = false;
    });
  },

  tick: function () {
    if (!this.active) return;
    const ctrl = window.bridgeConsoleController;
    if (!ctrl) return;

    // Stop retrying once this marble has been accepted
    if (ctrl.upperFound.has(this.data.marbleId)) return;

    this.frameCount++;

    // Try every 15 frames (~4x/sec), log every 60 frames (~1x/sec)
    if (this.frameCount % 15 !== 0) return;

    const o3d = this.el.object3D;

    // Decompose matrix directly — o3d.rotation (Euler) can be stale if MindAR
    // sets the matrix without going through the quaternion/rotation setters.
    o3d.matrix.decompose(this._p, this._q, this._s);
    this._euler.setFromQuaternion(this._q, 'XYZ');
    const rz = THREE.MathUtils.radToDeg(this._euler.z);

    if (this.frameCount % 60 === 0) {
      const rx = THREE.MathUtils.radToDeg(this._euler.x).toFixed(1);
      const ry = THREE.MathUtils.radToDeg(this._euler.y).toFixed(1);
      console.log(`[target] ${this.data.marbleId}  X:${rx}°  Y:${ry}°  Z:${rz.toFixed(1)}°  (euler.z raw: ${THREE.MathUtils.radToDeg(o3d.rotation.z).toFixed(1)}°)`);
    }

    ctrl.onUpperTargetFound(this.data.marbleId, rz);
  }
});
