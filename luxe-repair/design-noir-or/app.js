/* ===========================================================
   LUXE Repair, Genève. Interactions + scène 3D "Or Noir".
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
  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ============ WhatsApp pré-rempli ============ */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aimerais un devis pour une réparation à Genève.");
  }

  /* ============ Nav : état scrolled + barre de progression ============ */
  var nav = $("#nav");
  var bar = $(".scroll-progress");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
    if (bar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      bar.style.width = (p * 100).toFixed(2) + "%";
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
      el.style.transitionDelay = (Math.min(i % 3, 2) * 80) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Tilt subtil (pointer fine uniquement) ============ */
  if (!reduceMotion && finePointer) {
    $$("[data-tilt]").forEach(function (card) {
      var strength = 6;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + (px * strength).toFixed(2) + "deg)" +
          " rotateX(" + (-py * strength).toFixed(2) + "deg) translateY(-3px)";
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
        btn.style.transform = "translate(" + (x * 0.16).toFixed(1) + "px," + (y * 0.24).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ============ Sliders avant / après ============ */
  $$("[data-ba]").forEach(function (fig) {
    var stage = $(".ba-stage", fig);
    var range = $(".ba-range", fig);
    if (!stage || !range) return;
    var apply = function (v) {
      var clamped = Math.max(0, Math.min(100, v));
      stage.style.setProperty("--pos", clamped + "%");
    };
    range.addEventListener("input", function () { apply(parseFloat(range.value)); });
    /* Glisser directement sur la vignette (en plus du clavier / range natif). */
    var dragging = false;
    var fromEvent = function (e) {
      var r = stage.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    stage.addEventListener("pointerdown", function (e) {
      dragging = true;
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
      var v = fromEvent(e);
      range.value = String(Math.round(v));
      apply(v);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var v = fromEvent(e);
      range.value = String(Math.round(v));
      apply(v);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      stage.addEventListener(ev, function () { dragging = false; });
    });
    apply(parseFloat(range.value));
  });

  /* ============ Formulaire (mailto pré-rempli) ============ */
  var form = $("#contact-form");
  var note = $("#form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.nom || !data.email) {
        if (note) {
          note.textContent = "Merci d'indiquer au moins votre nom et votre e-mail.";
          note.className = "form-note err";
        }
        return;
      }
      var np = "non précisé";
      var body =
        "Nouvelle demande de devis, LUXE Repair Genève\n\n" +
        "Nom       : " + data.nom + "\n" +
        "E-mail    : " + data.email + "\n" +
        "Téléphone : " + (data.tel || np) + "\n" +
        "Appareil  : " + (data.appareil || np) + "\n\n" +
        "Description de la panne :\n" + (data.panne || np) + "\n";
      var href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis : " + (data.appareil || "appareil") + " (" + data.nom + ")") +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous directement à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D : smartphone noir métal, composants flottants,
     particules dorées. Fallback : fond dégradé CSS.
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
    } catch (err) { return; } /* pas de WebGL : le fond CSS reste */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    camera.position.set(0, 0.2, 13);

    var world = new THREE.Group();
    scene.add(world);

    /* ----- Lumières : clé dorée + rim froid discret ----- */
    scene.add(new THREE.AmbientLight(0x4a4034, 0.55));
    var keyLight = new THREE.DirectionalLight(0xd3b577, 1.7);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);
    var rimLight = new THREE.DirectionalLight(0x6d7f9e, 0.55);
    rimLight.position.set(-7, 2, -5);
    scene.add(rimLight);
    var fillLight = new THREE.PointLight(0xd3b577, 0.7, 40);
    fillLight.position.set(-4, -3, 5);
    scene.add(fillLight);

    /* ----- Matériaux ----- */
    var blackMetal = new THREE.MeshStandardMaterial({ color: 0x141210, metalness: 0.9, roughness: 0.22 });
    var goldMetal = new THREE.MeshStandardMaterial({ color: 0xd3b577, metalness: 0.95, roughness: 0.28 });
    var anthracite = new THREE.MeshStandardMaterial({ color: 0x2a2723, metalness: 0.6, roughness: 0.45 });
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x0c0b0e, metalness: 0.4, roughness: 0.15,
      emissive: 0x342713, emissiveIntensity: 0.55
    });

    /* ----- Ancre : centre-droit (recentrée sur mobile) ----- */
    var anchor = new THREE.Group();
    world.add(anchor);

    /* ----- Smartphone ----- */
    var phone = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(2.05, 4.3, 0.18);
    phone.add(new THREE.Mesh(bodyGeo, blackMetal));
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 4.06), screenMat);
    screen.position.z = 0.095;
    phone.add(screen);
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo),
      new THREE.LineBasicMaterial({ color: 0xd3b577, transparent: true, opacity: 0.8 })
    );
    phone.add(edges);
    /* bloc caméra au dos */
    var camBlock = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.07), anthracite);
    camBlock.position.set(-0.5, 1.6, -0.12);
    phone.add(camBlock);
    [[-0.66, 1.76], [-0.34, 1.76], [-0.5, 1.44]].forEach(function (p) {
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 18), goldMetal);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(p[0], p[1], -0.17);
      phone.add(lens);
    });
    phone.rotation.set(0.1, -0.4, 0.04);
    anchor.add(phone);

    /* ----- Composants flottants : vis + puces ----- */
    var bits = new THREE.Group();
    var i, mesh;
    for (i = 0; i < 16; i++) {
      if (i % 2 === 0) {
        /* vis : cylindre doré + tête fendue */
        var srew = new THREE.Group();
        var r = 0.055 + Math.random() * 0.04;
        var headMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.8, 14), goldMetal);
        srew.add(headMesh);
        var slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.7, r * 0.5, r * 0.3), anthracite);
        slot.position.y = r * 0.45;
        srew.add(slot);
        mesh = srew;
      } else {
        /* puce : boîtier anthracite + pastille dorée */
        var chip = new THREE.Group();
        var s = 0.2 + Math.random() * 0.22;
        chip.add(new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s * 0.16), anthracite));
        var die = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.36, s * 0.06), goldMetal);
        die.position.z = s * 0.1;
        chip.add(die);
        mesh = chip;
      }
      var ang = (i / 16) * Math.PI * 2 + Math.random() * 0.6;
      var rad = 2.1 + Math.random() * 2.6;
      mesh.position.set(
        Math.cos(ang) * rad,
        (Math.random() - 0.5) * 5.4,
        Math.sin(ang) * rad * 0.55 - 0.4
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.6,
        spin: (Math.random() - 0.5) * 0.012
      };
      bits.add(mesh);
    }
    anchor.add(bits);

    /* ----- Particules dorées fines ----- */
    var COUNT = 260;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(COUNT * 3);
    for (i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 3;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var particles = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0xd3b577, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false
    }));
    scene.add(particles);

    /* ----- Resize (ancre recentrée sur écrans étroits) ----- */
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      anchor.position.x = camera.aspect < 0.85 ? 0.3 : 2.6;
      anchor.position.y = camera.aspect < 0.85 ? 0.6 : 0.1;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ----- Parallaxe souris + scroll ----- */
    var mx = 0, my = 0, tmx = 0, tmy = 0, scrollPos = 0;
    window.addEventListener("pointermove", function (e) {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    });
    document.addEventListener("scroll", function () { scrollPos = window.scrollY; }, { passive: true });

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
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      phone.rotation.y = -0.4 + t * 0.35 + mx * 0.35;
      phone.rotation.x = 0.1 + my * 0.2;
      phone.position.y = Math.sin(t * 1.1) * 0.18;

      bits.children.forEach(function (m) {
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.speed + m.userData.phase) * 0.35;
        m.rotation.x += m.userData.spin;
        m.rotation.y += m.userData.spin * 1.4;
      });
      bits.rotation.y = t * 0.12;

      particles.rotation.y = t * 0.025;

      world.rotation.y = mx * 0.12;
      world.rotation.x = my * 0.06;
      world.position.y = -scrollPos * 0.0016;

      /* Le décor 3D s'estompe une fois le hero quitté, pour laisser
         les sections lisibles (les particules restent en toile de fond). */
      var vh = window.innerHeight || 1;
      var fade = 1 - Math.min(Math.max((scrollPos - vh * 0.45) / (vh * 0.75), 0), 1);
      canvas.style.opacity = (0.22 + fade * 0.78).toFixed(3);

      camera.lookAt(anchor.position.x * 0.5, 0.1, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
