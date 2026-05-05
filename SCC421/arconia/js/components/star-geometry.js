AFRAME.registerComponent('model-color', {
  schema: { color: { default: '#ffffff' } },
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      const col = new THREE.Color(this.data.color);
      mesh.traverse(node => {
        if (!node.isMesh) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach(m => {
          m.color.set(col);
          m.emissive.set(col);
          m.emissiveIntensity = 2.0;
          m.needsUpdate = true;
        });
      });
    });
  }
});

AFRAME.registerGeometry('star', {
  schema: {
    outerRadius:  { default: 0.25 },
    innerRadius:  { default: 0.10 },
    points:       { default: 5 },
    depth:        { default: 0.08 },
    bevel:        { default: 0.015 }
  },
  init: function (data) {
    const shape = new THREE.Shape();
    const total = data.points * 2;

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? data.outerRadius : data.innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }
    shape.closePath();

    this.geometry = new THREE.ExtrudeGeometry(shape, {
      depth:           data.depth,
      bevelEnabled:    true,
      bevelThickness:  data.bevel,
      bevelSize:       data.bevel,
      bevelSegments:   3
    });
    this.geometry.center();
  }
});
