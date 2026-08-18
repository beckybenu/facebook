/* ===========================================================
   LUXE Repair, design "Helvetia"
   Interactions UI + scène three.js : une composition de blocs
   géométriques qui s'assemblent en téléphone au fil du scroll.
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

  /* ============ Nav : filet visible dès le premier défilement ============ */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ Burger accessible ============ */
  var burger = $("#burger");
  var links = $("#nav-links");
  function closeMenu() {
    if (!links || !burger) return;
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

  /* ============ Reveal sobre ============ */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 55) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne sticky synchronisée ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcItems = $$(".svc-row");
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
      }, 170);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
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
        var missing = !data.name ? $("#f-name") : $("#f-email");
        if (missing) missing.focus();
        return;
      }
      var np = "non précisé";
      var body =
        "Nouvelle demande, LUXE Repair Genève\n\n" +
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
     Scène 3D : construction géométrique
     Des blocs dispersés comme une composition d'affiche
     se rassemblent en téléphone au fil du scroll.
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
      return; /* pas de WebGL : la composition statique reste affichée */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var INK = 0x1a1b1e, PAPER = 0xf1f1ee, RED = 0xb23a35;

    var scene = new THREE.Scene();
    var frustum = 9;
    var camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, -60, 60);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.86));
    var key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(-4, 7, 10);
    scene.add(key);

    var matInk = new THREE.MeshLambertMaterial({ color: INK });
    var matPaper = new THREE.MeshLambertMaterial({ color: PAPER });
    var matRed = new THREE.MeshLambertMaterial({ color: RED });
    var matEdge = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.55 });

    var group = new THREE.Group();
    scene.add(group);

    var blocks = [];

    /* Un bloc : géométrie nette, position assemblée et position dispersée. */
    function addBlock(w, h, d, mat, to, from, edged) {
      var geo = new THREE.BoxGeometry(w, h, d);
      var mesh = new THREE.Mesh(geo, mat);
      if (edged) {
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), matEdge));
      }
      mesh.position.set(from[0], from[1], from[2]);
      mesh.rotation.z = from[3] || 0;
      group.add(mesh);
      blocks.push({
        obj: mesh,
        to: { x: to[0], y: to[1], z: to[2], rz: to[3] || 0 },
        from: { x: from[0], y: from[1], z: from[2], rz: from[3] || 0 }
      });
      return mesh;
    }

    /* Plan de fond, papier cerné : la surface de l'affiche */
    addBlock(4.4, 7.6, 0.06, matPaper, [0.1, -0.1, -0.6, 0], [-2.4, -6.2, -2.4, 0.34], true);
    /* Corps du téléphone (encre) */
    addBlock(3.1, 6.2, 0.3, matInk, [0, 0, 0, 0], [-2.6, 6.4, -1.2, 0.42], false);
    /* Bloc caméra à l'arrière */
    addBlock(1.0, 1.0, 0.24, matInk, [-0.85, 2.05, -0.24, 0], [2.6, 6.2, -1.6, 0.24], true);
    /* Dalle d'écran (papier, cerné d'un filet) */
    addBlock(2.55, 4.7, 0.12, matPaper, [0, 0.42, 0.22, 0], [3.5, -3.4, 1.4, -0.3], true);
    /* Barre haute (encre) posée sur la dalle */
    addBlock(1.05, 0.2, 0.1, matInk, [0, 2.42, 0.3, 0], [-3.4, 2.4, 1.6, -0.72], false);
    /* Tranche latérale */
    addBlock(0.14, 1.1, 0.24, matInk, [1.62, 1.1, 0, 0], [3.9, 3.6, -0.8, -0.5], false);
    /* Repère papier sous l'écran */
    addBlock(0.62, 0.32, 0.14, matPaper, [0.72, -2.45, 0.25, 0], [3.0, 5.4, 1.1, 0.62], true);
    /* Barre rouge : le signal, dernière pièce posée */
    addBlock(1.15, 0.32, 0.14, matRed, [-0.6, -2.45, 0.25, 0], [-3.6, -5.4, 1.8, 0.9], false);

    /* ----- Redimensionnement ----- */
    var baseScale = 1;
    var opacityFactor = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      var aspect = w / h;
      camera.left = -frustum * aspect;
      camera.right = frustum * aspect;
      camera.top = frustum;
      camera.bottom = -frustum;
      camera.updateProjectionMatrix();
      baseScale = w < 820 ? 0.6 : (w < 1280 ? 0.85 : 1);
      /* Sur petit écran, la composition passe en filigrane derrière le texte. */
      opacityFactor = w < 820 ? 0.4 : 1;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Cibles pilotées par les sections visibles ----- */
    var targetX = 6.4;
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
      }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
      sections.forEach(function (s) { secIO.observe(s); });
    }

    /* ----- Progression du scroll et parallaxe discrète ----- */
    var scrollProgress = 0;
    function readScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      scrollProgress = max > 0 ? h.scrollTop / max : 0;
    }
    document.addEventListener("scroll", readScroll, { passive: true });
    readScroll();

    var tmx = 0, tmy = 0, mx = 0, my = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      });
    }

    /* ----- Contexte WebGL perdu : on revient à la composition statique ----- */
    var running = true;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      running = false;
      document.documentElement.classList.remove("scene-3d");
      canvas.style.opacity = "0";
    });

    document.documentElement.classList.add("scene-3d");

    var clamp01 = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };
    var easeOut = function (v) { return 1 - Math.pow(1 - v, 3); };

    var assemble = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var visible = true;
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible && running) loop();
    });

    var t = 0;
    function loop() {
      if (!visible || !running) return;
      window.requestAnimationFrame(loop);
      t += 0.005;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Dispersés au héros, assemblés vers le milieu, complets au contact. */
      var target = clamp01((scrollProgress - 0.06) / 0.52);
      assemble += (target - assemble) * 0.07;

      blocks.forEach(function (b, i) {
        var stagger = i * 0.055;
        var local = easeOut(clamp01((assemble - stagger) / (1 - stagger)));
        b.obj.position.x = b.from.x + (b.to.x - b.from.x) * local;
        b.obj.position.y = b.from.y + (b.to.y - b.from.y) * local;
        b.obj.position.z = b.from.z + (b.to.z - b.from.z) * local;
        b.obj.rotation.z = b.from.rz + (b.to.rz - b.from.rz) * local;
      });

      /* data-scene-x se lit en dixièmes de demi-largeur : la composition
         garde la même place relative quelle que soit la fenêtre. */
      groupX += (targetX - groupX) * 0.045;
      group.position.x = (groupX / 10) * camera.right;
      group.position.y = Math.sin(t * 0.9) * 0.12;
      group.scale.setScalar(baseScale);

      /* Rotation minimale : la composition reste frontale. */
      group.rotation.y = mx * 0.14 + (1 - assemble) * 0.12;
      group.rotation.x = my * 0.08;

      canvasOpacity += (targetOpacity * opacityFactor - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
