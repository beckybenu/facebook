/* ===========================================================
   LUXE Repair, design "Journal"
   Interactions de page + gravure filaire three.js dans la une.
   =========================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var CONFIG = {
    email: "contact@luxerepair.ch",
    whatsapp: "41767573458",
    waText: "Bonjour LUXE Repair, j'aurais besoin d'une réparation à Genève."
  };

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = mqReduce.matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ============ Année courante ============ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ Liens WhatsApp pré-remplis ============ */
  var waHref = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(CONFIG.waText);
  $$("#whatsapp-link, #whatsapp-strip").forEach(function (a) { a.href = waHref; });

  /* ============ Masthead : filet appuyé au scroll ============ */
  var masthead = $("#masthead");
  if (masthead) {
    var onScroll = function () {
      masthead.classList.toggle("scrolled", window.scrollY > 12);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============ Menu mobile ============ */
  var burger = $("#burger");
  var menu = $("#menu");
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    burger.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        burger.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (menu.contains(e.target) || burger.contains(e.target)) return;
      setMenu(false);
    });
  }

  /* ============ Révélation au scroll, sobre ============ */
  var revealed = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Comparateurs avant / après ============ */
  $$("[data-ba]").forEach(function (stage) {
    var range = $(".ba-range", stage);
    if (!range) return;
    var apply = function () { stage.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    range.addEventListener("change", apply);
    apply();
  });

  /* ============ Formulaire : ouverture d'un message pré-rédigé ============ */
  var form = $("#contact-form");
  var note = $("#form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = String(value).trim();
      });
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
        "Demande de devis, LUXE Repair Genève\n\n" +
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
     Gravure filaire : smartphone au trait, uniquement dans la une
     =========================================================== */
  function initScene() {
    var THREE = window.THREE;
    var canvas = $("#scene");
    var figure = $("#hero-figure");
    var box = canvas ? canvas.parentNode : null;
    if (!THREE || !canvas || !figure || !box) return;
    if (reduceMotion) return; /* l'illustration SVG statique suffit */

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true
      });
    } catch (err) {
      return; /* pas de WebGL : le SVG au trait reste affiché */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    var INK = 0x3a3c42;
    var matStrong = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.9 });
    var matSoft = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.42 });
    var matFaint = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.2 });

    var phone = new THREE.Group();
    scene.add(phone);

    /* Rectangle à coins arrondis, réutilisé pour le corps et l'écran */
    function roundedShape(w, h, r) {
      var s = new THREE.Shape();
      var x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    /* Corps : volume extrudé réduit à ses arêtes */
    var bodyGeo = new THREE.ExtrudeGeometry(roundedShape(2.9, 6.0, 0.52), {
      depth: 0.36, bevelEnabled: false, curveSegments: 10
    });
    bodyGeo.translate(0, 0, -0.18);
    phone.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 14), matStrong));

    /* Écran et cadre intérieur, tracés à plat */
    function flatOutline(w, h, r, z, mat) {
      var geo = new THREE.ShapeGeometry(roundedShape(w, h, r), 10);
      geo.translate(0, 0, z);
      return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), mat);
    }
    phone.add(flatOutline(2.56, 5.62, 0.4, 0.185, matSoft));
    phone.add(flatOutline(0.92, 0.12, 0.06, 0.19, matSoft));

    /* Trame de l'écran, comme une hachure de gravure */
    var hatch = [];
    for (var i = 1; i <= 9; i++) {
      var y = -2.6 + i * 0.52;
      hatch.push(-1.2, y, 0.186, 1.2, y, 0.186);
    }
    var hatchGeo = new THREE.BufferGeometry();
    hatchGeo.setAttribute("position", new THREE.Float32BufferAttribute(hatch, 3));
    phone.add(new THREE.LineSegments(hatchGeo, matFaint));

    /* Bloc caméra au dos, avec ses objectifs */
    var camBlock = new THREE.ShapeGeometry(roundedShape(1.12, 1.12, 0.24), 8);
    camBlock.translate(-0.74, 2.28, -0.185);
    phone.add(new THREE.LineSegments(new THREE.EdgesGeometry(camBlock, 1), matSoft));

    function ring(cx, cy, r, z, mat) {
      var curve = new THREE.EllipseCurve(cx, cy, r, r, 0, Math.PI * 2, false, 0);
      var pts = curve.getPoints(36);
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.translate(0, 0, z);
      return new THREE.LineLoop(geo, mat);
    }
    phone.add(ring(-0.98, 2.52, 0.19, -0.19, matSoft));
    phone.add(ring(-0.5, 2.52, 0.19, -0.19, matSoft));
    phone.add(ring(-0.98, 2.04, 0.19, -0.19, matSoft));
    phone.add(ring(-0.5, 2.04, 0.08, -0.19, matFaint));

    /* Boutons latéraux */
    var sideGeo = new THREE.BufferGeometry();
    sideGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -1.45, 1.5, 0, -1.45, 0.7, 0,
      -1.45, 0.3, 0, -1.45, -0.5, 0,
      1.45, 1.2, 0, 1.45, 0.1, 0
    ], 3));
    phone.add(new THREE.LineSegments(sideGeo, matStrong));

    /* ----- Dimensionnement sur le conteneur, pas sur l'écran ----- */
    function resize() {
      var w = box.clientWidth;
      var h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      phone.scale.setScalar(w < 260 ? 0.86 : 1);
    }
    resize();
    window.addEventListener("resize", resize);
    if ("ResizeObserver" in window) {
      try { new ResizeObserver(resize).observe(box); } catch (err2) {}
    }

    /* ----- Parallaxe souris, très légère ----- */
    var tmx = 0, tmy = 0, mx = 0, my = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }

    /* ----- La boucle ne tourne que si la une est visible ----- */
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          onScreen = entry.isIntersecting;
          if (onScreen) frame();
        });
      }, { threshold: 0 });
      vio.observe(box);
    }
    var visible = !document.hidden;
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible && onScreen) frame();
    });

    var t = 0;
    var running = false;
    var painted = false;
    function frame() {
      if (running) return;
      running = true;
      loop();
    }
    function loop() {
      if (!visible || !onScreen) { running = false; return; }
      window.requestAnimationFrame(loop);
      t += 0.0042;

      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;

      phone.rotation.y = t * 0.55 + mx * 0.42;
      phone.rotation.x = -0.06 + my * 0.22;
      phone.position.y = Math.sin(t * 1.6) * 0.08;

      renderer.render(scene, camera);

      /* On ne remplace l'illustration SVG qu'une fois le trait réellement rendu */
      if (!painted) {
        painted = true;
        figure.classList.add("has-3d");
      }
    }
    frame();

    /* Si l'usager bascule vers un réglage sans animation, on rend la main au SVG */
    var onReduceChange = function (e) {
      if (!e.matches) return;
      onScreen = false;
      figure.classList.remove("has-3d");
    };
    if (typeof mqReduce.addEventListener === "function") {
      mqReduce.addEventListener("change", onReduceChange);
    } else if (typeof mqReduce.addListener === "function") {
      mqReduce.addListener(onReduceChange);
    }
  }

  if (document.readyState === "complete") initScene();
  else window.addEventListener("load", initScene);
})();
