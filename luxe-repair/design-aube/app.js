/* ===========================================================
   LUXE Repair, design « Aube »
   Memes mecaniques que « Carbone » : scene three.js pilotee par le
   scroll, colonne services sticky synchronisee, sliders avant/apres,
   formulaire mailto. Lumiere et matieres, elles, sont celles du matin.
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

  /* ============ Annee du footer ============ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ Lien WhatsApp pre-rempli ============ */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aurais besoin d'une réparation à Genève.");
  }

  /* ============ Nav : etat scrolled + filet de progression ============ */
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
  function closeMenu() {
    if (!burger || !links) return;
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Ouvrir le menu");
  }
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        burger.focus();
      }
    });
  }

  /* ============ Reveal sobre au scroll ============ */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 45) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne sticky synchronisee ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcDevice = $("#svc-device");
  var svcDeviceImg = $("#svc-device-img");
  var svcItems = $$(".svc-item");

  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      if (svcDevice && svcDeviceImg && item.dataset.img && item.dataset.device) {
        svcDevice.className = "device device-" + item.dataset.device;
        if (svcDeviceImg.getAttribute("src") !== item.dataset.img) {
          svcDeviceImg.src = item.dataset.img;
        }
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
      }, 190);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Sliders avant / apres ============ */
  $$("[data-ba]").forEach(function (fig) {
    var range = $(".ba-range", fig);
    if (!range) return;
    var apply = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });

  /* ============ Formulaire : mailto pre-rempli ============ */
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
        var firstEmpty = !data.name ? $("#f-name") : $("#f-email");
        if (firstEmpty) firstEmpty.focus();
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
     Scene 3D : smartphone en vue eclatee, pilote par le scroll.
     On demonte au fil de la page, on remonte a l'approche du contact.
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
      return; /* pas de WebGL : le fond CSS « aube » reste seul */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 0.4, 13.5);

    /* ----- Lumieres : soleil rasant de 7h + fill froid discret ----- */
    scene.add(new THREE.AmbientLight(0xe8e0d4, 1.35));
    var sun = new THREE.DirectionalLight(0xf3c893, 1.85);
    sun.position.set(6, 5.5, 6);
    scene.add(sun);
    var fill = new THREE.PointLight(0x9db4c8, 0.65, 60);
    fill.position.set(-9, 4, 6);
    scene.add(fill);
    var bounce = new THREE.PointLight(0xd8a678, 0.55, 46);
    bounce.position.set(2, -5, -5);
    scene.add(bounce);

    /* ----- Matieres claires ----- */
    var matAlu = new THREE.MeshStandardMaterial({ color: 0xc6c8cb, metalness: 0.82, roughness: 0.32 });
    var matShell = new THREE.MeshStandardMaterial({ color: 0xece2d2, metalness: 0.16, roughness: 0.58 });
    var matGlass = new THREE.MeshStandardMaterial({
      color: 0xdfe4e8, metalness: 0.35, roughness: 0.14,
      transparent: true, opacity: 0.86,
      emissive: 0xb3805a, emissiveIntensity: 0.12
    });
    var matBattery = new THREE.MeshStandardMaterial({ color: 0xb8b2a6, metalness: 0.3, roughness: 0.6 });
    var matBoard = new THREE.MeshStandardMaterial({ color: 0x9a8a74, metalness: 0.35, roughness: 0.55 });
    var matChip = new THREE.MeshStandardMaterial({
      color: 0xb3805a, metalness: 0.9, roughness: 0.28,
      emissive: 0x6b4224, emissiveIntensity: 0.22
    });
    var matChipDark = new THREE.MeshStandardMaterial({ color: 0x5c554b, metalness: 0.45, roughness: 0.45 });
    var matLens = new THREE.MeshStandardMaterial({ color: 0x4a4740, metalness: 0.8, roughness: 0.22 });

    /* ----- Boite arrondie (rectangle arrondi extrude en z) ----- */
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

    /* ----- Le smartphone, couche par couche ----- */
    var phone = new THREE.Group();
    scene.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zExploded) {
      mesh.position.z = zBase;
      layers.push({ obj: mesh, base: zBase, exploded: zExploded });
      phone.add(mesh);
    }

    /* Vitre */
    var glass = roundedBox(2.75, 5.75, 0.09, 0.5, matGlass);
    var display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 5.25),
      new THREE.MeshStandardMaterial({
        color: 0x3b3742, metalness: 0.2, roughness: 0.32,
        emissive: 0xb3805a, emissiveIntensity: 0.24
      })
    );
    display.position.z = 0.055;
    glass.add(display);
    addLayer(glass, 0.28, 2.3);

    /* Chassis aluminium clair */
    var chassis = roundedBox(2.95, 5.95, 0.34, 0.55, matAlu);
    addLayer(chassis, 0.02, 1.0);

    /* Batterie */
    var battery = roundedBox(1.7, 3.3, 0.2, 0.16, matBattery);
    var battLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xd7cfc0, metalness: 0.15, roughness: 0.75 })
    );
    battLabel.position.set(0, 0.6, 0.11);
    battery.add(battLabel);
    battery.position.y = -0.85;
    addLayer(battery, -0.18, -0.15);

    /* Carte + puces cuivrees */
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

    /* Coque arriere creme + bloc camera */
    var back = roundedBox(2.9, 5.9, 0.14, 0.52, matShell);
    var camBlock = roundedBox(1.05, 1.05, 0.1, 0.2, matAlu);
    camBlock.position.set(-0.72, 2.2, -0.11);
    back.add(camBlock);
    [[-0.94, 2.42], [-0.5, 2.42], [-0.94, 1.98]].forEach(function (p) {
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), matLens);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.19);
      back.add(lens);
    });
    addLayer(back, -0.52, -2.5);

    /* ----- Poussiere doree dans le rai de lumiere ----- */
    var pCount = 210;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0xc79a6d, size: 0.05, transparent: true, opacity: 0.42, depthWrite: false
    }));
    scene.add(dust);

    /* ----- Redimensionnement ----- */
    var baseScale = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 760 ? 0.7 : 1;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Cibles pilotees par la section visible ----- */
    var targetX = 2.4;
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
      }, { passive: true });
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
    canvas.style.transition = "none"; /* l'opacite est lissee image par image */

    /* ----- Robustesse : perte de contexte WebGL ----- */
    var contextLost = false;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      contextLost = true;
      canvas.style.opacity = "0";
    });
    canvas.addEventListener("webglcontextrestored", function () {
      contextLost = false;
      resize();
      loop();
    });

    /* ----- Boucle ----- */
    var t = 0;
    var explode = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var visible = true;
    var running = false;

    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible) loop();
    });

    function loop() {
      if (!visible || contextLost) { running = false; return; }
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    function frame() {
      running = false;
      if (!visible || contextLost) return;
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Assemble en haut de page, eclate au milieu, reassemble au contact */
      var span = Math.min(Math.max((scrollProgress - 0.04) / 0.86, 0), 1);
      var targetExplode = Math.sin(span * Math.PI);
      explode += (targetExplode - explode) * 0.06;

      layers.forEach(function (l) {
        l.obj.position.z = l.base + (l.exploded - l.base) * explode;
      });

      groupX += (targetX - groupX) * 0.04;
      phone.position.x = groupX;
      phone.position.y = Math.sin(t * 1.1) * 0.18 + 0.2;
      phone.scale.setScalar(baseScale * (1 + explode * 0.06));

      phone.rotation.y = t * 0.35 + mx * 0.55;
      phone.rotation.x = -0.12 + my * 0.3 + explode * 0.18;
      phone.rotation.z = Math.sin(t * 0.5) * 0.04;

      dust.rotation.y = t * 0.025;

      canvasOpacity += (targetOpacity - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);

      loop();
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
