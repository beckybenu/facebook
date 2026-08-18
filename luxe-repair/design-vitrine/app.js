/* ===========================================================
   LUXE Repair, design "Vitrine"
   Interactions de la page + scène three.js : un smartphone
   précieux en lévitation au dessus de son présentoir, qui se
   démonte et se remonte au fil du scroll.
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

  /* ============ Menu mobile accessible ============ */
  var burger = $("#burger");
  var links = $("#nav-links");
  if (burger && links) {
    var closeMenu = function () {
      links.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Ouvrir le menu");
    };
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        burger.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 780) closeMenu();
    });
  }

  /* ============ Apparition sobre au scroll ============ */
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

  /* ============ Services : plaque synchronisée à l'écrin visible ============ */
  var plaque = $(".plaque");
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcItems = $$(".svc-item");
  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var visibles = [];
    var setCurrent = function (item) {
      if (!item) return;
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      if (svcName.textContent === item.dataset.name) return;
      if (reduceMotion || !plaque) {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        return;
      }
      plaque.classList.add("switching");
      window.setTimeout(function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        plaque.classList.remove("switching");
      }, 200);
    };
    /* Parmi les écrins visibles, on retient celui dont le centre
       est le plus proche du centre de la fenêtre. */
    var pickClosest = function () {
      var mid = window.innerHeight / 2;
      var best = null, bestD = Infinity;
      visibles.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = el; }
      });
      setCurrent(best);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = visibles.indexOf(e.target);
        if (e.isIntersecting && i === -1) visibles.push(e.target);
        else if (!e.isIntersecting && i !== -1) visibles.splice(i, 1);
      });
      pickClosest();
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Comparateurs avant / après ============ */
  $$("[data-ba]").forEach(function (fig) {
    var range = $(".ba-range", fig);
    if (!range) return;
    var apply = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });

  /* ============ Formulaire : ouverture d'un e-mail pré-rempli ============ */
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
        note.textContent = "Votre messagerie s'ouvre avec la demande. Sinon, écrivez à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D : le smartphone en vitrine
     Lévitation lente, rotation continue, vue éclatée au scroll.
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
      return; /* pas de WebGL : le fond CSS de vitrine reste seul */
    }
    if (!renderer || !renderer.getContext || !renderer.getContext()) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 90);
    camera.position.set(0, 0.6, 14);

    /* ----- Éclairage de vitrine : diffus clair et spots chauds ----- */
    scene.add(new THREE.AmbientLight(0xfff6e8, 1.5));
    var spot = new THREE.DirectionalLight(0xfff3dd, 2.1);
    spot.position.set(4.5, 9, 7);
    scene.add(spot);
    var warm = new THREE.PointLight(0xe0b976, 1.5, 60);
    warm.position.set(-8, 3.5, 6);
    scene.add(warm);
    var fill = new THREE.PointLight(0xfdf6e8, 0.8, 50);
    fill.position.set(3, -5, 5);
    scene.add(fill);

    /* ----- Matériaux : boîtier clair, chants dorés, écran lumineux ----- */
    var matBody = new THREE.MeshStandardMaterial({ color: 0xf1ebdf, metalness: 0.25, roughness: 0.42 });
    var matGold = new THREE.MeshStandardMaterial({
      color: 0xd7b475, metalness: 0.38, roughness: 0.3,
      emissive: 0x6b4f1e, emissiveIntensity: 0.3
    });
    var matGlass = new THREE.MeshStandardMaterial({
      color: 0xf6efe0, metalness: 0.15, roughness: 0.1,
      emissive: 0xfbf3e2, emissiveIntensity: 0.62
    });
    var matBattery = new THREE.MeshStandardMaterial({ color: 0xe6dece, metalness: 0.2, roughness: 0.6 });
    var matBoard = new THREE.MeshStandardMaterial({ color: 0xded5c2, metalness: 0.25, roughness: 0.55 });
    var matChipDark = new THREE.MeshStandardMaterial({ color: 0x5b5145, metalness: 0.5, roughness: 0.42 });
    var matVelours = new THREE.MeshStandardMaterial({ color: 0xefe8da, metalness: 0.05, roughness: 0.95 });

    /* ----- Boîte à coins arrondis (forme extrudée en z) ----- */
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
      var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 10 });
      geo.translate(0, 0, -depth / 2);
      return new THREE.Mesh(geo, mat);
    }

    /* ----- L'objet : un smartphone en couches ----- */
    var phone = new THREE.Group();
    scene.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zExploded) {
      mesh.position.z = zBase;
      layers.push({ obj: mesh, base: zBase, exploded: zExploded });
      phone.add(mesh);
    }

    /* Vitre avant, écran doucement lumineux */
    var glass = roundedBox(2.7, 5.65, 0.08, 0.48, matGlass);
    var display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 5.15),
      new THREE.MeshStandardMaterial({
        color: 0xf2e7cf, metalness: 0.1, roughness: 0.3,
        emissive: 0xd9bd83, emissiveIntensity: 0.4
      })
    );
    display.position.z = 0.05;
    glass.add(display);
    addLayer(glass, 0.3, 2.35);

    /* Châssis, les chants dorés de l'objet */
    var frame = roundedBox(2.92, 5.9, 0.34, 0.54, matGold);
    var frameInlay = roundedBox(2.66, 5.62, 0.36, 0.46, matBody);
    frame.add(frameInlay);
    addLayer(frame, 0.02, 1.05);

    /* Batterie */
    var battery = roundedBox(1.66, 3.2, 0.2, 0.16, matBattery);
    battery.position.y = -0.85;
    addLayer(battery, -0.18, -0.2);

    /* Carte mère et ses composants dorés */
    var board = roundedBox(2.5, 5.3, 0.1, 0.38, matBoard);
    [
      [-0.6, 1.9, 0.28, 0.28], [0.3, 1.9, 0.5, 0.34], [0.85, 1.35, 0.22, 0.22],
      [-0.7, 1.1, 0.34, 0.5], [0.2, 0.9, 0.26, 0.26], [-0.1, 2.35, 0.2, 0.14],
      [0.75, 2.3, 0.16, 0.16], [-0.55, -2.15, 0.4, 0.24], [0.45, -2.2, 0.24, 0.24]
    ].forEach(function (c, i) {
      var chip = new THREE.Mesh(
        new THREE.BoxGeometry(c[2], c[3], 0.07),
        i % 3 === 2 ? matChipDark : matGold
      );
      chip.position.set(c[0], c[1], 0.085);
      board.add(chip);
    });
    addLayer(board, -0.34, -1.4);

    /* Dos clair et bloc caméra cerclé d'or */
    var back = roundedBox(2.86, 5.84, 0.14, 0.5, matBody);
    var camBlock = roundedBox(1.02, 1.02, 0.1, 0.2, matGold);
    camBlock.position.set(-0.7, 2.16, -0.11);
    back.add(camBlock);
    [[-0.92, 2.38], [-0.48, 2.38], [-0.92, 1.94]].forEach(function (p) {
      var lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.08, 20),
        new THREE.MeshStandardMaterial({ color: 0x6a5f50, metalness: 0.85, roughness: 0.18 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.19);
      back.add(lens);
    });
    addLayer(back, -0.52, -2.55);

    /* ----- Le présentoir et l'ombre portée ----- */
    var stand = new THREE.Group();
    scene.add(stand);
    var plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, 0.5, 48), matVelours);
    stand.add(plinth);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.035, 10, 60), matGold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    stand.add(ring);
    var shade = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 40),
      new THREE.MeshBasicMaterial({ color: 0x6b563a, transparent: true, opacity: 0.16, depthWrite: false })
    );
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = 0.26;
    stand.add(shade);
    stand.position.y = -3.7;

    /* ----- Éclats discrets en suspension ----- */
    var pCount = 110;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var motes = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0xa8843c, size: 0.05, transparent: true, opacity: 0.42, depthWrite: false
    }));
    scene.add(motes);

    /* ----- Dimensions ----- */
    var baseScale = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 780 ? 0.68 : (w < 1100 ? 0.85 : 1);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Cibles pilotées par la section visible ----- */
    var targetX = 2.7;
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

    /* ----- Parallaxe de pointeur et progression du scroll ----- */
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
    canvas.style.transition = "none"; /* l'opacité est lissée image par image */
    document.documentElement.classList.add("scene-ready");

    /* ----- Robustesse : perte et retour du contexte WebGL ----- */
    var running = true;
    var alive = true;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      alive = false;
      canvas.classList.remove("ready");
      document.documentElement.classList.remove("scene-ready");
    });
    canvas.addEventListener("webglcontextrestored", function () {
      alive = true;
      resize();
      canvas.classList.add("ready");
      document.documentElement.classList.add("scene-ready");
      loop();
    });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) loop();
    });

    /* ----- Boucle ----- */
    var t = 0;
    var explode = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var frameQueued = false;

    function loop() {
      if (!running || !alive || frameQueued) return;
      frameQueued = true;
      window.requestAnimationFrame(function () {
        frameQueued = false;
        step();
        loop();
      });
    }

    function step() {
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Vue éclatée : assemblé au départ, démonté au milieu du parcours,
         remonté à l'approche du contact. */
      var span = Math.min(Math.max((scrollProgress - 0.05) / 0.84, 0), 1);
      var targetExplode = Math.sin(span * Math.PI);
      explode += (targetExplode - explode) * 0.05;

      layers.forEach(function (l) {
        l.obj.position.z = l.base + (l.exploded - l.base) * explode;
      });

      /* Lévitation lente au dessus du présentoir */
      var lift = Math.sin(t * 1.05) * 0.2;
      groupX += (targetX - groupX) * 0.04;
      phone.position.x = groupX;
      phone.position.y = 0.35 + lift;
      phone.scale.setScalar(baseScale * (1 + explode * 0.05));

      /* Rotation continue, délicate comme une montre en vitrine */
      phone.rotation.y = t * 0.3 + mx * 0.4;
      phone.rotation.x = -0.1 + my * 0.22 + explode * 0.16;
      phone.rotation.z = Math.sin(t * 0.45) * 0.03;

      stand.position.x = groupX;
      stand.scale.setScalar(baseScale);
      shade.scale.setScalar(1 - lift * 0.12 - explode * 0.1);
      shade.material.opacity = 0.16 * (1 - explode * 0.5);

      motes.rotation.y = t * 0.02;

      canvasOpacity += (targetOpacity - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, -0.6, 0);
      renderer.render(scene, camera);
    }

    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
