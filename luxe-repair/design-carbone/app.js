/* ===========================================================
   LUXE Repair, design "Carbone"
   Interactions UI + scène three.js : smartphone en vue éclatée
   pilotée par le scroll (on démonte, on répare, on remonte).
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

  /* ============ Nav : état scrolled + barre de progression ============ */
  var nav = $("#nav");
  var progressBar = $(".scroll-progress");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
    if (progressBar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      progressBar.style.width = (p * 100).toFixed(2) + "%";
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ Burger mobile ============ */
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
  }

  /* ============ Reveal au scroll ============ */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 70) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Tilt subtil (pointer fine uniquement) ============ */
  if (!reduceMotion && finePointer) {
    $$("[data-tilt]").forEach(function (card) {
      var strength = 5;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (px * strength).toFixed(2) +
          "deg) rotateX(" + (-py * strength).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ============ Boutons magnétiques ============ */
  if (!reduceMotion && finePointer) {
    $$(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.26).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ============ Thèmes de couleur ============ */
  var THEME_ACCENTS = { ambre: 0xc9a25e, glacier: 0x8fb6d9, emeraude: 0x7cbc97, argent: 0xbfc6cf };
  var applySceneAccent = null;
  var currentTheme = "ambre";
  try {
    var savedTheme = window.localStorage.getItem("luxe-theme");
    if (savedTheme && THEME_ACCENTS[savedTheme] !== undefined) currentTheme = savedTheme;
  } catch (err) {}
  function setTheme(name) {
    currentTheme = name;
    document.documentElement.setAttribute("data-theme", name);
    try { window.localStorage.setItem("luxe-theme", name); } catch (err) {}
    $$(".theme-dot").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.setTheme === name ? "true" : "false");
    });
    if (applySceneAccent) applySceneAccent(THEME_ACCENTS[name]);
  }
  $$(".theme-dot").forEach(function (b) {
    b.addEventListener("click", function () { setTheme(b.dataset.setTheme); });
  });
  setTheme(currentTheme);

  /* ============ Services : synchronisation colonne sticky ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcItems = $$(".svc-item");
  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      var svcDevice = $("#svc-device");
      var svcDeviceImg = $("#svc-device-img");
      if (svcDevice && svcDeviceImg && item.dataset.img && item.dataset.device) {
        svcDevice.className = "device device-" + item.dataset.device;
        svcDeviceImg.src = item.dataset.img;
      }
      if (svcName.textContent === item.dataset.name) return;
      if (reduceMotion || !svcCurrent) {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        return;
      }
      svcCurrent.classList.add("switching");
      window.setTimeout(function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        svcCurrent.classList.remove("switching");
      }, 220);
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

  /* ============ Formulaire : ouverture mailto pré-rempli ============ */
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
     Scène 3D : smartphone en vue éclatée pilotée par le scroll
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
      return; /* pas de WebGL : le fond CSS reste seul */
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 0.4, 13.5);

    /* ----- Lumières : lampe d'atelier ambrée + rim froide ----- */
    scene.add(new THREE.AmbientLight(0x3a3d44, 1.1));
    var lamp = new THREE.DirectionalLight(0xd9b06c, 1.7);
    lamp.position.set(5, 8, 7);
    scene.add(lamp);
    var rim = new THREE.PointLight(0x6f8ba0, 1.1, 50);
    rim.position.set(-9, 3, 5);
    scene.add(rim);
    var warmBack = new THREE.PointLight(0xc9a25e, 0.8, 40);
    warmBack.position.set(2, -4, -6);
    scene.add(warmBack);

    /* ----- Matériaux ----- */
    var matAlu = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.85, roughness: 0.35 });
    var matCarbon = new THREE.MeshStandardMaterial({ color: 0x1c1f24, metalness: 0.6, roughness: 0.5 });
    var matGlass = new THREE.MeshStandardMaterial({
      color: 0x232830, metalness: 0.4, roughness: 0.18,
      emissive: 0x8f7440, emissiveIntensity: 0.28
    });
    var matBattery = new THREE.MeshStandardMaterial({ color: 0x2e333b, metalness: 0.3, roughness: 0.6 });
    var matBoard = new THREE.MeshStandardMaterial({ color: 0x23282e, metalness: 0.4, roughness: 0.55 });
    var matChip = new THREE.MeshStandardMaterial({
      color: 0xc9a25e, metalness: 0.9, roughness: 0.3,
      emissive: 0x5e4519, emissiveIntensity: 0.35
    });
    var matChipDark = new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.5, roughness: 0.4 });

    /* ----- Boîte arrondie (rect arrondi extrudé en z) ----- */
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
      var geo = new THREE.ExtrudeGeometry(shape, {
        depth: depth, bevelEnabled: false, curveSegments: 8
      });
      geo.translate(0, 0, -depth / 2);
      var mesh = new THREE.Mesh(geo, mat);
      return mesh;
    }

    /* ----- Le smartphone en couches ----- */
    var phone = new THREE.Group();
    scene.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zExploded) {
      mesh.position.z = zBase;
      layers.push({ obj: mesh, base: zBase, exploded: zExploded });
      phone.add(mesh);
    }

    /* Vitre écran émissive (face avant) */
    var glass = roundedBox(2.75, 5.75, 0.09, 0.5, matGlass);
    var display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 5.25),
      new THREE.MeshStandardMaterial({
        color: 0x2a2f37, metalness: 0.2, roughness: 0.3,
        emissive: 0xc9a25e, emissiveIntensity: 0.16
      })
    );
    display.position.z = 0.055;
    glass.add(display);
    addLayer(glass, 0.28, 2.3);

    /* Châssis aluminium */
    var frame = roundedBox(2.95, 5.95, 0.34, 0.55, matAlu);
    addLayer(frame, 0.02, 1.0);

    /* Batterie */
    var battery = roundedBox(1.7, 3.3, 0.2, 0.16, matBattery);
    var battLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x3c424c, metalness: 0.2, roughness: 0.7 })
    );
    battLabel.position.set(0, 0.6, 0.11);
    battery.add(battLabel);
    battery.position.y = -0.85;
    addLayer(battery, -0.18, -0.15);

    /* Carte mère + puces dorées */
    var board = roundedBox(2.55, 5.35, 0.1, 0.4, matBoard);
    var chipSpots = [
      [-0.6, 1.9, 0.28, 0.28], [0.3, 1.9, 0.5, 0.34], [0.85, 1.35, 0.22, 0.22],
      [-0.7, 1.1, 0.34, 0.5], [0.2, 0.9, 0.26, 0.26], [-0.1, 2.35, 0.2, 0.14],
      [0.75, 2.3, 0.16, 0.16], [-0.55, -2.15, 0.4, 0.24], [0.45, -2.2, 0.24, 0.24]
    ];
    chipSpots.forEach(function (c, i) {
      var chip = new THREE.Mesh(
        new THREE.BoxGeometry(c[2], c[3], 0.07),
        i % 3 === 2 ? matChipDark : matChip
      );
      chip.position.set(c[0], c[1], 0.085);
      board.add(chip);
    });
    addLayer(board, -0.34, -1.35);

    /* Coque arrière carbone + bloc caméra */
    var back = roundedBox(2.9, 5.9, 0.14, 0.52, matCarbon);
    var camBlock = roundedBox(1.05, 1.05, 0.1, 0.2, matAlu);
    camBlock.position.set(-0.72, 2.2, -0.11);
    back.add(camBlock);
    [[-0.94, 2.42], [-0.5, 2.42], [-0.94, 1.98]].forEach(function (p) {
      var lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20),
        new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.8, roughness: 0.2 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.19);
      back.add(lens);
    });
    addLayer(back, -0.52, -2.5);

    /* ----- Poussière d'atelier ----- */
    var pCount = 240;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0xc9a25e, size: 0.045, transparent: true, opacity: 0.4, depthWrite: false
    }));
    scene.add(dust);

    /* Le thème choisi reteinte la lampe, les puces, l'écran et la poussière. */
    applySceneAccent = function (hex) {
      var c = new THREE.Color(hex);
      lamp.color.copy(c).lerp(new THREE.Color(0xffffff), 0.35);
      warmBack.color.copy(c);
      matGlass.emissive.copy(c).multiplyScalar(0.7);
      matChip.color.copy(c);
      matChip.emissive.copy(c).multiplyScalar(0.45);
      display.material.emissive.copy(c);
      dust.material.color.copy(c);
    };
    applySceneAccent(THEME_ACCENTS[currentTheme]);

    /* ----- Redimensionnement ----- */
    var baseScale = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 760 ? 0.72 : 1;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Cibles pilotées par les sections visibles ----- */
    var targetX = 2.3;
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

    /* ----- Parallaxe souris + progression du scroll ----- */
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
    canvas.style.transition = "none"; /* l'opacité est lissée frame par frame ci-dessous */

    /* ----- Boucle ----- */
    var t = 0;
    var explode = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var visible = true;
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible) loop();
    });

    function loop() {
      if (!visible) return;
      window.requestAnimationFrame(loop);
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Vue éclatée : assemblé en haut, démonté au milieu,
         remonté à l'approche du contact. */
      var span = Math.min(Math.max((scrollProgress - 0.04) / 0.86, 0), 1);
      var targetExplode = Math.sin(span * Math.PI);
      explode += (targetExplode - explode) * 0.06;

      layers.forEach(function (l) {
        l.obj.position.z = l.base + (l.exploded - l.base) * explode;
      });

      /* Position latérale selon la section + respiration verticale */
      groupX += (targetX - groupX) * 0.04;
      phone.position.x = groupX;
      phone.position.y = Math.sin(t * 1.1) * 0.18 + 0.2;
      phone.scale.setScalar(baseScale * (1 + explode * 0.06));

      /* Rotation lente continue + parallaxe souris */
      phone.rotation.y = t * 0.35 + mx * 0.55;
      phone.rotation.x = -0.12 + my * 0.3 + explode * 0.18;
      phone.rotation.z = Math.sin(t * 0.5) * 0.04;

      dust.rotation.y = t * 0.025;

      /* Lisibilité : opacité du canvas selon la section */
      canvasOpacity += (targetOpacity - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
