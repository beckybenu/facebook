/* ===========================================================
   LUXE Repair, Genève. Interactions + scène 3D "Blanc Suisse".
   =========================================================== */
(function () {
  "use strict";

  var CONFIG = {
    email: "contact@luxerepair.ch",
    phone: "+41 76 757 34 58"
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ============ Année du footer ============ */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ============ Nav : état "scrolled" ============ */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
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

  /* ============ Reveal au scroll (sobre) ============ */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 60) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Sliders avant / après ============ */
  $$("[data-ba]").forEach(function (ba) {
    var range = $(".ba-range", ba);
    if (!range) return;
    function set(v) {
      v = Math.max(0, Math.min(100, v));
      ba.style.setProperty("--pos", String(v));
      if (String(range.value) !== String(Math.round(v))) range.value = Math.round(v);
    }
    range.addEventListener("input", function () { set(parseFloat(range.value)); });
    set(parseFloat(range.value));
  });

  /* ============ Formulaire de contact (mailto) ============ */
  var form = $("#contact-form");
  var note = $("#form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.name || !data.email) {
        if (note) {
          note.textContent = "Merci d'indiquer au moins votre nom et votre email.";
          note.className = "form-note err";
        }
        return;
      }
      var body =
        "Nouvelle demande de devis, LUXE Repair Genève\n\n" +
        "Nom        : " + data.name + "\n" +
        "Email      : " + data.email + "\n" +
        "Téléphone  : " + (data.phone || "non renseigné") + "\n" +
        "Appareil   : " + (data.device || "non renseigné") + "\n\n" +
        "Description de la panne :\n" +
        (data.issue || "non renseignée") + "\n";
      var href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis, " + (data.device || "appareil") + ", " + data.name) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous à " + CONFIG.email + " ou appelez le " + CONFIG.phone + ".";
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D three.js : atelier en pleine lumière.
     Smartphone et laptop en céramique claire, outils de
     précision, engrenage or, particules gris perle.
     Fallback : fond CSS statique du hero (déjà en place).
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
    } catch (err) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
    camera.position.set(0, 0.4, 11);

    var group = new THREE.Group();
    scene.add(group);

    /* ----- Lumière type softbox, claire et douce ----- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d4c8, 0.95));
    var soft = new THREE.DirectionalLight(0xfff4e2, 1.15);
    soft.position.set(5, 9, 7);
    scene.add(soft);
    var fill = new THREE.DirectionalLight(0xe9edf4, 0.5);
    fill.position.set(-7, 3, 5);
    scene.add(fill);

    /* ----- Matériaux ----- */
    var ceramic = new THREE.MeshStandardMaterial({ color: 0xf0eee8, roughness: 0.45, metalness: 0.05 });
    var ceramic2 = new THREE.MeshStandardMaterial({ color: 0xe7e4dc, roughness: 0.5, metalness: 0.05 });
    var glassScreen = new THREE.MeshStandardMaterial({ color: 0xdde3ec, roughness: 0.22, metalness: 0.1 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xb08d43, roughness: 0.35, metalness: 0.85 });
    var steel = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.3, metalness: 0.9 });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x33363c, transparent: true, opacity: 0.4 });

    function withEdges(mesh) {
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
      mesh.add(edges);
      return mesh;
    }

    /* ----- Smartphone flottant ----- */
    var phone = new THREE.Group();
    phone.add(withEdges(new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.1, 0.14), ceramic)));
    var pScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 2.92), glassScreen);
    pScreen.position.z = 0.075;
    phone.add(pScreen);
    phone.position.set(5.1, 1.1, -0.2);
    phone.rotation.set(-0.12, -0.35, 0.06);
    group.add(phone);

    /* ----- Laptop entrouvert ----- */
    var laptop = new THREE.Group();
    var base = withEdges(new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 2.2), ceramic));
    laptop.add(base);
    var lid = new THREE.Group();
    var lidPanel = withEdges(new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.15, 0.09), ceramic2));
    lidPanel.position.y = 1.075;
    var lScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.06, 1.92), glassScreen);
    lScreen.position.set(0, 1.075, 0.05);
    lid.add(lidPanel);
    lid.add(lScreen);
    lid.position.z = -1.1;
    lid.rotation.x = -0.32;
    laptop.add(lid);
    laptop.position.set(2.9, -1.1, -0.8);
    laptop.rotation.set(0.16, -0.55, 0);
    group.add(laptop);

    /* ----- Engrenage fin en or ----- */
    var gear = new THREE.Group();
    gear.add(new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 14, 42), gold));
    var i;
    for (i = 0; i < 10; i++) {
      var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), gold);
      var a = (i / 10) * Math.PI * 2;
      tooth.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0);
      tooth.rotation.z = a;
      gear.add(tooth);
    }
    var axis = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 14), gold);
    axis.rotation.x = Math.PI / 2;
    gear.add(axis);
    gear.position.set(6.4, 2.7, -1.6);
    group.add(gear);

    /* ----- Tournevis de précision (abstraits) ----- */
    function screwdriver() {
      var g = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.5, 12), steel);
      g.add(shaft);
      var tip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.028, 0.16, 12), steel);
      tip.position.y = 0.83;
      g.add(tip);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 16), new THREE.MeshStandardMaterial({ color: 0x33363c, roughness: 0.5, metalness: 0.2 }));
      handle.position.y = -0.95;
      g.add(handle);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 24), gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.66;
      g.add(ring);
      return g;
    }
    var sd1 = screwdriver();
    sd1.position.set(4.1, -2.2, 0.6);
    sd1.rotation.set(0.2, 0.1, 1.05);
    group.add(sd1);
    var sd2 = screwdriver();
    sd2.position.set(6.9, 0.1, -1.2);
    sd2.rotation.set(-0.3, 0.2, -0.7);
    sd2.scale.setScalar(0.8);
    group.add(sd2);

    /* ----- Particules gris perle, quasi imperceptibles ----- */
    var pCount = 130;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(pCount * 3);
    for (i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var pmat = new THREE.PointsMaterial({ color: 0xc6c3ba, size: 0.045, transparent: true, opacity: 0.4 });
    var points = new THREE.Points(pgeo, pmat);
    scene.add(points);

    /* ----- Resize (le canvas suit le hero) ----- */
    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      /* Sur écran étroit, la composition se replie sur le bord droit
         pour ne jamais passer sous le titre. */
      var narrow = camera.aspect < 0.9;
      group.scale.setScalar(narrow ? 0.5 : 1);
      group.position.x = narrow ? 1.4 : 0;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Parallaxe souris + léger offset de scroll ----- */
    var mx = 0, my = 0, tmx = 0, tmy = 0, scrollY = 0;
    window.addEventListener("pointermove", function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5);
      tmy = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
    document.addEventListener("scroll", function () { scrollY = window.scrollY; }, { passive: true });

    canvas.classList.add("ready");

    /* ----- Boucle ----- */
    var t = 0;
    var visible = true;
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible) loop();
    });
    function loop() {
      if (!visible) return;
      requestAnimationFrame(loop);
      t += 0.005;
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;

      group.rotation.y = mx * 0.28 + Math.sin(t * 0.4) * 0.04;
      group.rotation.x = my * 0.14;
      group.position.y = -scrollY * 0.0016;

      phone.position.y = 1.1 + Math.sin(t * 1.1) * 0.16;
      phone.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.1;
      laptop.position.y = -1.1 + Math.sin(t * 0.9 + 1.4) * 0.13;
      gear.rotation.z = t * 0.5;
      gear.position.y = 2.7 + Math.sin(t * 0.8 + 0.6) * 0.1;
      sd1.rotation.z = 1.05 + Math.sin(t * 0.7) * 0.06;
      sd1.position.y = -2.2 + Math.sin(t * 1.0 + 2.1) * 0.1;
      sd2.position.y = 0.1 + Math.sin(t * 0.85 + 3.2) * 0.12;
      points.rotation.y = t * 0.02;

      camera.lookAt(0, 0.1, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
