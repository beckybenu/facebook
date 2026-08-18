/* ===========================================================
   LUXE Repair, design "Esquisse"
   Interactions du dossier technique + scène three.js :
   le smartphone part en fil de fer (diagnostic) et devient
   solide au fil du scroll (réparation, appareil reconstruit).
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
  var clamp01 = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };

  /* ============ Année du pied de page ============ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ WhatsApp pré-rempli ============ */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aurais besoin d'une réparation à Genève.");
  }

  /* ============ Navigation : état au scroll ============ */
  var nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ Menu burger accessible ============ */
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
    $$("a", links).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        burger.focus();
      }
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
      el.style.transitionDelay = (Math.min(i % 3, 2) * 50) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne sticky synchronisée ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCart = $(".svc-cart");
  var svcDevice = $("#svc-device");
  var svcImg = $("#svc-device-img");
  var fiches = $$(".fiche");

  if (fiches.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      fiches.forEach(function (el) { el.classList.toggle("current", el === item); });
      if (svcDevice && svcImg && item.dataset.img && item.dataset.device) {
        svcDevice.className = "device device-" + item.dataset.device;
        svcImg.src = item.dataset.img;
        svcImg.alt = item.dataset.alt || "";
      }
      if (svcName.textContent === item.dataset.name) return;
      if (reduceMotion || !svcCart) {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        return;
      }
      svcCart.classList.add("switching");
      window.setTimeout(function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        svcCart.classList.remove("switching");
      }, 180);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    fiches.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Planche éclatée : version compacte en petit écran ============
     Sur mobile, les lignes de rappel deviennent illisibles : on recadre le
     dessin sur les pièces et la légende passe sous le schéma, en texte. */
  var dwg = $(".dwg");
  if (dwg) {
    var compactMQ = window.matchMedia("(max-width: 860px)");
    var applyDwg = function (mq) {
      if (mq.matches) {
        dwg.classList.add("dwg--compact");
        dwg.setAttribute("viewBox", "10 20 400 560");
      } else {
        dwg.classList.remove("dwg--compact");
        dwg.setAttribute("viewBox", "0 0 780 600");
      }
    };
    applyDwg(compactMQ);
    if (compactMQ.addEventListener) compactMQ.addEventListener("change", applyDwg);
    else if (compactMQ.addListener) compactMQ.addListener(applyDwg);
  }

  /* ============ Comparateurs avant / après ============ */
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
        "Nouvelle demande, LUXE Repair Genève\n\n" +
        "Nom       : " + data.name + "\n" +
        "E-mail    : " + data.email + "\n" +
        "Téléphone : " + (data.phone || np) + "\n" +
        "Appareil  : " + (data.device || np) + "\n\n" +
        "Description de la panne :\n" + (data.issue || np) + "\n";
      window.location.href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis, " + (data.device || "appareil") + ", " + data.name) +
        "&body=" + encodeURIComponent(body);
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D : du fil de fer au solide
     =========================================================== */
  function init3D() {
    var THREE = window.THREE;
    var canvas = $("#scene");
    if (!THREE || !canvas) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance"
      });
    } catch (err) {
      return; /* pas de WebGL : la page reste complète sans la scène */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 90);
    camera.position.set(0, 0.3, 14);

    /* ----- Lumière neutre de table lumineuse ----- */
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    var key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4, 8, 7);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xe6ecf2, 0.7);
    fill.position.set(-7, -2, 5);
    scene.add(fill);

    /* ----- Matériaux clairs, opaques une fois le solide atteint ----- */
    function solidMat(color, metal, rough) {
      return new THREE.MeshStandardMaterial({
        color: color, metalness: metal, roughness: rough,
        transparent: true, opacity: 0
      });
    }
    var matGlass = solidMat(0xdfe6ee, 0.15, 0.28);
    var matFrame = solidMat(0xb4bac2, 0.55, 0.42);
    var matBattery = solidMat(0xccd3da, 0.2, 0.6);
    var matBoard = solidMat(0x46719c, 0.35, 0.55);
    var matBack = solidMat(0xe4e1da, 0.15, 0.68);
    var solidMats = [matGlass, matFrame, matBattery, matBoard, matBack];

    var lineMat = new THREE.LineBasicMaterial({
      color: 0x2b2d31, transparent: true, opacity: 0.9
    });

    /* ----- Rectangle arrondi extrudé, avec son tracé d'arêtes ----- */
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
        depth: depth, bevelEnabled: false, curveSegments: 6
      });
      geo.translate(0, 0, -depth / 2);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), lineMat));
      return mesh;
    }

    var phone = new THREE.Group();
    scene.add(phone);

    var layers = [];
    function addLayer(mesh, zBase, zExploded) {
      mesh.position.z = zBase;
      layers.push({ obj: mesh, base: zBase, exploded: zExploded });
      phone.add(mesh);
    }

    /* Vitre tactile */
    addLayer(roundedBox(2.75, 5.75, 0.08, 0.5, matGlass), 0.3, 1.6);
    /* Châssis */
    addLayer(roundedBox(2.95, 5.95, 0.34, 0.55, matFrame), 0.02, 0.6);
    /* Batterie */
    var battery = roundedBox(1.7, 3.2, 0.2, 0.16, matBattery);
    battery.position.y = -0.9;
    addLayer(battery, -0.16, -0.5);
    /* Carte mère et connecteurs */
    var board = roundedBox(2.5, 5.3, 0.08, 0.4, matBoard);
    [[-0.6, 1.9, 0.34, 0.3], [0.35, 1.9, 0.5, 0.34], [-0.7, 1.05, 0.32, 0.46],
     [0.3, 0.95, 0.28, 0.24], [-0.5, -2.1, 0.42, 0.22]].forEach(function (c) {
      var chip = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], 0.06), matFrame);
      chip.position.set(c[0], c[1], 0.07);
      chip.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(c[2], c[3], 0.06), 24), lineMat));
      board.add(chip);
    });
    addLayer(board, -0.34, -1.4);
    /* Coque arrière et bloc caméra */
    var back = roundedBox(2.9, 5.9, 0.13, 0.52, matBack);
    var camBlock = roundedBox(1.05, 1.05, 0.1, 0.2, matFrame);
    camBlock.position.set(-0.72, 2.15, -0.11);
    back.add(camBlock);
    addLayer(back, -0.52, -2.3);

    /* ----- Redimensionnement ----- */
    var baseScale = 1;
    var xFactor = 1;     /* garde le modèle dans le cadre en portrait */
    var opacityFactor = 1; /* et ne gêne jamais la lecture sur mobile */
    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      baseScale = w < 780 ? 0.62 : (w < 1100 ? 0.85 : 1);
      xFactor = Math.min(1, (w / h) / 1.5);
      opacityFactor = w < 860 ? 0.4 : 1;
    }
    resize();

    /* ----- Cibles pilotées par les sections visibles ----- */
    var targetX = 2.9;
    var targetOpacity = 1;
    var sections = $$("[data-scene-x]");
    if ("IntersectionObserver" in window && sections.length && !reduceMotion) {
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

    var scrollProgress = 0;
    function readScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      scrollProgress = max > 0 ? h.scrollTop / max : 0;
    }

    function applyState(solid, explode) {
      solidMats.forEach(function (m) { m.opacity = solid; });
      lineMat.opacity = 0.92 - 0.55 * solid;
      layers.forEach(function (l) {
        l.obj.position.z = l.base + (l.exploded - l.base) * explode;
      });
    }

    /* ----- Repli complet : modèle solide, statique, dans le hero ----- */
    if (reduceMotion) {
      canvas.classList.add("static");
      applyState(1, 0);
      phone.rotation.set(-0.16, -0.42, 0);
      var renderStatic = function () {
        resize();
        phone.position.set(targetX * xFactor, 0.2, 0);
        phone.scale.setScalar(baseScale);
        canvas.style.opacity = String(0.85 * opacityFactor + 0.15);
        camera.lookAt(0, 0.2, 0);
        renderer.render(scene, camera);
      };
      renderStatic();
      window.addEventListener("resize", renderStatic);
      return;
    }

    window.addEventListener("resize", resize);
    document.addEventListener("scroll", readScroll, { passive: true });
    readScroll();

    /* ----- Parallaxe très légère à la souris ----- */
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      });
    }

    var t = 0;
    var explode = 0;
    var solid = 0;
    var groupX = targetX;
    var canvasOpacity = 0;
    var running = true;
    var visible = true;

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      running = false;
      canvas.style.opacity = "0";
    });

    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible && running) loop();
    });

    function loop() {
      if (!visible || !running) return;
      window.requestAnimationFrame(loop);
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Diagnostic (fil de fer) vers appareil reconstruit (solide) */
      var targetSolid = clamp01((scrollProgress - 0.06) / 0.46);
      targetSolid = targetSolid * targetSolid * (3 - 2 * targetSolid);
      solid += (targetSolid - solid) * 0.07;

      /* Légère vue éclatée à mi-parcours, refermée au contact */
      var span = clamp01((scrollProgress - 0.08) / 0.72);
      explode += (Math.sin(span * Math.PI) * 0.55 - explode) * 0.06;

      applyState(solid, explode);

      groupX += (targetX * xFactor - groupX) * 0.04;
      phone.position.x = groupX;
      phone.position.y = Math.sin(t * 0.9) * 0.13 + 0.18;
      phone.scale.setScalar(baseScale * (1 + explode * 0.05));

      phone.rotation.y = -0.2 + Math.sin(t * 0.55) * 0.5 + mx * 0.4;
      phone.rotation.x = -0.14 + my * 0.22 + explode * 0.14;
      phone.rotation.z = Math.sin(t * 0.4) * 0.03;

      canvasOpacity += (targetOpacity * opacityFactor - canvasOpacity) * 0.05;
      canvas.style.opacity = canvasOpacity.toFixed(3);

      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
