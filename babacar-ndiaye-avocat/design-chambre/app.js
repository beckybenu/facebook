/* ==========================================================================
   Chambre : interactions et scene 3D.
   La camera avance dans une salle d'archives au fil du scroll.
   ========================================================================== */

(function () {
  "use strict";

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finPointeur = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var etroit = window.matchMedia("(max-width: 860px)").matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var etat = {
    y: 0,
    progression: 0,
    heroSortie: 0,
    pointeurX: 0,
    pointeurY: 0,
    pointeurLisseX: 0,
    pointeurLisseY: 0
  };

  if (finPointeur && !reduit) {
    window.addEventListener("pointermove", function (e) {
      etat.pointeurX = (e.clientX / window.innerWidth) * 2 - 1;
      etat.pointeurY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* --- Rideau d'ouverture --------------------------------------------------- */

  (function rideau() {
    var voile = document.querySelector("[data-rideau]");
    if (!voile) return;
    if (reduit) { voile.remove(); return; }

    var compteur = voile.querySelector("[data-compteur]");
    var valeur = 0;
    var debut = performance.now();

    function avancer(maintenant) {
      var t = clamp((maintenant - debut) / 1400, 0, 1);
      valeur = Math.round(t * 100);
      if (compteur) compteur.textContent = valeur < 10 ? "0" + valeur : String(valeur);
      if (t < 1) {
        requestAnimationFrame(avancer);
      } else {
        voile.classList.add("est-leve");
        window.setTimeout(function () { voile.remove(); }, 700);
        document.body.dispatchEvent(new CustomEvent("rideau-leve"));
      }
    }

    requestAnimationFrame(avancer);
  })();

  /* --- Titre : decoupe en mots et en lettres --------------------------------- */

  (function titre() {
    var cible = document.querySelector("[data-lettres]");
    if (!cible) return;

    var rang = 0;

    Array.prototype.forEach.call(cible.querySelectorAll(".ligne"), function (ligne) {
      var mots = ligne.textContent.trim().split(" ");
      ligne.textContent = "";

      mots.forEach(function (mot, im) {
        var spanMot = document.createElement("span");
        spanMot.className = "mot" + (mot.indexOf("impact") >= 0 ? " mot--or" : "");

        mot.split("").forEach(function (car) {
          var lettre = document.createElement("span");
          lettre.className = "lettre";
          lettre.textContent = car;
          if (!reduit) {
            lettre.style.transitionDelay = 240 + rang * 24 + "ms";
          } else {
            lettre.classList.add("est-la");
          }
          spanMot.appendChild(lettre);
          rang++;
        });

        ligne.appendChild(spanMot);
        if (im < mots.length - 1) ligne.appendChild(document.createTextNode(" "));
      });
    });

    if (reduit) return;

    function reveler() {
      var lettres = cible.querySelectorAll(".lettre");
      Array.prototype.forEach.call(lettres, function (l) { l.classList.add("est-la"); });
    }

    if (document.querySelector("[data-rideau]")) {
      document.body.addEventListener("rideau-leve", reveler, { once: true });
    } else {
      requestAnimationFrame(reveler);
    }
  })();

  /* --- Revelations ----------------------------------------------------------- */

  (function revelations() {
    var cibles = document.querySelectorAll("[data-reveal], [data-tuile]");
    if (reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(cibles, function (el) {
        el.classList.add(el.hasAttribute("data-tuile") ? "est-vue" : "est-vu");
      });
      return;
    }

    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        var voisins = e.target.parentElement.children;
        var rang = Array.prototype.indexOf.call(voisins, e.target);
        e.target.style.transitionDelay = clamp(rang, 0, 6) * 70 + "ms";
        e.target.classList.add(e.target.hasAttribute("data-tuile") ? "est-vue" : "est-vu");
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    Array.prototype.forEach.call(cibles, function (el) { obs.observe(el); });
  })();

  /* --- Entete, progression, lien actif --------------------------------------- */

  var entete = document.querySelector("[data-entete]");
  var barre = document.querySelector("[data-progression]");
  var liensNav = document.querySelectorAll(".nav a");
  var sections = [];
  Array.prototype.forEach.call(liensNav, function (lien) {
    var cible = document.querySelector(lien.getAttribute("href"));
    if (cible) sections.push({ lien: lien, cible: cible });
  });

  var dernierY = 0;

  function majEntete() {
    var y = etat.y;
    if (entete) {
      entete.classList.toggle("est-collee", y > 40);
      if (y > dernierY + 4 && y > 260) entete.classList.add("est-cachee");
      else if (y < dernierY - 4) entete.classList.remove("est-cachee");
    }
    dernierY = y;

    if (barre) barre.style.transform = "scaleX(" + etat.progression.toFixed(4) + ")";

    var actif = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].cible.getBoundingClientRect().top <= window.innerHeight * 0.42) {
        actif = sections[i].lien;
      }
    }
    Array.prototype.forEach.call(liensNav, function (lien) {
      lien.classList.toggle("est-active", lien === actif);
    });
  }

  /* --- Menu mobile ------------------------------------------------------------ */

  (function menu() {
    var bouton = document.querySelector("[data-burger]");
    var panneau = document.querySelector("[data-menu]");
    if (!bouton || !panneau) return;

    function basculer(ouvrir) {
      bouton.setAttribute("aria-expanded", String(ouvrir));
      panneau.hidden = !ouvrir;
    }

    bouton.addEventListener("click", function () {
      basculer(bouton.getAttribute("aria-expanded") !== "true");
    });
    panneau.addEventListener("click", function (e) {
      if (e.target.tagName === "A") basculer(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panneau.hidden) { basculer(false); bouton.focus(); }
    });
  })();

  /* --- Modes de collaboration -------------------------------------------------- */

  (function modes() {
    var elements = document.querySelectorAll("[data-mode]");
    Array.prototype.forEach.call(elements, function (mode) {
      var tete = mode.querySelector(".mode__tete");
      if (!tete) return;
      tete.addEventListener("click", function () {
        var ouvert = tete.getAttribute("aria-expanded") === "true";
        Array.prototype.forEach.call(elements, function (autre) {
          if (autre === mode) return;
          autre.classList.remove("est-ouvert");
          autre.querySelector(".mode__tete").setAttribute("aria-expanded", "false");
        });
        tete.setAttribute("aria-expanded", String(!ouvert));
        mode.classList.toggle("est-ouvert", !ouvert);
      });
    });
  })();

  /* --- Defile des secteurs : on double la piste pour une boucle sans couture ---- */

  (function defile() {
    var piste = document.querySelector(".defile__piste");
    if (!piste || reduit) return;
    var copie = piste.cloneNode(true);
    Array.prototype.forEach.call(copie.children, function (n) { piste.appendChild(n.cloneNode(true)); });
  })();

  /* --- Filet du cabinet + travelling de la methode ------------------------------ */

  var filet = document.querySelector("[data-filet]");
  var blocCabinet = document.querySelector(".cabinet");
  var blocMethode = document.querySelector("[data-travelling]");
  var rail = document.querySelector("[data-rail]");

  function majFilet() {
    if (!filet || !blocCabinet) return;
    var r = blocCabinet.getBoundingClientRect();
    var p = clamp((window.innerHeight * 0.8 - r.top) / (r.height * 0.8), 0, 1);
    filet.style.transform = "scaleY(" + p.toFixed(4) + ")";
  }

  // Passe le hero, la salle recule derriere le contenu pour rester lisible.
  var voile = document.querySelector(".scene");

  function majVoile() {
    if (!voile) return;
    var recul = clamp(etat.heroSortie, 0, 1);
    voile.style.opacity = (1 - recul * 0.62).toFixed(3);
  }

  function majRail() {
    if (!rail || !blocMethode || etroit || reduit) return;
    var r = blocMethode.getBoundingClientRect();
    var course = r.height - window.innerHeight;
    var p = course > 0 ? clamp(-r.top / course, 0, 1) : 0;
    var distance = Math.max(rail.scrollWidth - window.innerWidth, 0);
    rail.style.transform = "translateX(" + (-p * distance).toFixed(2) + "px)";
  }

  /* --- Formulaire ---------------------------------------------------------------- */

  (function formulaire() {
    var form = document.querySelector("[data-formulaire]");
    if (!form) return;

    var etatTexte = form.querySelector("[data-etat]");
    var bouton = form.querySelector("[data-envoi]");
    var libelle = form.querySelector("[data-envoi-texte]");

    function verifier(champ) {
      var conteneur = champ.closest(".champ");
      var erreur = form.querySelector('[data-erreur-pour="' + champ.id + '"]');
      var valide = champ.checkValidity();
      if (conteneur) conteneur.classList.toggle("est-invalide", !valide);
      if (erreur) erreur.hidden = valide;
      return valide;
    }

    Array.prototype.forEach.call(form.querySelectorAll("input, textarea"), function (champ) {
      champ.addEventListener("blur", function () {
        if (champ.value !== "" || champ.required) verifier(champ);
      });
      champ.addEventListener("input", function () {
        var conteneur = champ.closest(".champ");
        if (conteneur && conteneur.classList.contains("est-invalide")) verifier(champ);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var premierInvalide = null;
      Array.prototype.forEach.call(
        form.querySelectorAll("input[required], textarea[required]"),
        function (champ) {
          if (!verifier(champ) && !premierInvalide) premierInvalide = champ;
        }
      );

      if (premierInvalide) {
        etatTexte.textContent = "Quelques champs demandent encore une precision.";
        etatTexte.className = "formulaire__etat est-erreur";
        premierInvalide.focus();
        return;
      }

      bouton.classList.add("est-occupe");
      libelle.textContent = "Ouverture de votre messagerie";

      window.setTimeout(function () {
        var d = new FormData(form);
        var corps =
          "Nom : " + d.get("nom") + "\n" +
          "Courriel : " + d.get("email") + "\n" +
          "Telephone : " + (d.get("telephone") || "non precise") + "\n" +
          "Objet : " + d.get("objet") + "\n\n" + d.get("message");

        window.location.href =
          "mailto:contact@babacarndiaye-avocat.sn?subject=" +
          encodeURIComponent("Demande : " + d.get("objet")) +
          "&body=" + encodeURIComponent(corps);

        bouton.classList.remove("est-occupe");
        libelle.textContent = "Envoyer la demande";
        etatTexte.textContent = "Votre message est pret dans votre messagerie. Il ne reste qu'a l'envoyer.";
        etatTexte.className = "formulaire__etat est-succes";
      }, 520);
    });
  })();

  /* --- Scene 3D : la salle d'archives -------------------------------------------- */

  var scene3d = (function () {
    var canvas = document.querySelector("[data-canvas]");
    var THREE = window.THREE;
    if (!canvas || !THREE || reduit) return null;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (err) {
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d14, 0.052);

    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    camera.position.set(0, 0, 4);

    scene.add(new THREE.AmbientLight(0x243244, 0.9));

    var lampe = new THREE.DirectionalLight(0xd8b86b, 1.15);
    lampe.position.set(-3, 5, 4);
    scene.add(lampe);

    var contre = new THREE.DirectionalLight(0x5c7fa8, 0.5);
    contre.position.set(4, -2, -6);
    scene.add(contre);

    var lampeMobile = new THREE.PointLight(0xd8b86b, 12, 26);
    scene.add(lampeMobile);

    // Les dalles : un dossier par plaque, suspendues dans le noir.
    var dalles = new THREE.Group();
    scene.add(dalles);

    var matiereDalle = new THREE.MeshStandardMaterial({
      color: 0x1d2a3a,
      metalness: 0.42,
      roughness: 0.34,
      transparent: true,
      opacity: 0.74
    });

    var matiereFilet = new THREE.LineBasicMaterial({ color: 0xd8b86b, transparent: true, opacity: 0.72 });
    var geoDalle = new THREE.BoxGeometry(2.4, 3.3, 0.05);
    var geoFilet = new THREE.EdgesGeometry(geoDalle);

    var NB = 22;
    for (var i = 0; i < NB; i++) {
      var groupe = new THREE.Group();
      var cote = i % 2 === 0 ? -1 : 1;
      groupe.position.set(
        cote * (3.1 + (i % 3) * 0.7),
        Math.sin(i * 1.7) * 1.3,
        -7 - i * 2.5
      );
      groupe.rotation.y = cote * (0.34 + (i % 4) * 0.05);
      groupe.rotation.z = Math.sin(i * 0.9) * 0.05;

      groupe.add(new THREE.Mesh(geoDalle, matiereDalle));
      groupe.add(new THREE.LineSegments(geoFilet, matiereFilet));
      groupe.userData.derive = 0.12 + (i % 5) * 0.04;
      groupe.userData.phase = i * 0.83;
      dalles.add(groupe);
    }

    // Poussiere en suspension : la lumiere devient visible.
    var nbGrains = 900;
    var positions = new Float32Array(nbGrains * 3);
    for (var g = 0; g < nbGrains; g++) {
      positions[g * 3] = (Math.random() - 0.5) * 18;
      positions[g * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[g * 3 + 2] = -Math.random() * 62;
    }
    var geoGrains = new THREE.BufferGeometry();
    geoGrains.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var grains = new THREE.Points(
      geoGrains,
      new THREE.PointsMaterial({
        color: 0xd8b86b,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(grains);

    function dimensionner() {
      var l = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(l, h, false);
      camera.aspect = l / h;
      camera.fov = l < 900 ? 62 : 46;
      camera.updateProjectionMatrix();
    }

    dimensionner();
    window.addEventListener("resize", dimensionner);

    var temps = 0;
    var profondeur = 0;

    return {
      canvas: canvas,
      pas: function (dt) {
        temps += dt;

        // La camera descend le couloir a mesure que la page defile.
        var cible = 4 - etat.progression * 52;
        profondeur = lerp(profondeur, cible, 0.055);
        camera.position.z = profondeur;
        camera.position.x = lerp(camera.position.x, etat.pointeurLisseX * 0.9, 0.05);
        camera.position.y = lerp(camera.position.y, -etat.pointeurLisseY * 0.55, 0.05);
        camera.rotation.y = -etat.pointeurLisseX * 0.06;
        camera.rotation.x = etat.pointeurLisseY * 0.04;

        lampeMobile.position.set(
          Math.sin(temps * 0.35) * 3.2,
          1.4,
          profondeur - 4
        );

        for (var i = 0; i < dalles.children.length; i++) {
          var d = dalles.children[i];
          d.position.y += Math.sin(temps * 0.5 + d.userData.phase) * d.userData.derive * dt;
          d.rotation.y += Math.sin(temps * 0.2 + d.userData.phase) * 0.04 * dt;
        }

        grains.rotation.y = temps * 0.008;

        renderer.render(scene, camera);
      }
    };
  })();

  if (scene3d) {
    requestAnimationFrame(function () { scene3d.canvas.classList.add("est-prete"); });
  }

  /* --- Boucle unique ---------------------------------------------------------------- */

  var dernierTemps = performance.now();

  function boucle(maintenant) {
    var dt = Math.min((maintenant - dernierTemps) / 1000, 0.05);
    dernierTemps = maintenant;

    etat.y = window.scrollY || window.pageYOffset || 0;
    var course = document.documentElement.scrollHeight - window.innerHeight;
    etat.progression = course > 0 ? clamp(etat.y / course, 0, 1) : 0;
    etat.heroSortie = clamp(etat.y / Math.max(window.innerHeight, 1), 0, 1.6);

    etat.pointeurLisseX = lerp(etat.pointeurLisseX, etat.pointeurX, 0.055);
    etat.pointeurLisseY = lerp(etat.pointeurLisseY, etat.pointeurY, 0.055);

    majEntete();
    majFilet();
    majRail();
    majVoile();

    if (scene3d && !document.hidden) scene3d.pas(dt);

    requestAnimationFrame(boucle);
  }

  window.addEventListener("resize", function () {
    etroit = window.matchMedia("(max-width: 860px)").matches;
    if (rail && (etroit || reduit)) rail.style.transform = "";
  });

  requestAnimationFrame(boucle);
})();
