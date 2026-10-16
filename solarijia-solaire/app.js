/* ===========================================================
   Solarijia — variante « SOLAIRE » : interactions + scène 3D
   =========================================================== */
(function () {
  "use strict";

  /* ============ CONFIG (à personnaliser) ============ */
  const CONFIG = {
    email: "contact@solarijia.fr",   // ← votre e-mail de réservation
    whatsapp: "33600000000",         // ← numéro WhatsApp, format international sans +
    instagram: "https://www.instagram.com/solarijia/",
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ============ Préloader ============ */
  window.addEventListener("load", () => {
    setTimeout(() => $("#preloader")?.classList.add("done"), 420);
  });

  /* ============ Année footer ============ */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* ============ Liens contact dynamiques ============ */
  const wa = $("#whatsapp-link");
  if (wa) wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" +
    encodeURIComponent("Bonjour Solarijia, j'aimerais prendre rendez-vous ☀️");
  $$("#insta-link,#insta-btn").forEach(a => { if (a) a.href = CONFIG.instagram; });

  /* ============ Nav : scrolled + barre + burger ============ */
  const nav = $("#nav");
  const bar = $(".scroll-progress");
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 24);
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
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
    burger?.setAttribute("aria-expanded", "false");
  }));

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
      const strength = 6;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateY(-6px)`;
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
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.28}px)`;
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
`Nouvelle demande de rendez-vous — Solarijia

Nom       : ${data.name}
E-mail    : ${data.email}
Téléphone : ${data.phone || "—"}
Soin      : ${data.service || "—"}

Message :
${data.message || "—"}
`;
    const href = "mailto:" + CONFIG.email +
      "?subject=" + encodeURIComponent("Rendez-vous Solarijia — " + data.name) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    note.textContent = "Votre messagerie s'ouvre… Sinon, écrivez-nous à " + CONFIG.email;
    note.className = "form-note ok";
  });

  /* ============ Scène 3D (three.js) — un grand soleil doré ============ */
  function init3D() {
    const THREE = window.THREE;
    const canvas = $("#scene");
    if (!THREE || !canvas || reduceMotion) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (err) { return; } // pas de WebGL → on garde le fond dégradé + soleil CSS
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0.4, 16);

    const group = new THREE.Group();
    scene.add(group);

    // ----- Lumières chaudes et lumineuses -----
    scene.add(new THREE.AmbientLight(0xfff0d8, 0.9));
    const key = new THREE.DirectionalLight(0xffe3a6, 1.6);
    key.position.set(6, 9, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0xff9e7a, 2.4, 70);   // corail
    rim.position.set(-10, 2, 7);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xf5b14c, 2.2, 70);  // or
    rim2.position.set(10, -3, 6);
    scene.add(rim2);

    // ----- Le grand astre doré -----
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xf5b14c, emissive: 0xef7d5a, emissiveIntensity: 0.55,
      metalness: 0.2, roughness: 0.45,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(3.6, 64, 64), sunMat);
    sun.position.set(6.5, 3.2, -2);
    group.add(sun);

    // Halo lumineux (sphère additive translucide)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd9a0, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(4.6, 48, 48), haloMat);
    halo.position.copy(sun.position);
    group.add(halo);

    // ----- Rayons de soleil stylisés (cônes rayonnants) -----
    const rays = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xf5b14c, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const rayCount = 16;
    for (let i = 0; i < rayCount; i++) {
      const geo = new THREE.ConeGeometry(0.42, 5.5, 4, 1, true);
      const m = new THREE.Mesh(geo, rayMat);
      const a = (i / rayCount) * Math.PI * 2;
      m.position.set(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 0);
      m.rotation.z = a - Math.PI / 2;
      rays.add(m);
    }
    rays.position.copy(sun.position);
    group.add(rays);

    // ----- Perles / planètes douces en orbite -----
    const orbs = new THREE.Group();
    const palette = [0xef7d5a, 0xffd9a0, 0xff9e7a, 0xf5b14c];
    for (let i = 0; i < 9; i++) {
      const s = 0.28 + Math.random() * 0.7;
      const mat = new THREE.MeshStandardMaterial({
        color: palette[i % palette.length], metalness: 0.25, roughness: 0.4,
        emissive: 0x5a2410, emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(s, 32, 32), mat);
      const ring = 4 + Math.random() * 8;
      const ang = Math.random() * Math.PI * 2;
      mesh.position.set(Math.cos(ang) * ring - 2, (Math.random() - 0.5) * 10, Math.sin(ang) * ring - 5);
      mesh.userData = { sp: 0.4 + Math.random() * 0.9, ph: Math.random() * Math.PI * 2, baseY: mesh.position.y };
      orbs.add(mesh);
    }
    group.add(orbs);

    // ----- Poussières dorées (particules) -----
    const pCount = 420;
    const pgeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 42;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
    }
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pmat = new THREE.PointsMaterial({
      color: 0xf5b14c, size: 0.07, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pgeo, pmat);
    scene.add(points);

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
    let t = 0;
    let visible = true;
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) loop(); });
    function loop() {
      if (!visible) return;
      requestAnimationFrame(loop);
      t += 0.006;
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      group.rotation.y = mx * 0.4 + t * 0.02;
      group.rotation.x = my * 0.18;
      group.position.y = -scrollY * 0.0022;

      sun.rotation.y += 0.002;
      rays.rotation.z += 0.0016;
      const pulse = 1 + Math.sin(t * 1.4) * 0.03;
      halo.scale.setScalar(pulse);

      orbs.children.forEach((m) => {
        m.rotation.y += 0.01 * m.userData.sp;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.sp + m.userData.ph) * 0.5;
      });
      points.rotation.y = t * 0.03;

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
