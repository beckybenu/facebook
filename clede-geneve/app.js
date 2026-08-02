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
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 1.5, 16);

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

    // ----- Skyline stylisée (tours de verre) -----
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8c07d, metalness: .9, roughness: .28 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x1b2440, metalness: .6, roughness: .15,
      emissive: 0x14324a, emissiveIntensity: .5 });
    const teal = new THREE.MeshStandardMaterial({ color: 0x2f6f68, metalness: .7, roughness: .25,
      emissive: 0x0e2b28, emissiveIntensity: .6 });
    const mats = [glass, teal, glass];

    const towers = new THREE.Group();
    const N = 34;
    for (let i = 0; i < N; i++) {
      const w = 0.5 + Math.random() * 0.7;
      const h = 1.5 + Math.random() * 6;
      const geo = new THREE.BoxGeometry(w, h, w);
      const m = mats[i % mats.length].clone();
      const mesh = new THREE.Mesh(geo, m);
      const ring = 5 + Math.random() * 9;
      const ang = Math.random() * Math.PI * 2;
      mesh.position.set(Math.cos(ang) * ring, h / 2 - 4.5, Math.sin(ang) * ring - 3);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.userData.floatSpeed = 0.4 + Math.random() * 0.8;
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      towers.add(mesh);
    }
    group.add(towers);

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

      group.rotation.y = mx * 0.5 + t * 0.05;
      group.rotation.x = my * 0.25;
      group.position.y = -scrollY * 0.0022;

      keyGroup.rotation.y = t * 0.9;
      keyGroup.rotation.z = Math.sin(t * 0.7) * 0.12;
      keyGroup.position.y = 2.6 + Math.sin(t * 1.2) * 0.35;

      towers.children.forEach((m) => {
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed + m.userData.phase) * 0.35;
      });

      points.rotation.y = t * 0.03;

      camera.lookAt(0, 0.5, 0);
      renderer.render(scene, camera);
    }
    loop();
  }

  // three.js est chargé avec "defer" : il est prêt au moment où ce script s'exécute (aussi deferé).
  if (document.readyState === "complete") init3D();
  else window.addEventListener("load", init3D);
})();
