/* ============================================================
   Karat — Salon de coiffure
   Application autonome (aucun serveur requis).
   Les rendez-vous sont enregistrés dans le navigateur (localStorage).
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Données : services ---------- */
  const SERVICES = [
    { id: "coupe-femme",   emoji: "✂️", name: "Coupe Femme",        desc: "Shampoing, coupe sur-mesure et coiffage.",                     price: 35, duration: 45 },
    { id: "coupe-homme",   emoji: "💈", name: "Coupe Homme",        desc: "Coupe ciseaux ou tondeuse, contours et finitions.",            price: 22, duration: 30 },
    { id: "brushing",      emoji: "💨", name: "Brushing",           desc: "Mise en forme et volume pour un fini impeccable.",             price: 28, duration: 30 },
    { id: "couleur",       emoji: "🎨", name: "Couleur",            desc: "Coloration permanente, racines et longueurs.",                 price: 55, duration: 90 },
    { id: "meches",        emoji: "✨", name: "Mèches / Balayage",  desc: "Éclaircissement naturel et reflets lumineux.",                 price: 75, duration: 120 },
    { id: "soin",          emoji: "🌿", name: "Soin profond",       desc: "Masque réparateur et rituel de soin personnalisé.",            price: 25, duration: 30 },
    { id: "chignon",       emoji: "👰", name: "Chignon / Événement", desc: "Coiffure d'occasion : mariage, soirée, cérémonie.",            price: 60, duration: 60 },
    { id: "enfant",        emoji: "🧒", name: "Coupe Enfant",       desc: "Coupe douce et rapide pour les moins de 12 ans.",              price: 18, duration: 25 }
  ];

  /* ---------- Horaires ---------- */
  const HOURS = [
    { day: "Lundi",    open: null },
    { day: "Mardi",    open: "9h00 – 19h00" },
    { day: "Mercredi", open: "9h00 – 19h00" },
    { day: "Jeudi",    open: "9h00 – 20h00" },
    { day: "Vendredi", open: "9h00 – 20h00" },
    { day: "Samedi",   open: "9h00 – 18h00" },
    { day: "Dimanche", open: "10h00 – 14h00" }
  ];
  // Indices JS de Date.getDay() où le salon est fermé (0 = dimanche). Lundi fermé.
  const CLOSED_WEEKDAYS = [1];

  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "14:00", "14:30", "15:00", "15:30", "16:00",
    "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
  ];

  const STORAGE_KEY = "karat.appointments.v1";
  const MONTHS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function loadAppointments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAppointments(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* stockage indisponible (navigation privée) — on continue sans planter */
    }
  }

  function serviceById(id) {
    return SERVICES.find((s) => s.id === id);
  }

  function formatPrice(p) {
    return p + " €";
  }

  function formatDuration(min) {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m ? h + "h" + String(m).padStart(2, "0") : h + "h";
    }
    return min + " min";
  }

  /* ---------- Rendu : services ---------- */
  function renderServices() {
    const grid = $("#services-grid");
    const select = $("#f-service");
    if (!grid) return;

    grid.innerHTML = SERVICES.map((s) => `
      <article class="service-card">
        <div class="service-emoji" aria-hidden="true">${s.emoji}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <div class="service-foot">
          <div>
            <div class="service-price">${formatPrice(s.price)}</div>
            <div class="service-dur">${formatDuration(s.duration)}</div>
          </div>
          <button class="service-book" data-service="${s.id}">Réserver →</button>
        </div>
      </article>
    `).join("");

    // Options du menu déroulant
    if (select) {
      SERVICES.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.name} — ${formatPrice(s.price)} (${formatDuration(s.duration)})`;
        select.appendChild(opt);
      });
    }

    // Boutons "Réserver" des cartes
    $$(".service-book", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-service");
        if (select) select.value = id;
        document.getElementById("rendezvous").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => $("#f-name") && $("#f-name").focus(), 500);
      });
    });
  }

  /* ---------- Rendu : créneaux horaires ---------- */
  function renderTimeSlots() {
    const select = $("#f-time");
    if (!select) return;
    TIME_SLOTS.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t.replace(":", "h");
      select.appendChild(opt);
    });
  }

  /* ---------- Rendu : horaires ---------- */
  function renderHours() {
    const list = $("#hours-list");
    if (!list) return;
    list.innerHTML = HOURS.map((h) => `
      <li class="${h.open ? "" : "closed"}">
        <span>${h.day}</span>
        <strong>${h.open || "Fermé"}</strong>
      </li>
    `).join("");
  }

  /* ---------- Rendu : mes rendez-vous ---------- */
  function renderAppointments() {
    const container = $("#appointments-list");
    if (!container) return;
    const list = loadAppointments().sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Vous n'avez aucun rendez-vous enregistré.</p>
          <p>Réservez votre première prestation ci-dessus ✨</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map((appt) => {
      const svc = serviceById(appt.service);
      const d = new Date(appt.date + "T00:00:00");
      const day = String(d.getDate()).padStart(2, "0");
      const month = MONTHS[d.getMonth()];
      return `
        <div class="appt-card">
          <div class="appt-date">
            <div class="d">${day}</div>
            <div class="m">${month}</div>
          </div>
          <div class="appt-body">
            <h4>${svc ? svc.name : "Prestation"}</h4>
            <p><span class="appt-time">${appt.time.replace(":", "h")}</span> · ${appt.name}${svc ? " · " + formatPrice(svc.price) : ""}</p>
          </div>
          <button class="appt-cancel" data-id="${appt.id}">Annuler</button>
        </div>`;
    }).join("");

    $$(".appt-cancel", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const next = loadAppointments().filter((a) => a.id !== id);
        saveAppointments(next);
        renderAppointments();
        showToast("Rendez-vous annulé.");
      });
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function showToast(msg) {
    const toast = $("#toast");
    if (!toast) return;
    toast.innerHTML = `<span class="toast-mark">✦</span>${msg}`;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
  }

  /* ---------- Validation & soumission ---------- */
  function setupForm() {
    const form = $("#booking-form");
    if (!form) return;
    const dateInput = $("#f-date");
    const errorBox = $("#form-error");

    // Date minimale = aujourd'hui
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    if (dateInput) dateInput.min = `${yyyy}-${mm}-${dd}`;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      errorBox.textContent = "";

      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        service: form.service.value,
        date: form.date.value,
        time: form.time.value,
        notes: form.notes.value.trim()
      };

      // Validations
      if (!data.name) return fail("Merci d'indiquer votre nom.");
      if (!data.phone || data.phone.replace(/[^0-9]/g, "").length < 8)
        return fail("Merci d'indiquer un numéro de téléphone valide.");
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        return fail("L'adresse email semble incorrecte.");
      if (!data.service) return fail("Choisissez une prestation.");
      if (!data.date) return fail("Choisissez une date.");
      if (!data.time) return fail("Choisissez une heure.");

      const chosen = new Date(data.date + "T00:00:00");
      if (CLOSED_WEEKDAYS.includes(chosen.getDay()))
        return fail("Le salon est fermé ce jour-là. Merci de choisir une autre date.");

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (chosen < todayMidnight)
        return fail("La date choisie est déjà passée.");

      // Doublon de créneau ?
      const existing = loadAppointments();
      if (existing.some((a) => a.date === data.date && a.time === data.time))
        return fail("Ce créneau est déjà réservé sur cet appareil. Choisissez une autre heure.");

      // Enregistrement
      const appt = Object.assign({ id: makeId(), createdAt: new Date().toISOString() }, data);
      existing.push(appt);
      saveAppointments(existing);
      renderAppointments();

      const svc = serviceById(data.service);
      const dLabel = chosen.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      showToast(`Rendez-vous confirmé — ${svc ? svc.name : ""} le ${dLabel} à ${data.time.replace(":", "h")} ✓`);

      form.reset();
      document.getElementById("mes-rdv").scrollIntoView({ behavior: "smooth" });

      function fail(msg) {
        errorBox.textContent = msg;
        return false;
      }
    });
  }

  function makeId() {
    return "rdv-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  /* ---------- Menu mobile ---------- */
  function setupBurger() {
    const burger = $("#burger");
    const header = $(".site-header");
    if (!burger || !header) return;
    burger.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    $$(".nav a", header).forEach((a) =>
      a.addEventListener("click", () => {
        header.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderServices();
    renderTimeSlots();
    renderHours();
    renderAppointments();
    setupForm();
    setupBurger();
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
