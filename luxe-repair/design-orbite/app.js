/* ===========================================================
   LUXE Repair, design "Orbite"
   1. Interactions de page (nav, reveal, services, sliders, formulaire)
   2. "Orbite" : film 3D piloté par le scroll, système de keyframes
      interpolées en smoothstep, progression amortie image par image.
   =========================================================== */
(function () {
  "use strict";

  var CONFIG = {
    email: "contact@luxerepair.ch",
    whatsapp: "41767573458"
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smoothstep = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  /* ===================== Année du footer ===================== */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ===================== WhatsApp pré-rempli ===================== */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aurais besoin d'une réparation à Genève.");
  }

  /* ===================== Navigation ===================== */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $("#burger");
  var links = $("#nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Ouvrir le menu");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Ouvrir le menu");
        burger.focus();
      }
    });
  }

  /* ===================== Apparition au scroll ===================== */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 70) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ===================== Services : colonne sticky ===================== */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcItems = $$(".svc-item");
  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      /* Nom, note et appareil changent d'un seul bloc : sinon un lot
         d'entrées d'observer peut laisser la photo et le titre desynchronises. */
      var applyPanel = function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        var svcDevice = $("#svc-device");
        var svcDeviceImg = $("#svc-device-img");
        if (svcDevice && svcDeviceImg && item.dataset.img && item.dataset.device) {
          svcDevice.className = "device device-" + item.dataset.device;
          svcDeviceImg.src = item.dataset.img;
        }
      };
      if (svcName.textContent === item.dataset.name) { applyPanel(); return; }
      window.clearTimeout(setCurrent.pending);
      if (reduceMotion || !svcCurrent) { applyPanel(); return; }
      svcCurrent.classList.add("switching");
      setCurrent.pending = window.setTimeout(function () {
        applyPanel();
        svcCurrent.classList.remove("switching");
      }, 200);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-44% 0px -44% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ===================== Sliders avant / après ===================== */
  $$("[data-ba]").forEach(function (fig) {
    var range = $(".ba-range", fig);
    if (!range) return;
    var apply = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });

  /* ===================== Formulaire, ouverture mailto ===================== */
  var form = $("#contact-form");
  var note = $("#form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.name || !data.email) {
        if (note) {
          note.textContent = "Merci d'indiquer au moins votre nom et votre e-mail.";
          note.className = "form-note err";
        }
        return;
      }
      var np = "non précisé";
      var body =
        "Nouvelle demande de réparation, LUXE Repair Genève\n\n" +
        "Nom       : " + data.name + "\n" +
        "E-mail    : " + data.email + "\n" +
        "Téléphone : " + (data.phone || np) + "\n" +
        "Appareil  : " + (data.device || np) + "\n\n" +
        "Description de la panne :\n" + (data.issue || np) + "\n";
      var href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis, " + (data.device || "appareil") + ", " + data.name) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     "ORBITE" : le film 3D de la réparation
     ===========================================================
     Les positions x et y des keyframes sont NORMALISÉES par la
     demi largeur et la demi hauteur visibles à la profondeur de
     l'objet : la chorégraphie garde donc la même lecture d'un
     écran 21/9 à un téléphone de 360 px. z est en unités monde.
     =========================================================== */
  var TAU = Math.PI * 2;

  var KEYFRAMES = [
    /* Hero : centre droit, proche de la caméra, face 3/4, rotation majestueuse. */
    { p: 0.00, at: null,
      pos: [0.42, 0.02, 1.7], rot: [0.10, -0.55, 0.03],
      scale: 1.02, explode: 0, glow: 0.55, opacity: 1, screen: 0.30 },

    /* À propos : il traverse vers la gauche en faisant un demi tour. */
    { p: 0.16, at: { id: "apropos", align: 0.5 },
      pos: [-0.50, 0.10, 0.5], rot: [0.05, -0.55 - Math.PI, -0.07],
      scale: 0.95, explode: 0, glow: 0.40, opacity: 0.96, screen: 0.20 },

    /* Services : il repart à droite, s'incline et éclate en vue explosée. */
    { p: 0.34, at: { id: "services", align: 0.5 },
      pos: [0.55, -0.05, -1.4], rot: [0.34, -0.55 - Math.PI * 1.9, -0.30],
      scale: 0.90, explode: 1, glow: 0.85, opacity: 0.95, screen: 0.10 },

    /* Pourquoi nous : réassemblage, descente vers le bas, tonneau complet. */
    { p: 0.56, at: { id: "pourquoi", align: 0.5 },
      pos: [0.30, -0.60, -0.7], rot: [0.34 + TAU, -0.55 - Math.PI * 2.5, 0.18],
      scale: 0.92, explode: 0, glow: 0.45, opacity: 0.9, screen: 0.18 },

    /* Portfolio : il recule au loin et s'efface, les vraies photos prennent la scène. */
    { p: 0.76, at: { id: "portfolio", align: 0.5 },
      pos: [-0.52, 0.28, -9.5], rot: [TAU + 0.14, -0.55 - Math.PI * 3.1, -0.10],
      scale: 0.60, explode: 0, glow: 0.14, opacity: 0.30, screen: 0.08 },

    /* Contact : retour au centre, face caméra, écran allumé. */
    { p: 0.92, at: { id: "contact", align: 0 },
      pos: [0, 0.40, 0.6], rot: [TAU - 0.09, -Math.PI * 4, 0],
      scale: 0.86, explode: 0, glow: 0.9, opacity: 1, screen: 1 },

    /* Fin du film : l'appareil réparé rayonne doucement. */
    { p: 1.00, at: null,
      pos: [0, 0.50, 0.2], rot: [TAU - 0.09, -Math.PI * 4, 0],
      scale: 0.84, explode: 0, glow: 1, opacity: 1, screen: 1 }
  ];

  /* Recalcule les p à partir de la hauteur réelle des sections. */
  function computeKeyframeProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (max <= 0) return;
    var prev = 0;
    for (var i = 0; i < KEYFRAMES.length; i++) {
      var k = KEYFRAMES[i];
      if (k.at) {
        var el = document.getElementById(k.at.id);
        if (el) {
          var top = el.getBoundingClientRect().top + window.scrollY;
          var target = top + (el.offsetHeight - window.innerHeight) * k.at.align;
          k.p = clamp(target / max, 0, 1);
        }
      }
      if (i > 0) k.p = Math.max(k.p, prev + 0.02);
      k.p = clamp(k.p, 0, 1);
      prev = k.p;
    }
    /* Sécurité : la dernière pose reste bien en fin de page. */
    KEYFRAMES[KEYFRAMES.length - 1].p = 1;
  }

  var pose = {
    pos: [0, 0, 0], rot: [0, 0, 0],
    scale: 1, explode: 0, glow: 0, opacity: 1, screen: 0
  };

  function poseAt(p) {
    var n = KEYFRAMES.length;
    var i = 0;
    while (i < n - 2 && p > KEYFRAMES[i + 1].p) i++;
    var a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
    var span = b.p - a.p;
    var t = span > 0.0001 ? smoothstep((p - a.p) / span) : 1;
    for (var j = 0; j < 3; j++) {
      pose.pos[j] = lerp(a.pos[j], b.pos[j], t);
      pose.rot[j] = lerp(a.rot[j], b.rot[j], t);
    }
    pose.scale = lerp(a.scale, b.scale, t);
    pose.explode = lerp(a.explode, b.explode, t);
    pose.glow = lerp(a.glow, b.glow, t);
    pose.opacity = lerp(a.opacity, b.opacity, t);
    pose.screen = lerp(a.screen, b.screen, t);
    return pose;
  }

  /* ---------- Textures générées au canvas 2D (aucun asset externe) ---------- */
  function radialTexture(THREE, size, stops) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(c);
    if ("colorSpace" in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function init3D() {
    var THREE = window.THREE;
    var canvas = $("#scene");
    if (!THREE || !canvas || reduceMotion) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance"
      });
    } catch (err) {
      return; /* pas de WebGL : la photo du hero et le dégradé clair restent en place */
    }
    if (!renderer || !renderer.getContext || !renderer.getContext()) return;

    var isSmall = window.innerWidth < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
    try {
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;
      }
    } catch (err) { /* moteur plus ancien : rendu par défaut */ }

    var ACCENT = 0x4a6fd4;
    var scene = new THREE.Scene();
    var CAM_Z = 12;
    var FOV = 42;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
    /* Légère plongée : le sol entre dans le cadre, l'ombre de contact
       se lit vraiment, et l'appareil est vu sous un angle plus cinéma. */
    camera.position.set(0, 1.15, CAM_Z);
    camera.lookAt(0, 0.15, 0);

    /* ---------- Lumières : clé froide + rim lights accent ---------- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc4cede, 1.15));
    var key = new THREE.DirectionalLight(0xf6f9ff, 2.3);
    key.position.set(6, 9, 8);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xdfe7f5, 0.7);
    fill.position.set(-7, 2, 6);
    scene.add(fill);
    var rimA = new THREE.PointLight(ACCENT, 90, 46, 2);
    rimA.position.set(-8, 3.5, 3.5);
    scene.add(rimA);
    var rimB = new THREE.PointLight(0x8fb0ff, 70, 44, 2);
    rimB.position.set(8, -4.5, -4);
    scene.add(rimB);
    var rimC = new THREE.PointLight(ACCENT, 55, 40, 2);
    rimC.position.set(0.5, 7, -6);
    scene.add(rimC);

    /* ---------- Matériaux ---------- */
    var phoneMats = [];
    function physical(opts) {
      var m = new THREE.MeshPhysicalMaterial(opts);
      phoneMats.push(m);
      return m;
    }

    var matAlu = physical({
      color: 0xc9ced6, metalness: 0.9, roughness: 0.25,
      clearcoat: 1, clearcoatRoughness: 0.15
    });
    var matCeramic = physical({
      color: 0xeff2f6, metalness: 0.06, roughness: 0.34,
      clearcoat: 1, clearcoatRoughness: 0.2
    });
    var matGlass = physical({
      color: 0x18203a, metalness: 0.35, roughness: 0.06,
      clearcoat: 1, clearcoatRoughness: 0.04,
      emissive: new THREE.Color(0x24407f), emissiveIntensity: 0.2
    });
    var matDisplay = physical({
      color: 0x111a2e, metalness: 0.2, roughness: 0.25,
      emissive: new THREE.Color(ACCENT), emissiveIntensity: 0.3
    });
    var matBattery = physical({ color: 0x3d4756, metalness: 0.45, roughness: 0.48 });
    var matBoard = physical({ color: 0x2a3342, metalness: 0.4, roughness: 0.5 });
    var matChip = physical({
      color: ACCENT, metalness: 0.85, roughness: 0.3,
      emissive: new THREE.Color(ACCENT), emissiveIntensity: 0.25
    });
    var matChipDark = physical({ color: 0x1c2330, metalness: 0.55, roughness: 0.42 });
    var matLens = physical({ color: 0x141a26, metalness: 0.85, roughness: 0.12, clearcoat: 1 });

    /* ---------- Boîte à coins arrondis ---------- */
    function roundedBox(w, h, depth, r, mat) {
      var shape = new THREE.Shape();
      var x = -w / 2, y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 8 });
      geo.translate(0, 0, -depth / 2);
      return new THREE.Mesh(geo, mat);
    }

    /* ---------- Le smartphone, en couches démontables ---------- */
    var phone = new THREE.Group();
    scene.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zOut, spiralR, phase, tilt) {
      mesh.position.z = zBase;
      layers.push({
        obj: mesh, base: zBase, out: zOut,
        r: spiralR, phase: phase, tilt: tilt,
        y0: mesh.position.y, x0: mesh.position.x
      });
      phone.add(mesh);
    }

    /* Vitre écran, émissive douce */
    var glass = roundedBox(2.72, 5.72, 0.07, 0.46, matGlass);
    var display = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.3), matDisplay);
    display.position.z = 0.046;
    glass.add(display);
    addLayer(glass, 0.27, 2.7, 0.95, 0.0, 0.35);

    /* Châssis aluminium clair */
    var frame = roundedBox(2.92, 5.92, 0.38, 0.52, matAlu);
    addLayer(frame, 0.0, 1.15, 0.28, 1.9, -0.2);

    /* Batterie */
    var battery = roundedBox(1.72, 3.24, 0.2, 0.14, matBattery);
    var battStripe = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.42), matChipDark);
    battStripe.position.set(0, 0.62, 0.11);
    battery.add(battStripe);
    battery.position.y = -0.85;
    addLayer(battery, -0.2, -1.15, 1.25, 2.6, 0.42);

    /* Carte mère et ses puces */
    var board = roundedBox(2.5, 5.3, 0.1, 0.38, matBoard);
    var chipSpots = [
      [-0.58, 1.9, 0.3, 0.3], [0.32, 1.88, 0.5, 0.34], [0.86, 1.34, 0.22, 0.22],
      [-0.7, 1.08, 0.34, 0.5], [0.2, 0.9, 0.26, 0.26], [-0.1, 2.34, 0.2, 0.14],
      [0.74, 2.28, 0.16, 0.16], [-0.56, -2.14, 0.4, 0.24], [0.46, -2.2, 0.24, 0.24],
      [0.02, -1.5, 0.5, 0.2], [-0.8, -0.4, 0.22, 0.6]
    ];
    chipSpots.forEach(function (c, i) {
      var chip = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], 0.07), i % 3 === 2 ? matChipDark : matChip);
      chip.position.set(c[0], c[1], 0.085);
      board.add(chip);
    });
    addLayer(board, -0.34, -2.0, 0.72, 4.1, -0.5);

    /* Coque arrière céramique blanche et bloc caméra */
    var back = roundedBox(2.88, 5.88, 0.16, 0.5, matCeramic);
    var camBlock = roundedBox(1.06, 1.06, 0.1, 0.2, matAlu);
    camBlock.position.set(-0.7, 2.2, -0.12);
    back.add(camBlock);
    [[-0.92, 2.42], [-0.48, 2.42], [-0.92, 1.98]].forEach(function (pt) {
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), matLens);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(pt[0], pt[1], -0.2);
      back.add(lens);
    });
    addLayer(back, -0.54, -3.1, 1.05, 5.4, 0.28);

    /* ---------- Halo lumineux derrière l'appareil ---------- */
    var haloTex = radialTexture(THREE, 256, [
      [0, "rgba(120,152,232,0.95)"],
      [0.32, "rgba(96,132,222,0.42)"],
      [0.62, "rgba(74,111,212,0.14)"],
      [1, "rgba(74,111,212,0)"]
    ]);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, opacity: 0
    }));
    halo.scale.set(16, 16, 1);
    halo.renderOrder = -1;
    scene.add(halo);

    /* ---------- Ombre de contact (plan + texture radiale sombre) ---------- */
    var shadowTex = radialTexture(THREE, 256, [
      [0, "rgba(38,46,60,0.55)"],
      [0.4, "rgba(38,46,60,0.24)"],
      [0.72, "rgba(38,46,60,0.06)"],
      [1, "rgba(38,46,60,0)"]
    ]);
    var contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.renderOrder = -2;
    scene.add(contactShadow);
    var FLOOR_Y = -4.2;

    /* ---------- Poussière fine ---------- */
    var pCount = isSmall ? 130 : 230;
    var pgeo = new THREE.BufferGeometry();
    var pts = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 34;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    var dust = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: ACCENT, size: 0.05, transparent: true, opacity: 0.4, depthWrite: false, sizeAttenuation: true
    }));
    scene.add(dust);

    /* ---------- Cadrage : demi largeur et demi hauteur visibles ---------- */
    var halfH = 1, halfW = 1, baseScale = 1, edgePush = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      isSmall = w < 760;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.75 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      halfH = Math.tan((FOV * Math.PI / 180) / 2) * CAM_Z;
      halfW = halfH * camera.aspect;
      /* Sur mobile l'appareil rapetisse et ses trajectoires se resserrent
         vers les bords, pour ne jamais stationner sous un bloc de texte. */
      baseScale = isSmall ? 0.52 : (w < 1100 ? 0.78 : 1);
      edgePush = isSmall ? 2.15 : 1;
      computeKeyframeProgress();
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    window.setTimeout(computeKeyframeProgress, 600);
    window.setTimeout(computeKeyframeProgress, 1800);

    /* ---------- Progression du scroll, amortie ---------- */
    var pTarget = 0, pCurrent = 0;
    function readScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      pTarget = max > 0 ? clamp(doc.scrollTop / max, 0, 1) : 0;
    }
    document.addEventListener("scroll", readScroll, { passive: true });
    readScroll();
    pCurrent = pTarget;

    /* ---------- Parallaxe souris ---------- */
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }

    canvas.classList.add("ready");
    document.documentElement.classList.add("scene-on");

    /* ---------- Boucle ---------- */
    var t = 0;
    var running = true;
    var rafId = 0;
    var fading = false;

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!running) {
        running = true;
        readScroll();
        loop();
      }
    });

    function loop() {
      if (!running) return;
      rafId = window.requestAnimationFrame(loop);
      t += 0.0075;

      /* Inertie de film : la progression suit le scroll avec retard. */
      pCurrent += (pTarget - pCurrent) * 0.06;
      var k = poseAt(pCurrent);

      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;

      /* Position : keyframe + micro flottement sinusoïdal + parallaxe. */
      var px = k.pos[0] * halfW * edgePush;
      var py = k.pos[1] * halfH;
      phone.position.set(
        px + Math.sin(t * 0.9) * 0.09 + mx * 0.55,
        py + Math.sin(t * 1.35) * 0.14 - my * 0.35,
        k.pos[2]
      );

      /* Rotation : keyframe + rotation continue lente sur Y.
         La rotation libre s'apaise à la fin pour que l'appareil
         se présente bien face caméra au dernier plan. */
      var settle = 1 - smoothstep((pCurrent - 0.86) / 0.14);
      phone.rotation.set(
        k.rot[0] + my * 0.24 * settle,
        k.rot[1] - t * 0.42 * settle + mx * 0.5 * settle,
        k.rot[2] + Math.sin(t * 0.55) * 0.03 * settle
      );
      phone.scale.setScalar(baseScale * k.scale);

      /* Vue éclatée : les couches s'écartent en z et dérivent en spirale. */
      var ex = k.explode;
      for (var li = 0; li < layers.length; li++) {
        var L = layers[li];
        var ang = t * 0.85 + L.phase;
        L.obj.position.z = L.base + (L.out - L.base) * ex;
        L.obj.position.x = L.x0 + Math.cos(ang) * L.r * ex;
        L.obj.position.y = L.y0 + Math.sin(ang) * L.r * 0.55 * ex;
        L.obj.rotation.x = L.tilt * 0.5 * ex;
        L.obj.rotation.y = -L.tilt * 0.4 * ex;
        L.obj.rotation.z = L.tilt * ex;
      }

      /* Écran allumé et halo. */
      matDisplay.emissiveIntensity = 0.14 + k.screen * 1.25;
      matGlass.emissiveIntensity = 0.12 + k.screen * 0.5;
      matChip.emissiveIntensity = 0.16 + ex * 0.5;

      /* L'appareil ne bascule en matériau transparent que le temps de
         son retrait au loin : pas de recompilation à chaque image. */
      /* En portrait le texte occupe toute la largeur : l'appareil s'efface
         partiellement pour rester un decor, jamais un obstacle. */
      var op = k.opacity * (isSmall ? 0.42 : 1);
      var wantFade = op < 0.995;
      if (wantFade !== fading) {
        fading = wantFade;
        for (var ti = 0; ti < phoneMats.length; ti++) {
          phoneMats[ti].transparent = wantFade;
          phoneMats[ti].needsUpdate = true;
        }
      }
      for (var mi = 0; mi < phoneMats.length; mi++) phoneMats[mi].opacity = op;

      halo.position.set(phone.position.x, phone.position.y, k.pos[2] - 2.6);
      halo.scale.setScalar(13 * baseScale * k.scale * (1 + ex * 0.35));
      halo.material.opacity = k.glow * 0.5 * op;

      /* Ombre de contact : plus l'appareil monte, plus elle s'élargit
         et s'efface ; au plus bas du tonneau elle se resserre et fonce. */
      var height = Math.max(phone.position.y - FLOOR_Y, 0.6);
      contactShadow.position.set(phone.position.x, FLOOR_Y, phone.position.z);
      contactShadow.scale.setScalar(baseScale * k.scale * (0.45 + height * 0.085));
      contactShadow.material.opacity = clamp(0.55 - height * 0.062, 0.05, 0.5) * op;

      dust.rotation.y = t * 0.03;
      dust.rotation.x = Math.sin(t * 0.2) * 0.04;
      dust.material.opacity = 0.16 + k.glow * 0.24;

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
