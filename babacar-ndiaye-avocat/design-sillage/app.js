/* ==========================================================================
   Sillage : interactions et scene 3D.
   Un seul rAF pilote le scroll, la scene et les interpolations.
   ========================================================================== */

(function () {
  "use strict";

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finPointeur = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* --- Etat partage du scroll --------------------------------------------- */

  var etat = {
    y: window.scrollY || 0,
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

  /* --- Titre du hero : revelation ligne par ligne -------------------------- */

  (function titreHero() {
    var lignes = document.querySelectorAll(".hero__titre .ligne");
    Array.prototype.forEach.call(lignes, function (ligne, i) {
      var texte = ligne.textContent;
      ligne.textContent = "";
      var interne = document.createElement("span");
      interne.textContent = texte;
      ligne.appendChild(interne);

      if (reduit) {
        interne.style.transform = "none";
        return;
      }

      interne.style.transition =
        "transform 880ms cubic-bezier(0.16, 1, 0.3, 1) " + (140 + i * 110) + "ms";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          interne.style.transform = "translateY(0)";
        });
      });
    });
  })();

  /* --- Revelations au defilement ------------------------------------------ */

  (function revelations() {
    var cibles = document.querySelectorAll("[data-reveal]");
    if (reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(cibles, function (el) { el.classList.add("est-vu"); });
      return;
    }

    var vus = new WeakMap();
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting || vus.has(entree.target)) return;
        vus.set(entree.target, true);

        var voisins = entree.target.parentElement
          ? entree.target.parentElement.querySelectorAll("[data-reveal]")
          : [entree.target];
        var rang = Array.prototype.indexOf.call(voisins, entree.target);
        entree.target.style.transitionDelay = clamp(rang, 0, 5) * 70 + "ms";
        entree.target.classList.add("est-vu");
        observateur.unobserve(entree.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    Array.prototype.forEach.call(cibles, function (el) { observateur.observe(el); });
  })();

  /* --- Entete, progression, lien actif ------------------------------------ */

  var entete = document.querySelector("[data-entete]");
  var barre = document.querySelector("[data-progression]");
  var liensNav = document.querySelectorAll(".nav a");
  var sections = [];
  Array.prototype.forEach.call(liensNav, function (lien) {
    var cible = document.querySelector(lien.getAttribute("href"));
    if (cible) sections.push({ lien: lien, cible: cible });
  });

  var dernierY = window.scrollY || 0;

  function majEntete() {
    var y = etat.y;
    if (entete) {
      entete.classList.toggle("est-collee", y > 40);
      var descend = y > dernierY + 4;
      var monte = y < dernierY - 4;
      if (descend && y > 260) entete.classList.add("est-cachee");
      else if (monte) entete.classList.remove("est-cachee");
    }
    dernierY = y;

    if (barre) barre.style.transform = "scaleX(" + etat.progression.toFixed(4) + ")";

    var actif = null;
    for (var i = 0; i < sections.length; i++) {
      var haut = sections[i].cible.getBoundingClientRect().top;
      if (haut <= window.innerHeight * 0.42) actif = sections[i].lien;
    }
    Array.prototype.forEach.call(liensNav, function (lien) {
      lien.classList.toggle("est-active", lien === actif);
    });
  }

  /* --- Menu mobile --------------------------------------------------------- */

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
      if (e.key === "Escape" && !panneau.hidden) {
        basculer(false);
        bouton.focus();
      }
    });
  })();

  /* --- Index des expertises ------------------------------------------------ */

  (function index() {
    var lignes = document.querySelectorAll(".index__ligne");
    Array.prototype.forEach.call(lignes, function (ligne) {
      var tete = ligne.querySelector(".index__tete");
      if (!tete) return;
      tete.addEventListener("click", function () {
        var ouvert = tete.getAttribute("aria-expanded") === "true";
        Array.prototype.forEach.call(lignes, function (autre) {
          if (autre === ligne) return;
          autre.classList.remove("est-ouverte");
          var t = autre.querySelector(".index__tete");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        tete.setAttribute("aria-expanded", String(!ouvert));
        ligne.classList.toggle("est-ouverte", !ouvert);
      });
    });
  })();

  /* --- Methode : temps actif + jauge --------------------------------------- */

  var jauge = document.querySelector("[data-jauge]");
  var bloc = document.querySelector("[data-methode]");
  var temps = document.querySelectorAll("[data-temps]");

  (function methode() {
    if (!temps.length) return;
    if (reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(temps, function (t) { t.classList.add("est-actif"); });
      return;
    }
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        e.target.classList.toggle("est-actif", e.isIntersecting);
      });
    }, { rootMargin: "-32% 0px -32% 0px" });
    Array.prototype.forEach.call(temps, function (t) { obs.observe(t); });
  })();

  function majJauge() {
    if (!jauge || !bloc) return;
    var r = bloc.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    jauge.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }

  /* --- Piste des secteurs : glisser pour faire defiler ---------------------- */

  (function piste() {
    var piste = document.querySelector("[data-piste]");
    if (!piste) return;

    var tire = false;
    var departX = 0;
    var departScroll = 0;

    piste.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      tire = true;
      departX = e.clientX;
      departScroll = piste.scrollLeft;
      piste.classList.add("est-tiree");
      piste.setPointerCapture(e.pointerId);
    });

    piste.addEventListener("pointermove", function (e) {
      if (!tire) return;
      piste.scrollLeft = departScroll - (e.clientX - departX);
    });

    function relacher(e) {
      if (!tire) return;
      tire = false;
      piste.classList.remove("est-tiree");
      if (e.pointerId != null && piste.hasPointerCapture(e.pointerId)) {
        piste.releasePointerCapture(e.pointerId);
      }
    }

    piste.addEventListener("pointerup", relacher);
    piste.addEventListener("pointercancel", relacher);
  })();

  /* --- Onglets de collaboration -------------------------------------------- */

  (function onglets() {
    var racine = document.querySelector("[data-onglets]");
    if (!racine) return;

    var boutons = racine.querySelectorAll("[role=tab]");
    var curseur = racine.querySelector("[data-curseur]");

    function placerCurseur(bouton) {
      if (!curseur) return;
      curseur.style.width = bouton.offsetWidth + "px";
      curseur.style.transform = "translateX(" + bouton.offsetLeft + "px)";
    }

    function activer(bouton) {
      Array.prototype.forEach.call(boutons, function (b) {
        var actif = b === bouton;
        b.setAttribute("aria-selected", String(actif));
        b.tabIndex = actif ? 0 : -1;
        var panneau = document.getElementById(b.getAttribute("aria-controls"));
        if (!panneau) return;
        panneau.hidden = !actif;
        if (actif && !reduit) {
          panneau.classList.remove("entre");
          void panneau.offsetWidth;
          panneau.classList.add("entre");
        }
      });
      placerCurseur(bouton);
    }

    Array.prototype.forEach.call(boutons, function (bouton, i) {
      bouton.addEventListener("click", function () { activer(bouton); });
      bouton.addEventListener("keydown", function (e) {
        var suivant = null;
        if (e.key === "ArrowRight") suivant = boutons[(i + 1) % boutons.length];
        if (e.key === "ArrowLeft") suivant = boutons[(i - 1 + boutons.length) % boutons.length];
        if (e.key === "Home") suivant = boutons[0];
        if (e.key === "End") suivant = boutons[boutons.length - 1];
        if (!suivant) return;
        e.preventDefault();
        activer(suivant);
        suivant.focus();
      });
    });

    if (boutons.length) {
      requestAnimationFrame(function () { placerCurseur(boutons[0]); });
      window.addEventListener("resize", function () {
        var actif = racine.querySelector("[role=tab][aria-selected=true]");
        if (actif) placerCurseur(actif);
      });
    }
  })();

  /* --- Formulaire ---------------------------------------------------------- */

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

      var champs = form.querySelectorAll("input[required], textarea[required]");
      var premierInvalide = null;
      Array.prototype.forEach.call(champs, function (champ) {
        if (!verifier(champ) && !premierInvalide) premierInvalide = champ;
      });

      if (premierInvalide) {
        etatTexte.textContent = "Quelques champs demandent encore une precision.";
        etatTexte.className = "formulaire__etat est-erreur";
        premierInvalide.focus();
        return;
      }

      bouton.classList.add("est-occupe");
      libelle.textContent = "Ouverture de votre messagerie";
      etatTexte.textContent = "";
      etatTexte.className = "formulaire__etat";

      // Aucun serveur n'est branche sur cette maquette : le message part par
      // la messagerie du visiteur. Remplacer par un envoi vers le formulaire
      // du cabinet lors de la mise en ligne.
      window.setTimeout(function () {
        var donnees = new FormData(form);
        var corps =
          "Nom : " + donnees.get("nom") + "\n" +
          "Courriel : " + donnees.get("email") + "\n" +
          "Telephone : " + (donnees.get("telephone") || "non precise") + "\n" +
          "Objet : " + donnees.get("objet") + "\n\n" +
          donnees.get("message");

        window.location.href =
          "mailto:contact@babacarndiaye-avocat.sn?subject=" +
          encodeURIComponent("Demande : " + donnees.get("objet")) +
          "&body=" + encodeURIComponent(corps);

        bouton.classList.remove("est-occupe");
        libelle.textContent = "Envoyer la demande";
        etatTexte.textContent = "Votre message est pret dans votre messagerie. Il ne reste qu'a l'envoyer.";
        etatTexte.className = "formulaire__etat est-succes";
      }, 520);
    });
  })();

  /* --- Scene 3D : la feuille ------------------------------------------------ */

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
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0, 7.4);

    var groupe = new THREE.Group();
    scene.add(groupe);

    var uniforms = {
      uTime: { value: 0 },
      uPlie: { value: 0 },
      uPapier: { value: new THREE.Color(0xfdfbf7) },
      uOr: { value: new THREE.Color(0xb08a3e) },
      uOpacite: { value: 1 }
    };

    var vertex = [
      "uniform float uTime;",
      "uniform float uPlie;",
      "varying vec2 vUv;",
      "varying vec3 vNormalVue;",
      "vec3 forme(vec2 c) {",
      "  vec2 p = (c - 0.5) * vec2(3.5, 4.7);",
      "  float onde = sin(p.x * 1.45 + uTime * 0.55) * 0.17",
      "             + sin(p.y * 1.05 - uTime * 0.42) * 0.21",
      "             + sin((p.x + p.y) * 0.85 + uTime * 0.28) * 0.09;",
      "  onde *= mix(1.0, 1.35, uPlie);",
      "  float courbe = p.y * p.y * 0.03 * mix(1.0, -0.35, uPlie);",
      "  return vec3(p.x, p.y, onde + courbe);",
      "}",
      "void main() {",
      "  vUv = uv;",
      "  vec3 pos = forme(uv);",
      "  float e = 0.014;",
      "  vec3 dx = forme(uv + vec2(e, 0.0)) - pos;",
      "  vec3 dy = forme(uv + vec2(0.0, e)) - pos;",
      "  vec3 n = normalize(cross(dx, dy));",
      "  vNormalVue = normalize(normalMatrix * n);",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
      "}"
    ].join("\n");

    var fragment = [
      "uniform vec3 uPapier;",
      "uniform vec3 uOr;",
      "uniform float uOpacite;",
      "varying vec2 vUv;",
      "varying vec3 vNormalVue;",
      "void main() {",
      "  vec3 n = normalize(vNormalVue);",
      "  if (!gl_FrontFacing) n = -n;",
      "  vec3 lumiere = normalize(vec3(-0.32, 0.68, 0.66));",
      "  float diffus = clamp(dot(n, lumiere), 0.0, 1.0);",
      "  vec3 couleur = uPapier * (0.62 + diffus * 0.46);",
      // Lignes d'ecriture : le document, suggere et jamais lisible.
      "  float bande = fract(vUv.y * 34.0);",
      "  float rang = floor(vUv.y * 34.0);",
      "  float longueur = 0.52 + 0.34 * fract(sin(rang * 12.9898) * 43758.5453);",
      "  float trait = smoothstep(0.62, 0.5, bande) * smoothstep(0.34, 0.46, bande);",
      "  trait *= step(0.14, vUv.x) * step(vUv.x, longueur);",
      "  trait *= step(0.16, vUv.y) * step(vUv.y, 0.9);",
      "  couleur = mix(couleur, vec3(0.34, 0.38, 0.43), trait * 0.30);",
      // En-tete du document : un filet d'or, comme l'arc du logo.
      "  float entete = smoothstep(0.930, 0.926, vUv.y) * smoothstep(0.918, 0.922, vUv.y)",
      "               * step(0.14, vUv.x) * step(vUv.x, 0.5);",
      "  couleur = mix(couleur, uOr, entete * 0.85);",
      // Les stries verticales du logo, en marge.
      "  float stries = smoothstep(0.455, 0.5, abs(fract(vUv.x * 60.0) - 0.5));",
      "  couleur = mix(couleur, uOr, stries * 0.10 * smoothstep(0.9, 1.0, vUv.x));",
      // Filet d'or sur le pourtour.
      "  float bord = smoothstep(0.0, 0.006, vUv.x) * smoothstep(1.0, 0.994, vUv.x)",
      "             * smoothstep(0.0, 0.005, vUv.y) * smoothstep(1.0, 0.995, vUv.y);",
      "  couleur = mix(uOr * 0.95, couleur, bord);",
      // Reflet rasant.
      "  vec3 demi = normalize(lumiere + vec3(0.0, 0.0, 1.0));",
      "  float reflet = pow(clamp(dot(n, demi), 0.0, 1.0), 26.0);",
      "  couleur += uOr * reflet * 0.22;",
      "  gl_FragColor = vec4(couleur, uOpacite);",
      "}"
    ].join("\n");

    var feuille = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 56, 72),
      new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        transparent: true
      })
    );
    groupe.add(feuille);

    // L'arc du logo, en fil d'or, qui tourne lentement autour de la feuille.
    var arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.008, 6, 160, Math.PI * 0.9),
      new THREE.MeshBasicMaterial({ color: 0xb08a3e, transparent: true, opacity: 0.5 })
    );
    arc.rotation.z = Math.PI * 0.12;
    groupe.add(arc);

    function dimensionner() {
      var l = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(l, h, false);
      camera.aspect = l / h;
      camera.updateProjectionMatrix();

      var etroit = l < 900;
      groupe.position.x = etroit ? 0.4 : 2.05;
      decalageY = etroit ? -0.5 : 0;
      groupe.scale.setScalar(etroit ? 0.56 : 0.82);
      opaciteBase = etroit ? 0.2 : 1;
    }

    var opaciteBase = 1;
    var decalageY = 0;

    dimensionner();
    window.addEventListener("resize", dimensionner);

    var rotY = 0;
    var rotX = 0;

    return {
      canvas: canvas,
      pas: function (dt) {
        uniforms.uTime.value += dt;
        uniforms.uPlie.value = lerp(uniforms.uPlie.value, etat.heroSortie, 0.05);

        // La feuille s'efface des que le contenu prend la main.
        var recul = clamp(etat.heroSortie, 0, 1);
        uniforms.uOpacite.value = opaciteBase * (1 - recul * 0.88);
        arc.material.opacity = 0.5 * (1 - recul * 0.9);

        var cibleY = -0.34 + etat.pointeurLisseX * 0.26 + etat.heroSortie * 0.75;
        var cibleX = etat.pointeurLisseY * 0.16 - etat.heroSortie * 0.45;
        rotY = lerp(rotY, cibleY, 0.06);
        rotX = lerp(rotX, cibleX, 0.06);

        groupe.rotation.y = rotY;
        groupe.rotation.x = rotX;
        groupe.position.y = decalageY + etat.heroSortie * 1.1;

        arc.rotation.z += dt * 0.06;

        renderer.render(scene, camera);
      }
    };
  })();

  if (scene3d) {
    requestAnimationFrame(function () { scene3d.canvas.classList.add("est-prete"); });
  }

  /* --- Boucle unique -------------------------------------------------------- */

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
    majJauge();

    if (scene3d && !document.hidden) scene3d.pas(dt);

    requestAnimationFrame(boucle);
  }

  requestAnimationFrame(boucle);
})();
