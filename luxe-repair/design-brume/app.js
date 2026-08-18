/* ===========================================================
   LUXE Repair, design "Brume"
   Interactions UI + scène three.js : un smartphone et un laptop
   en apesanteur dans la brume, dont les couches se séparent
   doucement au scroll avant de se rassembler.
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

  /* ============ Année du footer ============ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ Lien WhatsApp pré-rempli ============ */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aurais besoin d'une réparation à Genève.");
  }

  /* ============ Navigation : état au scroll ============ */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ Burger accessible ============ */
  var burger = $("#burger");
  var links = $("#nav-links");
  if (burger && links) {
    var setMenu = function (open) {
      links.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    burger.addEventListener("click", function () {
      setMenu(!links.classList.contains("open"));
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        setMenu(false);
        burger.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!links.classList.contains("open")) return;
      if (nav && !nav.contains(e.target)) setMenu(false);
    });
  }

  /* ============ Reveal sobre ============ */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 60) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne sticky synchronisée ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcDevice = $(".svc-device");
  var svcDeviceBox = $("#svc-device");
  var svcDeviceImg = $("#svc-device-img");
  var svcItems = $$(".svc-item");

  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var swapDevice = function (item) {
      if (!svcDeviceBox || !svcDeviceImg || !item.dataset.img || !item.dataset.device) return;
      if (svcDeviceImg.getAttribute("src") === item.dataset.img) return;
      svcDeviceBox.className = "device device-" + item.dataset.device;
      svcDeviceImg.src = item.dataset.img;
    };
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      if (svcName.textContent === item.dataset.name) return;
      if (reduceMotion || !svcCurrent) {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        swapDevice(item);
        return;
      }
      svcCurrent.classList.add("switching");
      if (svcDevice) svcDevice.classList.add("swapping");
      window.setTimeout(function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        swapDevice(item);
        svcCurrent.classList.remove("switching");
        if (svcDevice) svcDevice.classList.remove("swapping");
      }, 200);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setCurrent(e.target);
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Sliders avant / après ============ */
  $$("[data-ba]").forEach(function (fig) {
    var range = $(".ba-range", fig);
    if (!range) return;
    var apply = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });

  /* ============ Formulaire : mailto pré-rempli ============ */
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
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous directement à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D : appareils clairs en apesanteur dans la brume
     =========================================================== */
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
      return; /* pas de WebGL : le fond de brume CSS suffit */
    }
    if (!renderer || !renderer.getContext || !renderer.getContext()) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 90);
    camera.position.set(0, 0.3, 14);

    /* ----- Lumière d'aube : diffuse, froide, sans ombre dure ----- */
    scene.add(new THREE.AmbientLight(0xdde6ee, 1.5));
    var sky = new THREE.HemisphereLight(0xf3f7fa, 0xc4d0dc, 1.15);
    scene.add(sky);
    var soft = new THREE.DirectionalLight(0xeaf1f7, 0.85);
    soft.position.set(-4, 7, 8);
    scene.add(soft);
    var fill = new THREE.PointLight(0xa9c0d4, 0.55, 60);
    fill.position.set(7, -3, 6);
    scene.add(fill);

    /* ----- Matériaux clairs, mats ----- */
    var matShell = new THREE.MeshStandardMaterial({ color: 0xeef2f6, metalness: 0.18, roughness: 0.62 });
    var matShellSoft = new THREE.MeshStandardMaterial({ color: 0xe2e8ee, metalness: 0.12, roughness: 0.7 });
    var matGlass = new THREE.MeshStandardMaterial({
      color: 0xdfe9f2, metalness: 0.22, roughness: 0.28,
      emissive: 0xa8c2d8, emissiveIntensity: 0.22
    });
    var matBoard = new THREE.MeshStandardMaterial({ color: 0xd3dce5, metalness: 0.2, roughness: 0.66 });
    var matPart = new THREE.MeshStandardMaterial({ color: 0xa8bccd, metalness: 0.35, roughness: 0.5 });
    var matLens = new THREE.MeshStandardMaterial({ color: 0x8ea5b9, metalness: 0.45, roughness: 0.35 });

    /* ----- Boîte à coins arrondis ----- */
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

    /* ----- Pièces : chacune dérive vers sa position éclatée ----- */
    var parts = [];
    function addPart(group, mesh, base, expl, drift) {
      mesh.position.set(base[0], base[1], base[2]);
      parts.push({
        obj: mesh,
        base: base,
        expl: expl,
        drift: drift || 0,
        baseRotZ: mesh.rotation.z,
        phase: Math.random() * Math.PI * 2
      });
      group.add(mesh);
    }

    var fleet = new THREE.Group();
    scene.add(fleet);

    /* ----- Le smartphone ----- */
    var phone = new THREE.Group();
    phone.position.set(-2.0, 0.7, 0.6);
    phone.rotation.set(-0.16, 0.4, 0.06);
    fleet.add(phone);

    var pGlass = roundedBox(2.6, 5.4, 0.08, 0.46, matGlass);
    var pDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(2.24, 4.96),
      new THREE.MeshStandardMaterial({
        color: 0xe6eef6, metalness: 0.1, roughness: 0.4,
        emissive: 0xb9d0e2, emissiveIntensity: 0.28
      })
    );
    pDisplay.position.z = 0.05;
    pGlass.add(pDisplay);
    addPart(phone, pGlass, [0, 0, 0.26], [0.1, 0.5, 2.5], 0.09);

    var pFrame = roundedBox(2.78, 5.6, 0.32, 0.5, matShell);
    addPart(phone, pFrame, [0, 0, 0.02], [0, 0.1, 1.05], 0.05);

    var pBattery = roundedBox(1.62, 3.1, 0.18, 0.15, matPart);
    pBattery.position.y = -0.8;
    addPart(phone, pBattery, [0, -0.8, -0.18], [-0.55, -1.15, -0.2], 0.07);

    var pBoard = roundedBox(2.4, 5.05, 0.09, 0.36, matBoard);
    [[-0.58, 1.8, 0.26, 0.26], [0.28, 1.8, 0.46, 0.32], [0.8, 1.28, 0.2, 0.2],
     [-0.66, 1.04, 0.32, 0.46], [0.18, 0.84, 0.24, 0.24], [-0.52, -2.02, 0.38, 0.22],
     [0.42, -2.08, 0.22, 0.22]].forEach(function (c) {
      var chip = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], 0.06), matPart);
      chip.position.set(c[0], c[1], 0.08);
      pBoard.add(chip);
    });
    addPart(phone, pBoard, [0, 0, -0.32], [-0.15, -0.35, -1.4], 0.08);

    var pBack = roundedBox(2.72, 5.54, 0.13, 0.48, matShellSoft);
    var camBlock = roundedBox(1.0, 1.0, 0.09, 0.18, matShell);
    camBlock.position.set(-0.66, 2.05, -0.1);
    pBack.add(camBlock);
    [[-0.88, 2.26], [-0.46, 2.26], [-0.88, 1.84]].forEach(function (p) {
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 18), matLens);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.17);
      pBack.add(lens);
    });
    addPart(phone, pBack, [0, 0, -0.5], [0.2, -0.6, -2.6], 0.06);

    /* ----- Le laptop ----- */
    var laptop = new THREE.Group();
    laptop.position.set(2.5, -1.5, -1.4);
    laptop.rotation.set(0.1, -0.5, -0.05);
    laptop.scale.setScalar(0.86);
    fleet.add(laptop);

    var lLid = roundedBox(4.6, 3.05, 0.11, 0.18, matShell);
    var lScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.24, 2.68),
      new THREE.MeshStandardMaterial({
        color: 0xe4ecf4, metalness: 0.1, roughness: 0.38,
        emissive: 0xb2cadd, emissiveIntensity: 0.26
      })
    );
    lScreen.position.z = 0.062;
    lLid.add(lScreen);
    lLid.rotation.x = -0.34;
    addPart(laptop, lLid, [0, 1.5, -0.5], [0.3, 2.5, 1.7], 0.07);

    var lDeck = roundedBox(4.6, 3.2, 0.14, 0.18, matShell);
    lDeck.rotation.x = -Math.PI / 2;
    var lKeys = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 1.75),
      new THREE.MeshStandardMaterial({ color: 0xdae2ea, metalness: 0.1, roughness: 0.75 })
    );
    lKeys.position.set(0, 0.42, 0.08);
    lDeck.add(lKeys);
    var lPad = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xe7eef4, metalness: 0.1, roughness: 0.6 })
    );
    lPad.position.set(0, -0.95, 0.08);
    lDeck.add(lPad);
    addPart(laptop, lDeck, [0, -0.15, 0.9], [0, -0.4, 1.0], 0.03);

    var lBoard = roundedBox(3.9, 2.4, 0.09, 0.14, matBoard);
    lBoard.rotation.x = -Math.PI / 2;
    [[-1.1, 0.4, 0.6, 0.5], [0.2, 0.5, 0.8, 0.42], [1.15, -0.2, 0.45, 0.45],
     [-0.6, -0.6, 0.5, 0.3]].forEach(function (c) {
      var chip = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], 0.05), matPart);
      chip.position.set(c[0], c[1], 0.07);
      lBoard.add(chip);
    });
    addPart(laptop, lBoard, [0, -0.3, 0.9], [0.1, -1.35, 0.6], 0.08);

    var lBattery = roundedBox(3.4, 1.5, 0.14, 0.12, matPart);
    lBattery.rotation.x = -Math.PI / 2;
    addPart(laptop, lBattery, [0, -0.42, 0.55], [-0.4, -2.3, 0.1], 0.06);

    var lBase = roundedBox(4.6, 3.2, 0.1, 0.18, matShellSoft);
    lBase.rotation.x = -Math.PI / 2;
    addPart(laptop, lBase, [0, -0.6, 0.9], [0, -3.0, 1.1], 0.05);

    /* ----- La brume : particules fines, nombreuses et lentes ----- */
    var mistCount = window.innerWidth < 760 ? 420 : 900;
    var mgeo = new THREE.BufferGeometry();
    var mpos = new Float32Array(mistCount * 3);
    var mspeed = new Float32Array(mistCount);
    var mphase = new Float32Array(mistCount);
    var SPAN_X = 34, SPAN_Y = 22, SPAN_Z = 18;
    for (var i = 0; i < mistCount; i++) {
      mpos[i * 3] = (Math.random() - 0.5) * SPAN_X;
      mpos[i * 3 + 1] = (Math.random() - 0.5) * SPAN_Y;
      mpos[i * 3 + 2] = (Math.random() - 0.5) * SPAN_Z - 2;
      mspeed[i] = 0.004 + Math.random() * 0.010;
      mphase[i] = Math.random() * Math.PI * 2;
    }
    mgeo.setAttribute("position", new THREE.BufferAttribute(mpos, 3));
    var mist = new THREE.Points(mgeo, new THREE.PointsMaterial({
      color: 0xb6c6d4, size: 0.055, transparent: true, opacity: 0.34,
      depthWrite: false, sizeAttenuation: true
    }));
    scene.add(mist);

    /* ----- Redimensionnement ----- */
    var baseScale = 1;
    function resize() {
      var w = document.documentElement.clientWidth || window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 760 ? 0.66 : (w < 1100 ? 0.84 : 1);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Cibles pilotées par les sections visibles ----- */
    var targetX = 2.6;
    var targetOpacity = 1;
    var sections = $$("[data-scene-x]");
    if ("IntersectionObserver" in window && sections.length) {
      var secIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            targetX = parseFloat(e.target.dataset.sceneX || "0");
            targetOpacity = parseFloat(e.target.dataset.sceneO || "1");
          }
        });
      }, { rootMargin: "-38% 0px -38% 0px", threshold: 0 });
      sections.forEach(function (s) { secIO.observe(s); });
    }

    /* ----- Parallaxe très douce + progression du scroll ----- */
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      });
    }
    var scrollProgress = 0;
    function readScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      scrollProgress = max > 0 ? h.scrollTop / max : 0;
    }
    document.addEventListener("scroll", readScroll, { passive: true });
    readScroll();

    canvas.classList.add("ready");

    /* ----- Contexte WebGL perdu : on s'arrête proprement ----- */
    var running = true;
    var rafId = 0;
    function start() {
      if (!running) return;
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(loop);
    }
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      running = false;
      window.cancelAnimationFrame(rafId);
      canvas.style.opacity = "0";
    });
    canvas.addEventListener("webglcontextrestored", function () {
      running = true;
      resize();
      start();
    });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) start(); else window.cancelAnimationFrame(rafId);
    });

    /* ----- Boucle ----- */
    var t = 0;
    var explode = 0;
    var groupX = targetX;
    var canvasOpacity = 0;

    function loop() {
      if (!running) return;
      rafId = window.requestAnimationFrame(loop);
      t += 0.005;

      mx += (tmx - mx) * 0.035;
      my += (tmy - my) * 0.035;

      /* Assemblé en haut de page, séparé au milieu, rassemblé au contact. */
      var span = Math.min(Math.max((scrollProgress - 0.05) / 0.84, 0), 1);
      var targetExplode = Math.sin(span * Math.PI);
      explode += (targetExplode - explode) * 0.045;

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var e = explode;
        p.obj.position.x = p.base[0] + (p.expl[0] - p.base[0]) * e + Math.sin(t * 0.8 + p.phase) * p.drift * e;
        p.obj.position.y = p.base[1] + (p.expl[1] - p.base[1]) * e + Math.cos(t * 0.65 + p.phase) * p.drift * e;
        p.obj.position.z = p.base[2] + (p.expl[2] - p.base[2]) * e;
        p.obj.rotation.z = p.baseRotZ + Math.sin(t * 0.5 + p.phase) * 0.05 * e;
      }

      /* Apesanteur : dérive latérale selon la section, balancement sinusoïdal. */
      groupX += (targetX - groupX) * 0.035;
      fleet.position.x = groupX;
      fleet.position.y = Math.sin(t * 0.9) * 0.24;
      fleet.scale.setScalar(baseScale * (1 + explode * 0.04));
      fleet.rotation.y = Math.sin(t * 0.42) * 0.22 + mx * 0.28;
      fleet.rotation.x = Math.sin(t * 0.33) * 0.05 + my * 0.14;

      phone.position.y = 0.7 + Math.sin(t * 1.15 + 0.6) * 0.22;
      phone.rotation.z = 0.06 + Math.sin(t * 0.55) * 0.05;
      laptop.position.y = -1.5 + Math.sin(t * 0.95 + 2.1) * 0.26;
      laptop.rotation.z = -0.05 + Math.sin(t * 0.48 + 1.2) * 0.04;

      /* La brume monte lentement et respire. */
      var arr = mgeo.attributes.position.array;
      for (var m = 0; m < mistCount; m++) {
        var iy = m * 3 + 1;
        arr[iy] += mspeed[m];
        if (arr[iy] > SPAN_Y / 2) arr[iy] = -SPAN_Y / 2;
        arr[m * 3] += Math.sin(t * 0.6 + mphase[m]) * 0.0022;
      }
      mgeo.attributes.position.needsUpdate = true;
      mist.rotation.y = t * 0.012;

      canvasOpacity += (targetOpacity - canvasOpacity) * 0.045;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    start();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
