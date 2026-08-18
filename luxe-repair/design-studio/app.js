/* ===========================================================
   LUXE Repair, design "Studio"
   Interactions de la page et scene three.js : un podium tournant
   sur le plateau, dont le smartphone se demonte en vue eclatee
   au fil du scroll, puis se remonte a l'approche du contact.
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
      encodeURIComponent("Bonjour LUXE Repair, j'aurais besoin d'une reparation a Geneve.");
  }

  /* ============ Navigation : etat au scroll ============ */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ Menu mobile accessible ============ */
  var burger = $("#burger");
  var links = $("#nav-links");
  if (burger && links) {
    var closeMenu = function (focusBurger) {
      links.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Ouvrir le menu");
      if (focusBurger) burger.focus();
    };
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    $$("a", links).forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (!links.classList.contains("open")) return;
      if (nav && !nav.contains(e.target)) closeMenu(false);
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
      el.style.transitionDelay = (Math.min(i % 3, 2) * 45) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne collante synchronisee ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCurrent = $(".svc-current");
  var svcDevice = $("#svc-device");
  var svcDeviceImg = $("#svc-device-img");
  var svcItems = $$(".svc-item");

  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      if (svcName.textContent === item.dataset.name) return;

      var swap = function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        if (svcDevice && svcDeviceImg && item.dataset.img && item.dataset.device) {
          svcDevice.className = "device device-" + item.dataset.device;
          svcDeviceImg.src = item.dataset.img;
        }
      };

      if (reduceMotion || !svcCurrent) { swap(); return; }
      svcCurrent.classList.add("switching");
      window.setTimeout(function () {
        swap();
        svcCurrent.classList.remove("switching");
      }, 160);
    };

    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-44% 0px -44% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Comparateurs avant / apres ============ */
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

      var np = "non precise";
      var body =
        "Nouvelle demande de reparation, LUXE Repair Geneve\n\n" +
        "Nom       : " + data.name + "\n" +
        "E-mail    : " + data.email + "\n" +
        "Telephone : " + (data.phone || np) + "\n" +
        "Appareil  : " + (data.device || np) + "\n\n" +
        "Description de la panne :\n" + (data.issue || np) + "\n";

      var href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis, " + (data.device || "appareil") + ", " + data.name) +
        "&body=" + encodeURIComponent(body);

      window.location.href = href;
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, ecrivez-nous directement a " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scene 3D : podium tournant, smartphone ceramique
     =========================================================== */
  function initScene() {
    var THREE = window.THREE;
    var canvas = $("#scene");
    if (!THREE || !canvas) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance"
      });
    } catch (err) {
      return; /* pas de WebGL : le fond CSS du studio reste seul */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
    camera.position.set(0, 1.7, 12.6);

    /* ----- Lumiere de studio : key froide, rim douce, fond transparent ----- */
    scene.add(new THREE.AmbientLight(0xe7ecf3, 1.15));
    var key = new THREE.DirectionalLight(0xe4edf8, 1.55);
    key.position.set(6, 9, 7);
    scene.add(key);
    var rim = new THREE.PointLight(0x9db6d1, 0.95, 60);
    rim.position.set(-9, 2.5, 4);
    scene.add(rim);
    var bounce = new THREE.PointLight(0xf1f3f6, 0.5, 50);
    bounce.position.set(1, -6, 6);
    scene.add(bounce);

    /* ----- Matieres : ceramique claire, aretes bleutees ----- */
    var matCeramic = new THREE.MeshStandardMaterial({ color: 0xe4e7ec, metalness: 0.1, roughness: 0.42 });
    var matEdge = new THREE.MeshStandardMaterial({ color: 0x4a6a8c, metalness: 0.55, roughness: 0.34 });
    var matScreen = new THREE.MeshStandardMaterial({
      color: 0x35506f, metalness: 0.3, roughness: 0.2,
      emissive: 0x3f5c7a, emissiveIntensity: 0.4
    });
    var matInner = new THREE.MeshStandardMaterial({ color: 0xd3d8de, metalness: 0.18, roughness: 0.62 });
    var matBoard = new THREE.MeshStandardMaterial({ color: 0xc3ccd6, metalness: 0.25, roughness: 0.55 });
    var matChip = new THREE.MeshStandardMaterial({ color: 0x3f5c7a, metalness: 0.6, roughness: 0.38 });
    var matPodium = new THREE.MeshStandardMaterial({ color: 0xeceef1, metalness: 0.05, roughness: 0.6 });

    /* ----- Rectangle arrondi extrude ----- */
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

    /* ----- Le plateau tournant ----- */
    var stage = new THREE.Group();
    scene.add(stage);

    var podium = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.25, 0.46, 56), matPodium);
    podium.position.y = -2.78;
    stage.add(podium);

    var podiumEdge = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.026, 10, 72), matEdge);
    podiumEdge.rotation.x = Math.PI / 2;
    podiumEdge.position.y = -2.55;
    stage.add(podiumEdge);

    /* Ombre portee courte, sous le podium */
    var shadowMesh = null;
    if (typeof document.createElement("canvas").getContext === "function") {
      var sc = document.createElement("canvas");
      sc.width = 128; sc.height = 128;
      var ctx = sc.getContext("2d");
      if (ctx) {
        var grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
        grad.addColorStop(0, "rgba(32,34,39,0.42)");
        grad.addColorStop(0.55, "rgba(32,34,39,0.16)");
        grad.addColorStop(1, "rgba(32,34,39,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        var tex = new THREE.CanvasTexture(sc);
        shadowMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(8.2, 8.2),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false })
        );
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = -3.02;
        shadowMesh.scale.set(1, 0.62, 1);
        scene.add(shadowMesh);
      }
    }

    /* ----- Le smartphone en couches ----- */
    var phone = new THREE.Group();
    phone.scale.setScalar(0.78);
    stage.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zExploded) {
      mesh.position.z = zBase;
      layers.push({ obj: mesh, base: zBase, exploded: zExploded });
      phone.add(mesh);
    }

    /* Vitre et dalle */
    var glass = roundedBox(2.78, 5.7, 0.09, 0.5, matCeramic);
    var display = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 5.3), matScreen);
    display.position.z = 0.056;
    glass.add(display);
    addLayer(glass, 0.3, 2.35);

    /* Chassis, aretes bleutees */
    var frame = roundedBox(2.96, 5.9, 0.34, 0.55, matEdge);
    var frameInlay = roundedBox(2.62, 5.56, 0.36, 0.44, matCeramic);
    frame.add(frameInlay);
    addLayer(frame, 0.02, 0.95);

    /* Batterie */
    var battery = roundedBox(1.72, 3.2, 0.2, 0.16, matInner);
    var battStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.44), matEdge);
    battStrip.position.set(0, 0.55, 0.105);
    battery.add(battStrip);
    battery.position.y = -0.8;
    addLayer(battery, -0.18, -0.2);

    /* Carte mere */
    var board = roundedBox(2.5, 5.3, 0.1, 0.4, matBoard);
    var chipSpots = [
      [-0.6, 1.9, 0.3, 0.3], [0.3, 1.88, 0.5, 0.34], [0.86, 1.34, 0.22, 0.22],
      [-0.7, 1.08, 0.34, 0.5], [0.2, 0.9, 0.26, 0.26], [-0.1, 2.34, 0.2, 0.14],
      [0.74, 2.3, 0.16, 0.16], [-0.55, -2.1, 0.4, 0.24], [0.45, -2.16, 0.24, 0.24]
    ];
    chipSpots.forEach(function (c) {
      var chip = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], 0.07), matChip);
      chip.position.set(c[0], c[1], 0.085);
      board.add(chip);
    });
    addLayer(board, -0.34, -1.35);

    /* Coque arriere et bloc camera */
    var back = roundedBox(2.9, 5.84, 0.14, 0.52, matCeramic);
    var camBlock = roundedBox(1.05, 1.05, 0.1, 0.2, matEdge);
    camBlock.position.set(-0.72, 2.16, -0.11);
    back.add(camBlock);
    [[-0.94, 2.38], [-0.5, 2.38], [-0.94, 1.94]].forEach(function (p) {
      var lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.08, 18),
        new THREE.MeshStandardMaterial({ color: 0x2f4761, metalness: 0.7, roughness: 0.24 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.19);
      back.add(lens);
    });
    addLayer(back, -0.52, -2.45);

    /* ----- Redimensionnement -----
       xClamp garde le podium dans le cadre sur les ecrans etroits,
       opacityScale l'efface derriere le texte sur mobile. */
    var baseScale = 1, xClamp = 5, opacityScale = 1;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 780 ? 0.66 : (w < 1100 ? 0.84 : 1);
      opacityScale = w < 780 ? 0.3 : 1;
      var halfWidth = Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect;
      xClamp = Math.max(0, halfWidth - 2.5 * baseScale);
    }
    function clampX(x) { return Math.max(-xClamp, Math.min(xClamp, x)); }
    resize();

    /* ----- Cibles pilotees par les sections visibles ----- */
    var sections = $$("[data-scene-x]");
    var first = sections[0];
    var targetX = first ? parseFloat(first.dataset.sceneX || "0") : 3.6;
    var targetOpacity = first ? parseFloat(first.dataset.sceneO || "1") : 1;

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

    /* ----- Rendu statique si l'utilisateur limite les animations ----- */
    function placeStage(x, spin) {
      stage.position.x = x;
      stage.position.y = 0.4;
      stage.rotation.y = spin;
      if (shadowMesh) shadowMesh.position.x = x;
      stage.scale.setScalar(baseScale);
      if (shadowMesh) shadowMesh.scale.set(baseScale, baseScale * 0.62, baseScale);
      camera.lookAt(0, -0.15, 0);
    }

    if (reduceMotion) {
      placeStage(clampX(targetX), -0.5);
      canvas.classList.add("ready", "scene-static");
      renderer.render(scene, camera);
      window.addEventListener("resize", function () {
        resize();
        placeStage(clampX(targetX), -0.5);
        renderer.render(scene, camera);
      });
      return;
    }

    window.addEventListener("resize", resize);

    /* ----- Parallaxe pointeur et progression du scroll ----- */
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

    /* ----- Boucle ----- */
    var t = 0;
    var explode = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var running = true;
    var lost = false;

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      lost = true;
    });
    canvas.addEventListener("webglcontextrestored", function () {
      lost = false;
      resize();
      loop();
    });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) loop();
    });

    var queued = false;
    function loop() {
      if (!running || lost || queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        if (!running || lost) return;
        step();
        loop();
      });
    }

    function step() {
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Assemble en haut de page, demonte a mi-parcours,
         remonte a l'approche du contact. */
      var span = Math.min(Math.max((scrollProgress - 0.05) / 0.84, 0), 1);
      var targetExplode = Math.sin(span * Math.PI);
      explode += (targetExplode - explode) * 0.06;

      layers.forEach(function (l) {
        l.obj.position.z = l.base + (l.exploded - l.base) * explode;
      });

      groupX += (clampX(targetX) - groupX) * 0.045;
      stage.position.x = groupX;
      stage.position.y = 0.4 + Math.sin(t * 1.05) * 0.1;
      stage.scale.setScalar(baseScale);
      stage.rotation.y = t * 0.34 + mx * 0.4;
      stage.rotation.x = -0.04 + my * 0.08;

      /* Le podium reste d'aplomb, seule sa rotation suit le plateau */
      podium.rotation.x = 0.04 - my * 0.08;
      podiumEdge.rotation.x = Math.PI / 2 + 0.04 - my * 0.08;

      phone.rotation.x = explode * 0.16;
      phone.position.y = explode * 0.22;
      phone.scale.setScalar(0.78 * (1 + explode * 0.05));

      if (shadowMesh) {
        shadowMesh.position.x = groupX;
        shadowMesh.position.z = 0;
        shadowMesh.scale.set(baseScale, baseScale * 0.62, baseScale);
        shadowMesh.material.opacity = 0.75 - explode * 0.2;
      }

      canvasOpacity += (targetOpacity * opacityScale - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, -0.15, 0);
      renderer.render(scene, camera);
    }

    loop();
  }

  if (document.readyState === "complete") initScene();
  else window.addEventListener("load", initScene);
})();
