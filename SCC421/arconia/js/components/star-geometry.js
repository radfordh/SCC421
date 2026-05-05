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
          m.emissiveIntensity = 0.6;
          m.needsUpdate = true;
        });
      });
    });
  }
});

AFRAME.registerComponent('star-fx', {
  schema: {
    color: { default: '#ffffff' }
  },
  init: function () {
    const el    = this.el;
    const color = this.data.color;

    // Breathing pulse
    el.setAttribute('animation__pulse', {
      property: 'scale',
      from: '0.93 0.93 0.93',
      to:   '1.07 1.07 1.07',
      dur:  1400,
      easing: 'easeInOutSine',
      loop: true,
      dir:  'alternate'
    });

    // Sparkle points — low-poly spheres scattered around the star, twinkling independently
    const COUNT = 10;
    for (let i = 0; i < COUNT; i++) {
      const theta = (i / COUNT) * Math.PI * 2;
      const phi   = Math.acos(2 * (i / COUNT) - 1);
      const r     = 0.28 + Math.random() * 0.12;

      const x = (r * Math.sin(phi) * Math.cos(theta)).toFixed(3);
      const y = (r * Math.sin(phi) * Math.sin(theta)).toFixed(3);
      const z = (r * Math.cos(phi)).toFixed(3);

      const delay = Math.floor((i / COUNT) * 1400);
      const dur   = 500 + Math.floor(Math.random() * 400);

      const spark = document.createElement('a-entity');
      spark.setAttribute('geometry', 'primitive: sphere; radius: 0.018; segmentsWidth: 4; segmentsHeight: 4');
      spark.setAttribute('material',  `color: white; emissive: ${color}; emissiveIntensity: 2.0; transparent: true; opacity: 0`);
      spark.setAttribute('position',  `${x} ${y} ${z}`);
      spark.setAttribute('animation__twinkle', `property: material.opacity; from: 0; to: 1; dir: alternate; dur: ${dur}; delay: ${delay}; loop: true; easing: easeInOutSine`);
      el.appendChild(spark);
    }
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
