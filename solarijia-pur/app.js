/* ===========================================================
   Solarijia — variante « PUR » — interactions minimales
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
    encodeURIComponent("Bonjour Solarijia, j'aimerais prendre rendez-vous 🌸");
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

  /* ============ Reveal on scroll (fondu doux) ============ */
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
    if (reduceMotion) { el.textContent = to + suffix; return; }
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
})();
