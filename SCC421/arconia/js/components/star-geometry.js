AFRAME.registerComponent('star-fx', {
  schema: {
    color:       { default: '#ffffff' },
    haloRadius:  { default: 0.32 }
  },
  init: function () {
    const el    = this.el;
    const color = this.data.color;
    const r     = this.data.haloRadius;

    // Breathing pulse on scale
    el.setAttribute('animation__pulse', {
      property: 'scale',
      from: '0.93 0.93 0.93',
      to:   '1.07 1.07 1.07',
      dur:  1400,
      easing: 'easeInOutSine',
      loop: true,
      dir:  'alternate'
    });

    // Tilted orbiting halo ring
    const halo = document.createElement('a-entity');
    halo.setAttribute('geometry', `primitive: torus; radius: ${r}; radiusTubular: 0.013; segmentsTubular: 48`);
    halo.setAttribute('material',  `color: ${color}; emissive: ${color}; emissiveIntensity: 0.7; metalness: 0.2; roughness: 0.1; side: double; opacity: 0.8; transparent: true`);
    halo.setAttribute('animation__orbit', `property: rotation; from: 72 0 0; to: 72 360 0; dur: 2800; easing: linear; loop: true`);
    el.appendChild(halo);
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
