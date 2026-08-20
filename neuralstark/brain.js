/* NeuralStark — scène 3D du cerveau (three.js, build global vendorisé).
 *
 * Ce n'est pas un décor abstrait : chaque point est un des 130 agents réels du
 * catalogue (data/agents.json). Les états de la scène suivent le récit de la page :
 *
 *   hero      sphère lente, le cerveau au repos
 *   scatter   les documents dispersés flottent hors du cerveau
 *   ingest    ils sont aspirés vers le cœur et deviennent des nœuds
 *   route     plan resserré, le cœur pulse, les agents routés s'allument
 *   clusters  les nœuds se regroupent par domaine métier
 *   vault     tout se contracte dans une coque de confinement
 *   calm      le cerveau s'éloigne, en fond
 */
(function () {
  "use strict";

  var COLD = [0.36, 0.50, 0.63];   // acier
  var HOT  = [0.88, 0.545, 0.30];  // cuivre

  // "#e08b4c" ou "224,139,76" → [r, v, b] normalisés
  function toRGB(value, fallback) {
    if (!value) return fallback.slice();
    var v = String(value).trim();
    var m = v.match(/^#?([0-9a-f]{6})$/i);
    if (m) {
      var n = parseInt(m[1], 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    var parts = v.replace(/[^0-9.,]/g, "").split(",").map(parseFloat);
    if (parts.length >= 3 && parts.every(function (x) { return !isNaN(x); })) {
      return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
    }
    return fallback.slice();
  }

  function toHex(rgb) {
    return (Math.round(rgb[0] * 255) << 16) + (Math.round(rgb[1] * 255) << 8) + Math.round(rgb[2] * 255);
  }

  var STATES = {
    hero:     { layout: "sphere",   dist: 7.6, offX: 1.35, offY: 0.15, spin: 0.055, docs: 0.0, shell: 0.0, opacity: 1.00, core: 1.0 },
    scatter:  { layout: "scatter",  dist: 9.0, offX: 0.60, offY: -1.10, spin: 0.020, docs: 1.0, shell: 0.0, opacity: 0.85, core: 0.5 },
    ingest:   { layout: "sphere",   dist: 8.2, offX: 0.10, offY: -1.35, spin: 0.050, docs: 1.0, shell: 0.0, opacity: 1.00, core: 1.0 },
    route:    { layout: "tight",    dist: 5.8, offX: 0.45, offY: 1.30, spin: 0.070, docs: 0.0, shell: 0.0, opacity: 1.00, core: 1.6 },
    clusters: { layout: "clusters", dist: 10.2, offX: 0.00, offY: 0.10, spin: 0.000, docs: 0.0, shell: 0.0, opacity: 1.00, core: 0.7 },
    vault:    { layout: "core",     dist: 7.4, offX: -0.10, offY: -1.35, spin: 0.035, docs: 0.0, shell: 1.0, opacity: 0.95, core: 1.2 },
    drift:    { layout: "sphere",   dist: 9.8, offX: -2.20, offY: -0.60, spin: 0.030, docs: 0.0, shell: 0.0, opacity: 0.75, core: 0.6 },
    calm:     { layout: "sphere",   dist: 11.0, offX: 2.10, offY: -0.40, spin: 0.028, docs: 0.0, shell: 0.0, opacity: 0.55, core: 0.6 },
    final:    { layout: "tight",    dist: 7.0, offX: 0.00, offY: -0.10, spin: 0.050, docs: 0.0, shell: 0.0, opacity: 0.95, core: 1.3 }
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(seed) { // générateur déterministe : la scène est identique à chaque visite
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function glowTexture(rgb) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var base = Math.round(rgb[0] * 255) + "," + Math.round(rgb[1] * 255) + "," + Math.round(rgb[2] * 255);
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(" + base + ",0.55)");
    grad.addColorStop(0.35, "rgba(" + base + ",0.16)");
    grad.addColorStop(1, "rgba(" + base + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function docTexture() {
    var c = document.createElement("canvas");
    c.width = 128; c.height = 168;
    var g = c.getContext("2d");
    g.fillStyle = "#8e9aa8";
    g.fillRect(0, 0, 128, 168);
    g.fillStyle = "#5d6a78";
    for (var i = 0; i < 9; i++) {
      var w = i === 0 ? 58 : 74 + ((i * 37) % 34);
      g.fillRect(16, 22 + i * 15, w, i === 0 ? 7 : 4);
    }
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  var NODE_VS = [
    "attribute float aGlow;",
    "attribute float aSize;",
    "uniform float uPix;",
    "uniform float uScale;",
    "varying float vGlow;",
    "void main() {",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  gl_Position = projectionMatrix * mv;",
    "  gl_PointSize = aSize * (1.0 + aGlow * 1.7) * uPix * (uScale / max(-mv.z, 0.001));",
    "  vGlow = aGlow;",
    "}"
  ].join("\n");

  var NODE_FS = [
    "uniform vec3 uCold;",
    "uniform vec3 uHot;",
    "uniform float uOpacity;",
    "uniform float uHalo;",
    "varying float vGlow;",
    "void main() {",
    "  vec2 d = gl_PointCoord - vec2(0.5);",
    "  float r = length(d);",
    "  if (r > 0.5) discard;",
    "  float core = smoothstep(0.5, 0.08, r);",
    "  float halo = smoothstep(0.5, 0.0, r) * uHalo;",
    "  float g = clamp(vGlow, 0.0, 1.0);",
    "  vec3 col = mix(uCold, uHot, g);",
    "  float a = (core * 0.9 + halo) * uOpacity * (0.55 + 0.45 * g);",
    "  gl_FragColor = vec4(col, a);",
    "}"
  ].join("\n");

  var LINE_VS = [
    "attribute float aGlow;",
    "varying float vGlow;",
    "void main() {",
    "  vGlow = aGlow;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  var LINE_FS = [
    "uniform vec3 uCold;",
    "uniform vec3 uHot;",
    "uniform float uOpacity;",
    "varying float vGlow;",
    "void main() {",
    "  float g = clamp(vGlow, 0.0, 1.0);",
    "  vec3 col = mix(uCold, uHot, g);",
    "  gl_FragColor = vec4(col, uOpacity * (0.06 + 0.5 * g));",
    "}"
  ].join("\n");

  function NeuralBrain(canvas, options) {
    var opts = options || {};
    this.count = opts.count || 130;
    this.reduced = !!opts.reducedMotion;
    this.canvas = canvas;
    this.cold = toRGB(opts.cold, COLD);
    this.hot = toRGB(opts.hot, HOT);
    // Fond clair : la fusion additive délave tout, on repasse en alpha classique.
    this.additive = opts.additive === undefined ? true : !!opts.additive;
    this.distScale = opts.distScale || 1;
    // Canevas encadré : le cerveau reste centré dans son cadre.
    this.offsetScale = opts.offsetScale === undefined ? 1 : opts.offsetScale;
    this.lineBoost = opts.lineBoost || 1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x000000, 0);
    this.pix = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.pix);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 0, 7.4);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.state = STATES.hero;
    this.stateName = "hero";
    this.dist = STATES.hero.dist;
    this.offX = 0;
    this.offY = 0;
    this.opacity = 1;
    this.docsAmt = 0;
    this.shellAmt = 0;
    this.coreAmt = 1;
    this.spin = 0;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.time = 0;
    this.clock = new THREE.Clock();
    this.running = false;
    this.categoryOf = new Array(this.count).fill(0);
    this.catCount = 12;

    this._buildLayouts();
    this._buildNodes();
    this._buildEdges();
    this._buildCore();
    this._buildPulses();
    this._buildDocs();
    this._buildShell();

    this.resize();
  }

  /* ————— géométries de destination ————— */

  NeuralBrain.prototype._buildLayouts = function () {
    var n = this.count, i;
    var rand = rnd(20240917);
    this.pos = new Float32Array(n * 3);
    this.sphere = new Float32Array(n * 3);
    this.tight = new Float32Array(n * 3);
    this.coreL = new Float32Array(n * 3);
    this.scatterL = new Float32Array(n * 3);
    this.clusterL = new Float32Array(n * 3);
    this.jitter = new Float32Array(n * 3);

    var golden = Math.PI * (3 - Math.sqrt(5));
    for (i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - y * y));
      var th = golden * i;
      var x = Math.cos(th) * rad;
      var z = Math.sin(th) * rad;
      var wob = 0.86 + rand() * 0.3;
      var R = 2.45 * wob;

      this.sphere[i * 3] = x * R;
      this.sphere[i * 3 + 1] = y * R * 0.92;
      this.sphere[i * 3 + 2] = z * R;

      this.tight[i * 3] = x * R * 0.72;
      this.tight[i * 3 + 1] = y * R * 0.66;
      this.tight[i * 3 + 2] = z * R * 0.72;

      this.coreL[i * 3] = x * R * 0.5;
      this.coreL[i * 3 + 1] = y * R * 0.46;
      this.coreL[i * 3 + 2] = z * R * 0.5;

      this.scatterL[i * 3] = (rand() - 0.5) * 13;
      this.scatterL[i * 3 + 1] = (rand() - 0.5) * 8;
      this.scatterL[i * 3 + 2] = (rand() - 0.5) * 7 - 1;

      this.jitter[i * 3] = rand() * 6.28;
      this.jitter[i * 3 + 1] = 0.02 + rand() * 0.05;
      this.jitter[i * 3 + 2] = rand() * 6.28;

      // position de départ : dispersée, le cerveau se forme à l'ouverture
      this.pos[i * 3] = this.scatterL[i * 3] * 0.8;
      this.pos[i * 3 + 1] = this.scatterL[i * 3 + 1] * 0.8;
      this.pos[i * 3 + 2] = this.scatterL[i * 3 + 2] * 0.8;
    }

    // L'agent 1, le Cerveau Central, siège au centre : toutes les liaisons en partent.
    for (var c = 0; c < 3; c++) {
      this.sphere[c] = 0; this.tight[c] = 0; this.coreL[c] = 0;
      this.jitter[c] = 0;
    }
    this._buildClusters();
  };

  // Regroupement par domaine : 12 amas disposés en couronne autour du contenu,
  // pour rester lisibles derrière la grille des domaines.
  NeuralBrain.prototype._buildClusters = function () {
    var n = this.count, i;
    var rand = rnd(77003);
    var centers = [];
    for (i = 0; i < this.catCount; i++) {
      var a = (i / this.catCount) * Math.PI * 2 - Math.PI / 2;
      centers.push([Math.cos(a) * 5.0, Math.sin(a) * 3.1, ((i % 3) - 1) * 0.9]);
    }
    for (i = 0; i < n; i++) {
      var c = centers[this.categoryOf[i] % centers.length];
      this.clusterL[i * 3] = c[0] + (rand() - 0.5) * 1.25;
      this.clusterL[i * 3 + 1] = c[1] + (rand() - 0.5) * 1.1;
      this.clusterL[i * 3 + 2] = c[2] + (rand() - 0.5) * 1.25;
    }
    // Le Cerveau Central reste au centre de la couronne.
    this.clusterL[0] = 0; this.clusterL[1] = 0; this.clusterL[2] = 0;
  };

  /* ————— objets ————— */

  NeuralBrain.prototype._buildNodes = function () {
    var n = this.count;
    var geo = new THREE.BufferGeometry();
    this.glow = new Float32Array(n);
    this.glowTarget = new Float32Array(n);
    var size = new Float32Array(n);
    var rand = rnd(4242);
    for (var i = 0; i < n; i++) {
      this.glow[i] = 0.16;
      this.glowTarget[i] = 0.16;
      size[i] = 1.45 + rand() * 0.95;
    }
    size[0] = 3.4; // Cerveau Central
    this.glow[0] = 0.8;
    this.glowTarget[0] = 0.6;
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("aGlow", new THREE.BufferAttribute(this.glow, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    this.nodeGeo = geo;

    this.nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uPix: { value: this.pix },
        uScale: { value: 26 },
        uOpacity: { value: 1 },
        uHalo: { value: this.additive ? 0.3 : 0.06 },
        uCold: { value: new THREE.Vector3(this.cold[0], this.cold[1], this.cold[2]) },
        uHot: { value: new THREE.Vector3(this.hot[0], this.hot[1], this.hot[2]) }
      },
      vertexShader: NODE_VS,
      fragmentShader: NODE_FS,
      transparent: true,
      depthWrite: false,
      blending: this.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });

    this.nodes = new THREE.Points(geo, this.nodeMat);
    this.nodes.frustumCulled = false;
    this.group.add(this.nodes);
  };

  // Chaque nœud est relié à ses deux plus proches voisins sur la sphère.
  NeuralBrain.prototype._buildEdges = function () {
    var n = this.count, i, j;
    var pairs = [];
    var seen = {};
    for (i = 0; i < n; i++) {
      var best = [[1e9, -1], [1e9, -1]];
      for (j = 0; j < n; j++) {
        if (i === j) continue;
        var dx = this.sphere[i * 3] - this.sphere[j * 3];
        var dy = this.sphere[i * 3 + 1] - this.sphere[j * 3 + 1];
        var dz = this.sphere[i * 3 + 2] - this.sphere[j * 3 + 2];
        var d = dx * dx + dy * dy + dz * dz;
        if (d < best[0][0]) { best[1] = best[0]; best[0] = [d, j]; }
        else if (d < best[1][0]) { best[1] = [d, j]; }
      }
      for (var k = 0; k < 2; k++) {
        var b = best[k][1];
        if (b < 0) continue;
        var key = Math.min(i, b) + ":" + Math.max(i, b);
        if (seen[key]) continue;
        seen[key] = 1;
        pairs.push([i, b]);
      }
      // liaison vers le cœur pour un nœud sur six : le Cerveau Central irrigue tout
      if (i % 6 === 0 && i !== 0) pairs.push([0, i]);
    }
    this.edges = pairs;

    var epos = new Float32Array(pairs.length * 6);
    var eglow = new Float32Array(pairs.length * 2);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(epos, 3));
    geo.setAttribute("aGlow", new THREE.BufferAttribute(eglow, 1));
    this.edgeGeo = geo;
    this.edgePos = epos;
    this.edgeGlow = eglow;

    this.edgeMat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1 },
        uCold: { value: new THREE.Vector3(this.cold[0], this.cold[1], this.cold[2]) },
        uHot: { value: new THREE.Vector3(this.hot[0], this.hot[1], this.hot[2]) }
      },
      vertexShader: LINE_VS,
      fragmentShader: LINE_FS,
      transparent: true,
      depthWrite: false,
      blending: this.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.lines = new THREE.LineSegments(geo, this.edgeMat);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
  };

  NeuralBrain.prototype._buildCore = function () {
    this.core = new THREE.Group();

    var inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 1),
      new THREE.MeshBasicMaterial({ color: toHex(this.hot), wireframe: true, transparent: true, opacity: 0.5 })
    );
    var outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.92, 0),
      new THREE.MeshBasicMaterial({ color: toHex(this.cold), wireframe: true, transparent: true, opacity: 0.16 })
    );
    this.coreInner = inner;
    this.coreOuter = outer;

    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(this.hot), transparent: true, depthWrite: false,
      blending: this.additive ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 0.9
    }));
    halo.scale.set(4.2, 4.2, 1);
    this.halo = halo;

    this.core.add(inner, outer, halo);
    this.group.add(this.core);
  };

  NeuralBrain.prototype._buildPulses = function () {
    var count = this.reduced ? 0 : 18;
    this.pulseCount = count;
    var pos = new Float32Array(Math.max(1, count) * 3);
    var glow = new Float32Array(Math.max(1, count));
    var size = new Float32Array(Math.max(1, count));
    this.pulses = [];
    var rand = rnd(9111);
    for (var i = 0; i < count; i++) {
      this.pulses.push({ e: Math.floor(rand() * this.edges.length), t: rand(), v: 0.25 + rand() * 0.5 });
      glow[i] = 1;
      size[i] = 1.0 + rand() * 0.5;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    this.pulseGeo = geo;
    this.pulsePos = pos;

    this.pulseMat = this.nodeMat.clone();
    this.pulseMat.uniforms.uScale.value = 22;
    this.pulseObj = new THREE.Points(geo, this.pulseMat);
    this.pulseObj.frustumCulled = false;
    this.pulseObj.visible = count > 0;
    this.group.add(this.pulseObj);
  };

  NeuralBrain.prototype._buildDocs = function () {
    var tex = docTexture();
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide });
    this.docs = [];
    var rand = rnd(31337);
    var geo = new THREE.PlaneGeometry(0.5, 0.66);
    for (var i = 0; i < 14; i++) {
      // matériau propre à chaque feuille : elles s'effacent à des instants différents
      var m = new THREE.Mesh(geo, mat.clone());
      m.userData = {
        a: rand() * 6.28,
        r: 4.2 + rand() * 2.2,
        y: (rand() - 0.5) * 3.8,
        s: 0.1 + rand() * 0.24,
        spin: (rand() - 0.5) * 0.6,
        phase: rand()
      };
      this.docs.push(m);
      this.group.add(m);
    }
  };

  NeuralBrain.prototype._buildShell = function () {
    this.shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 1),
      new THREE.MeshBasicMaterial({ color: toHex(this.cold), wireframe: true, transparent: true, opacity: 0 })
    );
    this.shell.visible = false;
    this.group.add(this.shell);
  };

  /* ————— données réelles ————— */

  NeuralBrain.prototype.setAgents = function (agents, categoryKeys) {
    if (!agents || !agents.length) return;
    this.agents = agents;
    this.catKeys = categoryKeys;
    this.catCount = categoryKeys.length || 12;
    for (var i = 0; i < this.count; i++) {
      var a = agents[i];
      this.categoryOf[i] = a ? Math.max(0, categoryKeys.indexOf(a.category)) : 0;
    }
    this._buildClusters();
  };

  /* ————— pilotage ————— */

  NeuralBrain.prototype.setState = function (name) {
    if (!STATES[name] || name === this.stateName) return;
    this.stateName = name;
    this.state = STATES[name];
    if (name !== "route" && name !== "clusters") this.clearHighlight();
  };

  NeuralBrain.prototype.highlight = function (indices, strength) {
    var s = strength === undefined ? 1 : strength;
    for (var i = 0; i < this.count; i++) this.glowTarget[i] = 0.06;
    this.glowTarget[0] = Math.max(this.glowTarget[0], 0.55);
    if (!indices) return;
    for (var k = 0; k < indices.length; k++) {
      var idx = indices[k];
      if (idx >= 0 && idx < this.count) this.glowTarget[idx] = s;
    }
  };

  NeuralBrain.prototype.highlightCategory = function (catIndex) {
    if (catIndex === null || catIndex === undefined || catIndex < 0) return this.clearHighlight();
    var list = [];
    for (var i = 0; i < this.count; i++) if (this.categoryOf[i] === catIndex) list.push(i);
    this.highlight(list, 0.95);
  };

  NeuralBrain.prototype.clearHighlight = function () {
    for (var i = 0; i < this.count; i++) this.glowTarget[i] = 0.16;
    this.glowTarget[0] = 0.55;
  };

  // Change de palette sans reconstruire la scène.
  NeuralBrain.prototype.setColors = function (cold, hot) {
    this.cold = toRGB(cold, this.cold);
    this.hot = toRGB(hot, this.hot);
    var mats = [this.nodeMat, this.edgeMat, this.pulseMat];
    for (var i = 0; i < mats.length; i++) {
      if (!mats[i]) continue;
      mats[i].uniforms.uCold.value.set(this.cold[0], this.cold[1], this.cold[2]);
      mats[i].uniforms.uHot.value.set(this.hot[0], this.hot[1], this.hot[2]);
    }
    this.coreInner.material.color.setHex(toHex(this.hot));
    this.coreOuter.material.color.setHex(toHex(this.cold));
    this.shell.material.color.setHex(toHex(this.cold));
    if (this.halo.material.map) this.halo.material.map.dispose();
    this.halo.material.map = glowTexture(this.hot);
    this.halo.material.needsUpdate = true;
  };

  NeuralBrain.prototype.setPointer = function (nx, ny) {
    this.pointer.tx = nx;
    this.pointer.ty = ny;
  };

  NeuralBrain.prototype.hitTest = function (clientX, clientY) {
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
      this.raycaster.params.Points.threshold = 0.22;
    }
    var r = this.canvas.getBoundingClientRect();
    var v = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1
    );
    this.raycaster.setFromCamera(v, this.camera);
    var hits = this.raycaster.intersectObject(this.nodes, false);
    return hits.length ? hits[0].index : -1;
  };

  NeuralBrain.prototype.resize = function () {
    var w = this.canvas.clientWidth || window.innerWidth;
    var h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.narrow = w < 900;
  };

  /* ————— boucle ————— */

  NeuralBrain.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    var self = this;
    var loop = function () {
      if (!self.running) return;
      self.frame = requestAnimationFrame(loop);
      self.update();
    };
    this.frame = requestAnimationFrame(loop);
  };

  NeuralBrain.prototype.stop = function () {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
  };

  NeuralBrain.prototype._targetArray = function () {
    switch (this.state.layout) {
      case "scatter": return this.scatterL;
      case "clusters": return this.clusterL;
      case "tight": return this.tight;
      case "core": return this.coreL;
      default: return this.sphere;
    }
  };

  NeuralBrain.prototype.update = function () {
    var dt = Math.min(this.clock.getDelta(), 0.05);
    var st = this.state;
    var i, i3;
    this.time += dt;

    // amortissement des transitions d'état
    var k = this.reduced ? 1 : 1 - Math.pow(0.001, dt);
    this.dist = lerp(this.dist, st.dist * this.distScale, k * 0.9);
    this.offX = lerp(this.offX, (this.narrow ? 0 : st.offX) * this.offsetScale, k * 0.9);
    this.offY = lerp(this.offY, (this.narrow ? Math.min(0, st.offY) * 0.4 : st.offY) * this.offsetScale, k * 0.9);
    this.opacity = lerp(this.opacity, st.opacity, k);
    this.docsAmt = lerp(this.docsAmt, st.docs, k);
    this.shellAmt = lerp(this.shellAmt, st.shell, k);
    this.coreAmt = lerp(this.coreAmt, st.core, k);

    this.camera.position.z = this.dist;
    this.group.position.x = this.offX;
    this.group.position.y = this.offY;

    // parallaxe pointeur, très retenue
    this.pointer.x = lerp(this.pointer.x, this.pointer.tx, 0.05);
    this.pointer.y = lerp(this.pointer.y, this.pointer.ty, 0.05);
    if (this.reduced) { /* rien */ }
    else if (st.spin === 0) this.spin = lerp(this.spin, Math.round(this.spin / 6.283) * 6.283, k * 0.55);
    else this.spin += dt * st.spin;
    this.group.rotation.y = this.spin + this.pointer.x * 0.32;
    this.group.rotation.x = Math.sin(this.time * 0.11) * 0.06 - this.pointer.y * 0.18;

    // morphing des nœuds + respiration
    var target = this._targetArray();
    var morph = this.reduced ? 1 : 1 - Math.pow(0.006, dt);
    var breathe = this.reduced ? 0 : 1;
    for (i = 0; i < this.count; i++) {
      i3 = i * 3;
      var ph = this.jitter[i3], amp = this.jitter[i3 + 1] * breathe, ph2 = this.jitter[i3 + 2];
      this.pos[i3] = lerp(this.pos[i3], target[i3] + Math.sin(this.time * 0.7 + ph) * amp, morph);
      this.pos[i3 + 1] = lerp(this.pos[i3 + 1], target[i3 + 1] + Math.cos(this.time * 0.6 + ph2) * amp, morph);
      this.pos[i3 + 2] = lerp(this.pos[i3 + 2], target[i3 + 2] + Math.sin(this.time * 0.5 + ph2) * amp, morph);

      var g = this.glow[i];
      this.glow[i] = g + (this.glowTarget[i] - g) * Math.min(1, dt * 3.2);
    }

    // activité de fond : un agent s'allume brièvement, comme une pensée qui passe
    if (!this.reduced && this.time - (this._lastSpark || 0) > 0.9) {
      this._lastSpark = this.time;
      var pick = 1 + Math.floor(Math.abs(Math.sin(this.time * 12.9898) * 43758.5453) % (this.count - 1));
      if (this.glowTarget[pick] < 0.5) this.glow[pick] = 0.85;
    }

    this.nodeGeo.attributes.position.needsUpdate = true;
    this.nodeGeo.attributes.aGlow.needsUpdate = true;
    this.nodeMat.uniforms.uOpacity.value = this.opacity;

    // arêtes : suivent les nœuds, s'éclairent avec eux
    for (i = 0; i < this.edges.length; i++) {
      var a = this.edges[i][0], b = this.edges[i][1];
      var o = i * 6;
      this.edgePos[o] = this.pos[a * 3];
      this.edgePos[o + 1] = this.pos[a * 3 + 1];
      this.edgePos[o + 2] = this.pos[a * 3 + 2];
      this.edgePos[o + 3] = this.pos[b * 3];
      this.edgePos[o + 4] = this.pos[b * 3 + 1];
      this.edgePos[o + 5] = this.pos[b * 3 + 2];
      this.edgeGlow[i * 2] = this.glow[a];
      this.edgeGlow[i * 2 + 1] = this.glow[b];
    }
    this.edgeGeo.attributes.position.needsUpdate = true;
    this.edgeGeo.attributes.aGlow.needsUpdate = true;
    this.edgeMat.uniforms.uOpacity.value = this.opacity * this.lineBoost * (this.state.layout === "scatter" ? 0.25 : 1);

    // influx nerveux le long des arêtes
    if (this.pulseCount) {
      for (i = 0; i < this.pulseCount; i++) {
        var p = this.pulses[i];
        p.t += dt * p.v;
        if (p.t > 1) { p.t = 0; p.e = (p.e + 7 + i) % this.edges.length; }
        var e = this.edges[p.e], ea = e[0] * 3, eb = e[1] * 3;
        this.pulsePos[i * 3] = lerp(this.pos[ea], this.pos[eb], p.t);
        this.pulsePos[i * 3 + 1] = lerp(this.pos[ea + 1], this.pos[eb + 1], p.t);
        this.pulsePos[i * 3 + 2] = lerp(this.pos[ea + 2], this.pos[eb + 2], p.t);
      }
      this.pulseGeo.attributes.position.needsUpdate = true;
      this.pulseMat.uniforms.uOpacity.value = this.opacity * (this.state.layout === "scatter" ? 0.12 : 0.6);
    }

    // cœur : pulsation indexée sur l'état
    var beat = this.reduced ? 1 : 1 + Math.sin(this.time * 1.7) * 0.05 * this.coreAmt;
    this.core.scale.setScalar(beat * (0.85 + this.coreAmt * 0.22));
    this.coreInner.rotation.y += dt * 0.35;
    this.coreInner.rotation.x += dt * 0.12;
    this.coreOuter.rotation.y -= dt * 0.18;
    this.coreInner.material.opacity = 0.5 * this.opacity;
    this.coreOuter.material.opacity = 0.16 * this.opacity;
    this.halo.material.opacity = (0.35 + 0.4 * this.coreAmt) * this.opacity;
    this.halo.scale.setScalar(3.4 + this.coreAmt * 1.1);

    // documents : orbitent, puis sont absorbés
    var dv = this.docsAmt;
    for (i = 0; i < this.docs.length; i++) {
      var m = this.docs[i], u = m.userData;
      var flow = this.stateName === "ingest" ? (this.time * u.s + u.phase) % 1 : 0;
      var rr = u.r * (1 - flow * 0.92);
      var ang = u.a + this.time * 0.12 * (1 + u.s);
      m.position.set(Math.cos(ang) * rr, u.y * (1 - flow * 0.85), Math.sin(ang) * rr * 0.4);
      m.rotation.y = ang + u.spin * this.time;
      m.rotation.z = Math.sin(this.time * 0.4 + u.a) * 0.25;
      m.scale.setScalar(0.55 + (1 - flow) * 0.4);
      m.visible = dv > 0.02;
      m.material.opacity = dv * 0.6 * (this.stateName === "ingest" ? (1 - flow) : 1);
    }

    // coque de confinement
    this.shell.visible = this.shellAmt > 0.02;
    this.shell.material.opacity = this.shellAmt * 0.3;
    this.shell.rotation.y -= dt * 0.05;
    this.shell.rotation.z += dt * 0.02;

    this.renderer.render(this.scene, this.camera);
  };

  window.NeuralBrain = NeuralBrain;
})();
