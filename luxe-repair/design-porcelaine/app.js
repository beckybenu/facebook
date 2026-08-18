/* ===========================================================
   LUXE Repair, design "Porcelaine"
   Interactions de la galerie et scène three.js : un smartphone
   de porcelaine blanche aux arêtes dorées, qui se démonte en vue
   éclatée au fil du scroll, puis se remonte à l'approche du contact.
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

  /* ============ Année courante dans le pied de page ============ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============ Lien WhatsApp pré-rempli ============ */
  var wa = $("#whatsapp-link");
  if (wa) {
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
      encodeURIComponent("Bonjour LUXE Repair, j'aimerais faire réparer un appareil à Genève.");
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
      links.classList.remove("ouvert");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Ouvrir le menu");
    };
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("ouvert")) {
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
      el.style.transitionDelay = (Math.min(i % 3, 2) * 55) + "ms";
      io.observe(el);
    });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ Services : colonne sticky synchronisée ============ */
  var svcName = $("#svc-current-name");
  var svcNote = $("#svc-current-note");
  var svcCourant = $(".svc-courant");
  var svcItems = $$(".svc-item");
  if (svcItems.length && svcName && svcNote && "IntersectionObserver" in window) {
    var setCurrent = function (item) {
      svcItems.forEach(function (el) { el.classList.toggle("current", el === item); });
      var svcDevice = $("#svc-device");
      var svcImg = $("#svc-device-img");
      if (svcDevice && svcImg && item.dataset.img && item.dataset.device) {
        svcDevice.className = "device device-" + item.dataset.device;
        if (svcImg.getAttribute("src") !== item.dataset.img) svcImg.src = item.dataset.img;
      }
      if (svcName.textContent === item.dataset.name) return;
      if (reduceMotion || !svcCourant) {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        return;
      }
      svcCourant.classList.add("bascule");
      window.setTimeout(function () {
        svcName.textContent = item.dataset.name;
        svcNote.textContent = item.dataset.note;
        svcCourant.classList.remove("bascule");
      }, 190);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target); });
    }, { rootMargin: "-44% 0px -44% 0px", threshold: 0 });
    svcItems.forEach(function (el) { sio.observe(el); });
  }

  /* ============ Comparateurs avant et après ============ */
  $$("[data-ba]").forEach(function (fig) {
    var range = $(".ba-range", fig);
    if (!range) return;
    var apply = function () { fig.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });

  /* ============ Formulaire : ouverture d'un courriel pré-rempli ============ */
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
      var corps =
        "Nouvelle demande de devis, LUXE Repair Genève\n\n" +
        "Nom       : " + data.nom + "\n" +
        "E-mail    : " + data.email + "\n" +
        "Téléphone : " + (data.telephone || np) + "\n" +
        "Appareil  : " + (data.appareil || np) + "\n\n" +
        "Description de la panne :\n" + (data.panne || np) + "\n";
      var href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent("Demande de devis, " + (data.appareil || "appareil") + ", " + data.nom) +
        "&body=" + encodeURIComponent(corps);
      window.location.href = href;
      if (note) {
        note.textContent = "Votre messagerie s'ouvre. Sinon, écrivez-nous directement à " + CONFIG.email;
        note.className = "form-note ok";
      }
    });
  }

  /* ===========================================================
     Scène 3D : porcelaine blanche et arêtes dorées
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
      return; /* Pas de WebGL : la lumière de galerie en CSS suffit. */
    }
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.setClearAlpha) renderer.setClearAlpha(0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
    camera.position.set(0, 0.5, 14.5);

    /* ----- Lumière de galerie : verrière au-dessus, murs qui renvoient ----- */
    scene.add(new THREE.AmbientLight(0xfdfbf7, 1.35));
    scene.add(new THREE.HemisphereLight(0xfffdf8, 0xd9d3c8, 1.15));
    var verriere = new THREE.DirectionalLight(0xfff7ea, 2.1);
    verriere.position.set(-5, 9, 6);
    scene.add(verriere);
    var mur = new THREE.DirectionalLight(0xeef2f6, 0.85);
    mur.position.set(7, 1.5, 4);
    scene.add(mur);
    var contre = new THREE.DirectionalLight(0xf3e7d2, 0.5);
    contre.position.set(1, -5, -7);
    scene.add(contre);

    /* ----- Matériaux ----- */
    var porcelaine = new THREE.MeshStandardMaterial({
      color: 0xf3f0ea, metalness: 0.03, roughness: 0.92
    });
    var porcelaineOmbre = new THREE.MeshStandardMaterial({
      color: 0xe4e0d8, metalness: 0.04, roughness: 0.88
    });
    var porcelaineMate = new THREE.MeshStandardMaterial({
      color: 0xeae6de, metalness: 0.02, roughness: 0.95
    });
    var orMat = new THREE.MeshStandardMaterial({
      color: 0xb39764, metalness: 0.88, roughness: 0.34
    });
    var ecranMat = new THREE.MeshStandardMaterial({
      color: 0xf6f3ed, metalness: 0.08, roughness: 0.5,
      emissive: 0xb39764, emissiveIntensity: 0.07
    });
    var arete = new THREE.LineBasicMaterial({
      color: 0xb39764, transparent: true, opacity: 0.85
    });

    /* ----- Volume à coins arrondis, extrudé en profondeur ----- */
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

    /* Fines arêtes dorées sur les contours d'une pièce */
    function areteOr(mesh, angle) {
      var eg = new THREE.EdgesGeometry(mesh.geometry, angle || 24);
      mesh.add(new THREE.LineSegments(eg, arete));
      return mesh;
    }

    /* ----- L'objet exposé, en couches ----- */
    var piece = new THREE.Group();
    scene.add(piece);

    var couches = [];
    function addCouche(mesh, zPose, zEclate) {
      mesh.position.z = zPose;
      couches.push({ obj: mesh, pose: zPose, eclate: zEclate });
      piece.add(mesh);
    }

    /* Vitre et dalle */
    var vitre = roundedBox(2.75, 5.75, 0.08, 0.52, porcelaine);
    areteOr(vitre);
    var dalle = new THREE.Mesh(new THREE.PlaneGeometry(2.34, 5.24), ecranMat);
    dalle.position.z = 0.05;
    vitre.add(dalle);
    addCouche(vitre, 0.3, 2.5);

    /* Châssis */
    var chassis = roundedBox(2.96, 5.96, 0.34, 0.56, porcelaineMate);
    areteOr(chassis);
    addCouche(chassis, 0.02, 1.05);

    /* Batterie */
    var batterie = roundedBox(1.72, 3.3, 0.2, 0.16, porcelaineOmbre);
    areteOr(batterie);
    var bandeOr = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.09), orMat);
    bandeOr.position.set(0, 0.66, 0.101);
    batterie.add(bandeOr);
    batterie.position.y = -0.86;
    addCouche(batterie, -0.2, -0.2);

    /* Carte mère et composants dorés */
    var carte = roundedBox(2.56, 5.36, 0.1, 0.42, porcelaineOmbre);
    areteOr(carte);
    var composants = [
      [-0.6, 1.9, 0.3, 0.3], [0.3, 1.92, 0.5, 0.34], [0.86, 1.36, 0.22, 0.22],
      [-0.7, 1.1, 0.34, 0.5], [0.2, 0.9, 0.26, 0.26], [-0.1, 2.36, 0.2, 0.14],
      [0.76, 2.3, 0.16, 0.16], [-0.55, -2.14, 0.4, 0.24], [0.46, -2.2, 0.24, 0.24]
    ];
    composants.forEach(function (c, i) {
      var puce = new THREE.Mesh(
        new THREE.BoxGeometry(c[2], c[3], 0.06),
        i % 3 === 1 ? porcelaineMate : orMat
      );
      puce.position.set(c[0], c[1], 0.08);
      carte.add(puce);
    });
    addCouche(carte, -0.36, -1.5);

    /* Coque arrière et bloc caméra */
    var coque = roundedBox(2.9, 5.9, 0.14, 0.54, porcelaine);
    areteOr(coque);
    var blocCam = roundedBox(1.06, 1.06, 0.1, 0.22, porcelaineMate);
    blocCam.position.set(-0.72, 2.2, -0.11);
    areteOr(blocCam);
    coque.add(blocCam);
    [[-0.94, 2.42], [-0.5, 2.42], [-0.94, 1.98]].forEach(function (p) {
      var objectif = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 22), orMat);
      objectif.rotation.x = Math.PI / 2;
      objectif.position.set(p[0], p[1], -0.19);
      coque.add(objectif);
    });
    addCouche(coque, -0.54, -2.7);

    /* ----- Poussière gris perle, presque invisible ----- */
    var nbPoints = 170;
    var pgeo = new THREE.BufferGeometry();
    var pos = new Float32Array(nbPoints * 3);
    for (var i = 0; i < nbPoints; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var poussiere = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0xcfc9be, size: 0.035, transparent: true, opacity: 0.32, depthWrite: false
    }));
    scene.add(poussiere);

    /* ----- Dimensions ----- */
    var echelle = 1;
    function resize() {
      /* clientWidth exclut la barre de defilement : le canvas ne peut pas
         creer de debordement horizontal. */
      var w = document.documentElement.clientWidth || window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      echelle = w < 780 ? 0.68 : 1;
    }

    /* ----- Cas prefers-reduced-motion : une pièce assemblée, immobile ----- */
    if (reduceMotion) {
      var poserStatique = function () {
        resize();
        couches.forEach(function (c) { c.obj.position.z = c.pose; });
        piece.position.set(2.5, 0.2, 0);
        piece.scale.setScalar(echelle);
        piece.rotation.set(-0.1, -0.42, 0);
        camera.lookAt(0, 0.2, 0);
        renderer.render(scene, camera);
      };
      poserStatique();
      window.addEventListener("resize", poserStatique);
      canvas.style.opacity = "0.9";
      canvas.classList.add("ready");
      return;
    }

    resize();
    window.addEventListener("resize", function () {
      resize();
      cibleX = borner(cibleBrute);
    });

    /* ----- Cibles pilotées par la salle visible ----- */
    /* Demi largeur visible au plan de l'objet : la piece reste dans le cadre
       et, sur le hero centre, se tient a l'ecart du titre. */
    function demiLargeur() {
      var demiHauteur = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
      return demiHauteur * camera.aspect;
    }
    function borner(x) {
      var marge = demiLargeur() - 2.1 * echelle;
      if (marge < 0.4) marge = 0.4;
      return Math.max(-marge, Math.min(marge, x));
    }
    var cibleBrute = 5.6;
    var cibleX = borner(cibleBrute);
    var cibleOpacite = 1;
    var salles = $$("[data-scene-x]");
    if ("IntersectionObserver" in window && salles.length) {
      var salleIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            cibleBrute = parseFloat(e.target.dataset.sceneX || "0");
            cibleX = borner(cibleBrute);
            cibleOpacite = parseFloat(e.target.dataset.sceneO || "1");
          }
        });
      }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
      salles.forEach(function (s) { salleIO.observe(s); });
    }

    /* ----- Parallaxe de souris et progression du scroll ----- */
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }
    var progression = 0;
    function lireScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      progression = max > 0 ? h.scrollTop / max : 0;
    }
    document.addEventListener("scroll", lireScroll, { passive: true });
    lireScroll();

    canvas.classList.add("ready");
    canvas.style.transition = "none"; /* l'opacité est lissée image par image */

    /* ----- Boucle de rendu ----- */
    var t = 0;
    var eclate = 0;
    var posX = cibleX;
    var opacite = 0;
    var visible = true;
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible) boucle();
    });

    function boucle() {
      if (!visible) return;
      window.requestAnimationFrame(boucle);
      t += 0.006;

      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      /* Assemblée en haut de page, démontée au milieu, remontée vers le contact */
      var etendue = Math.min(Math.max((progression - 0.05) / 0.84, 0), 1);
      var cibleEclate = Math.sin(etendue * Math.PI);
      eclate += (cibleEclate - eclate) * 0.055;

      couches.forEach(function (c) {
        c.obj.position.z = c.pose + (c.eclate - c.pose) * eclate;
      });

      posX += (cibleX - posX) * 0.04;
      piece.position.x = posX;
      piece.position.y = Math.sin(t * 1.05) * 0.16 + 0.2;
      piece.scale.setScalar(echelle * (1 + eclate * 0.05));

      piece.rotation.y = t * 0.3 + mx * 0.5;
      piece.rotation.x = -0.1 + my * 0.26 + eclate * 0.16;
      piece.rotation.z = Math.sin(t * 0.46) * 0.035;

      poussiere.rotation.y = t * 0.02;

      opacite += (cibleOpacite - opacite) * 0.05;
      canvas.style.opacity = opacite.toFixed(3);

      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);
    }
    boucle();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
