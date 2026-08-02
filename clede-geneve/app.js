/* ===========================================================
   Clé de Genève — interactions + scène 3D
   =========================================================== */
(function () {
  "use strict";

  /* ============ CONFIG (à personnaliser) ============ */
  const CONFIG = {
    email: "contact@clede-geneve.ch",      // ← remplacer par votre e-mail
    whatsapp: "41225010000",               // ← numéro WhatsApp (format international sans +)
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ============ Préloader ============ */
  window.addEventListener("load", () => {
    setTimeout(() => $("#preloader")?.classList.add("done"), 450);
  });

  /* ============ Année footer ============ */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* ============ Liens contact dynamiques ============ */
  const wa = $("#whatsapp-link");
  if (wa) wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
    encodeURIComponent("Bonjour Clé de Genève, je cherche un appartement à Genève.");

  /* ============ Nav : scrolled + burger ============ */
  const nav = $("#nav");
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 24);
    // barre de progression
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    const bar = $(".scroll-progress");
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $("#burger");
  const links = $(".nav-links");
  burger?.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".nav-links a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));

  /* ============ Sélecteur de thèmes de couleur ============ */
  const THEME_NAMES = {
    or: "Or & Émeraude", saphir: "Saphir", rubis: "Rubis",
    amethyste: "Améthyste", emeraude: "Émeraude", platine: "Platine",
    leman: "Léman", couchant: "Couchant", cuivre: "Cuivre"
  };
  const dock = $("#theme-dock");
  const themeToggle = $("#theme-toggle");
  const swName = $("#sw-name");
  const readTheme = () => { try { return localStorage.getItem("cdg-theme"); } catch (e) { return null; } };

  function setTheme(t) {
    if (!THEME_NAMES[t]) t = "or";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("cdg-theme", t); } catch (e) {}
    $$(".sw").forEach(s => s.classList.toggle("active", s.dataset.set === t));
    if (swName) swName.textContent = THEME_NAMES[t];
    window.dispatchEvent(new CustomEvent("cdg:theme"));
  }
  themeToggle?.addEventListener("click", () => {
    const open = dock.classList.toggle("open");
    themeToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".sw").forEach(s => s.addEventListener("click", () => setTheme(s.dataset.set)));
  document.addEventListener("click", (e) => {
    if (dock && !dock.contains(e.target)) { dock.classList.remove("open"); themeToggle?.setAttribute("aria-expanded", "false"); }
  });
  setTheme(readTheme() || "or"); // applique le thème enregistré (défaut : Or & Émeraude)

  /* ============ Reveal on scroll ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal]").forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i % 3, 2) * 90) + "ms";
    io.observe(el);
  });

  /* ============ Compteurs animés ============ */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const runCount = (el) => {
    if (el.dataset.static) { el.textContent = el.dataset.static; return; }
    const to = parseFloat(el.dataset.to || "0");
    const suffix = el.dataset.suffix || "";
    const dur = 1500;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(easeOut(t) * to) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$(".count").forEach(el => cio.observe(el));

  /* ============ Tilt 3D sur les cartes ============ */
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    $$("[data-tilt]").forEach(card => {
      const strength = 8;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ============ Boutons magnétiques ============ */
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach(btn => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ============ Formulaire (mailto) ============ */
  const form = $("#contact-form");
  const note = $("#form-note");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.email) {
      note.textContent = "Merci d'indiquer au moins votre nom et votre e-mail.";
      note.className = "form-note err";
      return;
    }
    const body =
`Nouvelle demande de recherche d'appartement à Genève

Nom       : ${data.name}
E-mail    : ${data.email}
Téléphone : ${data.phone || "—"}
Type      : ${data.rooms || "—"}
Budget    : ${data.budget || "—"} CHF/mois
Quartiers : ${data.zone || "—"}

Précisions :
${data.message || "—"}
`;
    const href = "mailto:" + CONFIG.email +
      "?subject=" + encodeURIComponent("Recherche appartement Genève — " + data.name) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    note.textContent = "Votre messagerie s'ouvre… Sinon, écrivez-nous à " + CONFIG.email;
    note.className = "form-note ok";
  });

  /* ============ Scène 3D (three.js) ============ */
  function init3D() {
    const THREE = window.THREE;
    const canvas = $("#scene");
    if (!THREE || !canvas || reduceMotion) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (err) { return; } // pas de WebGL → on garde le fond dégradé
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.024); // brume de profondeur
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 1.5, 16);

    // ----- Texture générée (halo lumineux) -----
    function glowTexture() {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,255,255,.9)");
      grd.addColorStop(0.35, "rgba(255,255,255,.28)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const group = new THREE.Group();
    scene.add(group);

    // ----- Lumières -----
    scene.add(new THREE.AmbientLight(0x8899cc, 0.6));
    const key = new THREE.DirectionalLight(0xf4d79b, 1.5);
    key.position.set(6, 10, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x4fd1c5, 2.2, 60);
    rim.position.set(-10, 4, 6);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xe8c07d, 1.6, 60);
    rim2.position.set(10, -2, 8);
    scene.add(rim2);

    // ----- Matériau or (clé) -----
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8c07d, metalness: .9, roughness: .28 });

    // ----- Lac Léman : plan d'eau ondulant et réfléchissant -----
    const WATER_Y = -4.5;
    const wgeo = new THREE.PlaneGeometry(170, 100, 96, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0d1626, metalness: .92, roughness: .18,
      emissive: 0x0a1420, emissiveIntensity: .55
    });
    const water = new THREE.Mesh(wgeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_Y;
    water.position.z = -8;
    group.add(water);
    const wpos = wgeo.attributes.position;           // vagues animées en boucle
    const wBase = new Float32Array(wpos.array);

    // ----- Montagnes au loin (Salève, Jura) fondues dans la brume -----
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x101a2e, metalness: .1, roughness: .95, flatShading: true,
      emissive: 0x0a1220, emissiveIntensity: .4
    });
    const mountains = new THREE.Group();
    const M = [
      { x: -26, z: -34, r: 16, h: 6.5 }, { x: -8, z: -38, r: 14, h: 5 },
      { x: 10, z: -36, r: 15, h: 7 },    { x: 27, z: -33, r: 13, h: 5.5 },
      { x: 40, z: -38, r: 17, h: 6 },    { x: -42, z: -37, r: 18, h: 5.8 },
    ];
    M.forEach((m) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(m.r, m.h, 7), mountainMat.clone());
      cone.position.set(m.x, WATER_Y + m.h / 2 - 0.4, m.z);
      cone.scale.z = 0.55;
      cone.rotation.y = Math.random() * Math.PI;
      mountains.add(cone);
    });
    group.add(mountains);

    // ----- Clé centrale flottante -----
    const keyGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3, 20), gold);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.x = 0.6;
    keyGroup.add(shaft);
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.22, 20, 40), gold);
    head.position.x = -1.4;
    keyGroup.add(head);
    // dents de la clé
    [0.9, 1.4, 1.9].forEach((x, i) => {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5 + i * 0.12, 0.34), gold);
      tooth.position.set(x, -0.32 - i * 0.03, 0);
      keyGroup.add(tooth);
    });
    // halo doré + lumière propre à la clé
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture(), color: 0xe8c07d, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const keyGlow = new THREE.Sprite(glowMat);
    keyGlow.scale.set(8.5, 8.5, 1);
    keyGlow.position.set(0.2, 0, -0.6);
    keyGroup.add(keyGlow);
    const keyLight = new THREE.PointLight(0xe8c07d, 1.4, 14);
    keyLight.position.set(0, 0.5, 1.5);
    keyGroup.add(keyLight);

    keyGroup.position.set(-1, 2.6, 4);
    keyGroup.scale.setScalar(1.15);
    group.add(keyGroup);

    // ----- Particules (poussière lumineuse) -----
    const pCount = 320;
    const pgeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pmat = new THREE.PointsMaterial({ color: 0xe8c07d, size: 0.06, transparent: true, opacity: 0.55 });
    const points = new THREE.Points(pgeo, pmat);
    scene.add(points);

    // ----- Lucioles (grosses particules lumineuses, fondu additif) -----
    const fCount = 70;
    const fgeo = new THREE.BufferGeometry();
    const fpos = new Float32Array(fCount * 3);
    for (let i = 0; i < fCount; i++) {
      fpos[i * 3] = (Math.random() - 0.5) * 34;
      fpos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      fpos[i * 3 + 2] = (Math.random() - 0.5) * 26 - 2;
    }
    fgeo.setAttribute("position", new THREE.BufferAttribute(fpos, 3));
    const fmat = new THREE.PointsMaterial({
      map: glowTexture(), color: 0xf4d79b, size: 0.55, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const fireflies = new THREE.Points(fgeo, fmat);
    scene.add(fireflies);

    // ----- Jet d'eau de Genève (gerbe de particules balistiques) -----
    const JET = { count: 560, base: new THREE.Vector3(8.5, -4.5, -7), g: 5.2 };
    const jgeo = new THREE.BufferGeometry();
    const jpos = new Float32Array(JET.count * 3);
    const jAge = new Float32Array(JET.count);
    const jLife = new Float32Array(JET.count);
    const jVel = [];
    for (let i = 0; i < JET.count; i++) {
      jAge[i] = Math.random() * 3.0;                 // départs étalés dans le temps
      jLife[i] = 2.4 + Math.random() * 0.9;
      jVel.push(new THREE.Vector3(
        0.35 + Math.random() * 0.3,                  // légère inclinaison, comme le vrai
        10.2 + Math.random() * 1.8,
        (Math.random() - 0.5) * 0.35
      ));
    }
    jgeo.setAttribute("position", new THREE.BufferAttribute(jpos, 3));
    const jetMat = new THREE.PointsMaterial({
      map: glowTexture(), color: 0xdff2ff, size: 0.34, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const jet = new THREE.Points(jgeo, jetMat);
    group.add(jet); // suit la parallaxe de la scène

    // ronds dans l'eau à la base du jet
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const rGeo = new THREE.RingGeometry(0.85, 1.0, 48);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xdff2ff, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(JET.base.x + 0.6, WATER_Y + 0.03, JET.base.z);
      ring.userData.phase = i / 3;
      ripples.push(ring);
      group.add(ring);
    }

    // ----- Couleurs de la scène pilotées par le thème CSS -----
    const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#ffffff";
    function applySceneTheme() {
      const cWarm = new THREE.Color(cssVar("--gold"));
      const cWarm2 = new THREE.Color(cssVar("--gold-2"));
      const cCool = new THREE.Color(cssVar("--teal"));
      const cBg = new THREE.Color(cssVar("--bg"));
      // brume assortie au fond
      scene.fog.color.copy(cBg);
      // lumières
      key.color.copy(cWarm2);
      rim.color.copy(cCool);
      rim2.color.copy(cWarm);
      keyLight.color.copy(cWarm);
      // matériaux « or » (clé + accents), halo et particules
      gold.color.copy(cWarm);
      glowMat.color.copy(cWarm);
      pmat.color.copy(cWarm);
      fmat.color.copy(cWarm2);
      const cEau = cCool.clone().lerp(new THREE.Color(0xffffff), 0.55); // eau claire teintée
      jetMat.color.copy(cEau);
      ripples.forEach((r) => r.material.color.copy(cEau));
      // lac : miroir sombre teinté de l'accent froid
      waterMat.color.copy(cBg.clone().lerp(cCool, 0.14));
      waterMat.emissive.copy(cBg.clone().lerp(cCool, 0.08));
      // montagnes : silhouettes à peine plus claires que le fond
      mountains.children.forEach((m) => {
        m.material.color.copy(cBg.clone().lerp(cCool, 0.10).multiplyScalar(1.5));
        m.material.emissive.copy(cBg.clone().multiplyScalar(1.2));
      });
    }
    applySceneTheme();
    window.addEventListener("cdg:theme", applySceneTheme);

    // ----- Resize -----
    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ----- Parallaxe souris + scroll -----
    let mx = 0, my = 0, tmx = 0, tmy = 0, scrollY = 0;
    window.addEventListener("pointermove", (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5);
      tmy = (e.clientY / window.innerHeight - 0.5);
    });
    document.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

    canvas.classList.add("ready");

    // ----- Boucle -----
    let t = 0, raf;
    let visible = true;
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) loop(); });
    function loop() {
      if (!visible) return;
      raf = requestAnimationFrame(loop);
      t += 0.006;
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      group.rotation.y = mx * 0.35;               // parallaxe seule (horizon stable)
      group.rotation.x = my * 0.12;
      group.position.y = -scrollY * 0.0022;

      keyGroup.rotation.y = t * 0.9;
      keyGroup.rotation.z = Math.sin(t * 0.7) * 0.12;
      keyGroup.position.y = 2.6 + Math.sin(t * 1.2) * 0.35;

      // vagues du Léman
      for (let i = 0; i < wpos.count; i++) {
        const x = wBase[i * 3], y = wBase[i * 3 + 1];
        wpos.array[i * 3 + 2] = Math.sin(x * 0.32 + t * 2.4) * 0.14 + Math.cos(y * 0.26 + t * 1.8) * 0.11;
      }
      wpos.needsUpdate = true;

      // ronds dans l'eau
      ripples.forEach((r) => {
        const s = (t * 0.55 + r.userData.phase) % 1;
        const k = 0.6 + s * 4.2;
        r.scale.set(k, k, 1);
        r.material.opacity = (1 - s) * 0.3;
      });

      points.rotation.y = t * 0.03;
      fireflies.rotation.y = -t * 0.02;
      fireflies.position.y = Math.sin(t * 0.6) * 0.5;
      keyGlow.material.opacity = 0.62 + Math.sin(t * 2.1) * 0.16; // pulsation du halo

      // jet d'eau : trajectoire balistique + recyclage des gouttes
      for (let i = 0; i < JET.count; i++) {
        jAge[i] += 0.016;
        if (jAge[i] > jLife[i]) jAge[i] = 0;
        const a = jAge[i], v = jVel[i];
        jpos[i * 3]     = JET.base.x + v.x * a;
        jpos[i * 3 + 1] = JET.base.y + v.y * a - 0.5 * JET.g * a * a;
        jpos[i * 3 + 2] = JET.base.z + v.z * a;
      }
      jgeo.attributes.position.needsUpdate = true;

      camera.position.z = 16 + Math.sin(t * 0.45) * 0.45; // respiration
      camera.lookAt(0, 0.5, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  // three.js est chargé avec "defer" : il est prêt au moment où ce script s'exécute (aussi deferé).
  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
