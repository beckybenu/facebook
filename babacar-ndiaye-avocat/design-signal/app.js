/* ==========================================================================
   Signal : interactions et nuage de points.
   Les particules sont echantillonnees depuis des dessins 2D (monogramme,
   continent, mot) puis interpolees d'une forme a l'autre au fil des sections.
   ========================================================================== */

(function () {
  "use strict";

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finPointeur = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function adouci(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var etat = {
    y: 0,
    progression: 0,
    pointeurX: 0,
    pointeurY: 0,
    pointeurLisseX: 0,
    pointeurLisseY: 0,
    pointeurBrutX: 0,
    pointeurBrutY: 0,
    pointeurActif: false
  };

  if (finPointeur && !reduit) {
    window.addEventListener("pointermove", function (e) {
      etat.pointeurActif = true;
      etat.pointeurBrutX = e.clientX;
      etat.pointeurBrutY = e.clientY;
      etat.pointeurX = (e.clientX / window.innerWidth) * 2 - 1;
      etat.pointeurY = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  /* --- Titre du hero ---------------------------------------------------------- */

  (function titre() {
    var lignes = document.querySelectorAll(".hero__titre .ligne > span");
    Array.prototype.forEach.call(lignes, function (span, i) {
      if (reduit) { span.style.transform = "none"; return; }
      span.style.transition = "transform 900ms cubic-bezier(0.16, 1, 0.3, 1) " + (120 + i * 110) + "ms";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { span.style.transform = "translateY(0)"; });
      });
    });
  })();

  /* --- Revelations -------------------------------------------------------------- */

  (function revelations() {
    var cibles = document.querySelectorAll("[data-reveal]");
    if (reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(cibles, function (el) { el.classList.add("est-vu"); });
      return;
    }
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        var voisins = e.target.parentElement.querySelectorAll("[data-reveal]");
        var rang = Array.prototype.indexOf.call(voisins, e.target);
        e.target.style.transitionDelay = clamp(rang, 0, 5) * 70 + "ms";
        e.target.classList.add("est-vu");
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.14 });
    Array.prototype.forEach.call(cibles, function (el) { obs.observe(el); });
  })();

  /* --- Manifeste : les mots s'allument a la lecture ------------------------------- */

  var manifeste = document.querySelector("[data-mots]");
  var motsManifeste = [];

  (function decouperManifeste() {
    if (!manifeste) return;
    var texte = manifeste.textContent.trim().replace(/\s+/g, " ");
    manifeste.textContent = "";
    texte.split(" ").forEach(function (mot, i, tab) {
      var span = document.createElement("span");
      span.className = "mot" + (/d[eé]cision/i.test(mot) ? " mot--or" : "");
      span.textContent = mot;
      manifeste.appendChild(span);
      if (i < tab.length - 1) manifeste.appendChild(document.createTextNode(" "));
      motsManifeste.push(span);
    });
    if (reduit) {
      motsManifeste.forEach(function (m) { m.classList.add("est-lu"); });
    }
  })();

  function majManifeste() {
    if (!manifeste || reduit || !motsManifeste.length) return;
    var r = manifeste.getBoundingClientRect();
    var debut = window.innerHeight * 0.86;
    var fin = window.innerHeight * 0.28;
    var p = clamp((debut - r.top) / Math.max(debut - fin + r.height * 0.55, 1), 0, 1);
    var seuil = Math.floor(p * motsManifeste.length * 1.08);
    for (var i = 0; i < motsManifeste.length; i++) {
      motsManifeste[i].classList.toggle("est-lu", i < seuil);
    }
  }

  /* --- Entete, progression, lien actif --------------------------------------------- */

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
      if (y > dernierY + 4 && y > 280) entete.classList.add("est-cachee");
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
    Array.prototype.forEach.call(liensNav, function (l) {
      l.classList.toggle("est-active", l === actif);
    });
  }

  /* --- Menu mobile ------------------------------------------------------------------ */

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

  /* --- Domaines : suivi du domaine lu ------------------------------------------------ */

  (function domaines() {
    var elements = document.querySelectorAll("[data-domaine]");
    var nom = document.querySelector("[data-actif]");
    var compte = document.querySelector("[data-compte]");
    if (!elements.length) return;

    if (reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(elements, function (el) { el.classList.add("est-actif"); });
      return;
    }

    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        e.target.classList.toggle("est-actif", e.isIntersecting);
        if (e.isIntersecting) {
          var rang = Array.prototype.indexOf.call(elements, e.target);
          if (nom) nom.textContent = e.target.getAttribute("data-nom");
          if (compte) compte.textContent = String(rang + 1);
        }
      });
    }, { rootMargin: "-42% 0px -42% 0px" });

    Array.prototype.forEach.call(elements, function (el) { obs.observe(el); });
  })();

  /* --- Chemin de la methode ----------------------------------------------------------- */

  var chemin = document.querySelector("[data-chemin]");

  (function etapes() {
    var elements = document.querySelectorAll("[data-etape-item]");
    if (!elements.length || reduit || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(elements, function (el) { el.classList.add("est-atteinte"); });
      return;
    }
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("est-atteinte");
      });
    }, { rootMargin: "0px 0px -45% 0px" });
    Array.prototype.forEach.call(elements, function (el) { obs.observe(el); });
  })();

  function majChemin() {
    if (!chemin) return;
    var r = chemin.getBoundingClientRect();
    var p = clamp((window.innerHeight * 0.62 - r.top) / Math.max(r.height, 1), 0, 1);
    chemin.style.setProperty("--avancee", p.toFixed(4));
  }

  /* --- Boutons aimantes ---------------------------------------------------------------- */

  var aimants = [];

  (function preparerAimants() {
    if (!finPointeur || reduit) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-aimant]"), function (el) {
      aimants.push({ el: el, x: 0, y: 0 });
    });
  })();

  function majAimants() {
    for (var i = 0; i < aimants.length; i++) {
      var a = aimants[i];
      var r = a.el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var dx = etat.pointeurBrutX - cx;
      var dy = etat.pointeurBrutY - cy;
      var distance = Math.sqrt(dx * dx + dy * dy);
      var portee = 120;
      var force = distance < portee ? 1 - distance / portee : 0;
      a.x = lerp(a.x, dx * force * 0.28, 0.16);
      a.y = lerp(a.y, dy * force * 0.28, 0.16);
      a.el.style.transform =
        Math.abs(a.x) < 0.05 && Math.abs(a.y) < 0.05
          ? ""
          : "translate(" + a.x.toFixed(2) + "px," + a.y.toFixed(2) + "px)";
    }
  }

  /* --- Formulaire ------------------------------------------------------------------------ */

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
        function (champ) { if (!verifier(champ) && !premierInvalide) premierInvalide = champ; }
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

  /* --- Nuage de points --------------------------------------------------------------------- */

  var scene3d = null;

  function construireScene() {
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
    var hauteur = 2.8;
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 3;

    var NB = window.innerWidth < 900 ? 3200 : 6400;
    var TAILLE_DESSIN = 260;
    var ETENDUE = 2.3;

    // Echantillonnage : on dessine la forme en 2D puis on tire des points dedans.
    function echantillonner(dessin) {
      var c = document.createElement("canvas");
      c.width = TAILLE_DESSIN;
      c.height = TAILLE_DESSIN;
      var ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#000";
      dessin(ctx, TAILLE_DESSIN);

      var donnees = ctx.getImageData(0, 0, TAILLE_DESSIN, TAILLE_DESSIN).data;
      var pixels = [];
      for (var y = 0; y < TAILLE_DESSIN; y++) {
        for (var x = 0; x < TAILLE_DESSIN; x++) {
          if (donnees[(y * TAILLE_DESSIN + x) * 4 + 3] > 120) pixels.push(x + y * TAILLE_DESSIN);
        }
      }

      var sortie = new Float32Array(NB * 3);
      for (var i = 0; i < NB; i++) {
        if (pixels.length) {
          var p = pixels[(Math.random() * pixels.length) | 0];
          var px = p % TAILLE_DESSIN;
          var py = (p / TAILLE_DESSIN) | 0;
          sortie[i * 3] = (px / TAILLE_DESSIN - 0.5) * ETENDUE;
          sortie[i * 3 + 1] = -(py / TAILLE_DESSIN - 0.5) * ETENDUE;
        } else {
          sortie[i * 3] = (Math.random() - 0.5) * ETENDUE;
          sortie[i * 3 + 1] = (Math.random() - 0.5) * ETENDUE;
        }
        sortie[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
      }
      return sortie;
    }

    function texteCentre(ctx, t, police, taille, largeurMax) {
      ctx.save();
      ctx.font = police;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var mesure = ctx.measureText(t).width;
      var facteur = mesure > 0 ? Math.min(1, largeurMax / mesure) : 1;
      ctx.translate(taille / 2, taille / 2);
      ctx.scale(facteur, facteur);
      ctx.fillText(t, 0, 0);
      ctx.restore();
    }

    // Le contour du continent, identique a celui du logo.
    // Coordonnees normalisees : x de 17 degres ouest a 51 est, y de 37 nord a 35 sud.
    var AFRIQUE = [
      [0.400, 0.000], [0.690, 0.083], [0.730, 0.097], [0.790, 0.210], [0.820, 0.310],
      [0.880, 0.350], [1.000, 0.354], [0.910, 0.486], [0.840, 0.570], [0.830, 0.610],
      [0.850, 0.736], [0.735, 0.875], [0.710, 0.930], [0.544, 0.997], [0.522, 0.986],
      [0.463, 0.826], [0.426, 0.722], [0.440, 0.639], [0.426, 0.597], [0.386, 0.514],
      [0.390, 0.458], [0.330, 0.454], [0.265, 0.430], [0.250, 0.437], [0.190, 0.440],
      [0.090, 0.426], [0.048, 0.382], [0.000, 0.310], [0.015, 0.264], [0.044, 0.180],
      [0.109, 0.092], [0.138, 0.047], [0.165, 0.017], [0.294, 0.003]
    ];

    var formes = {
      monogramme: echantillonner(function (ctx, taille) {
        texteCentre(ctx, "BN", '600 190px "Bodoni Moda", Georgia, serif', taille, taille * 0.82);
      }),
      nuage: echantillonner(function () { /* aucun dessin : dispersion */ }),
      afrique: echantillonner(function (ctx, taille) {
        var cote = taille * 0.92;
        var x0 = (taille - cote) / 2;
        var y0 = (taille - cote) / 2;

        ctx.beginPath();
        AFRIQUE.forEach(function (p, i) {
          var px = x0 + p[0] * cote;
          var py = y0 + p[1] * cote;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();

        // Madagascar
        ctx.save();
        ctx.translate(x0 + 0.934 * cote, y0 + 0.778 * cote);
        ctx.rotate(-0.21);
        ctx.beginPath();
        ctx.ellipse(0, 0, cote * 0.035, cote * 0.097, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }),
      // L'arc du logo, trace en grand.
      arc: echantillonner(function (ctx, taille) {
        ctx.strokeStyle = "#000";
        ctx.lineCap = "round";
        ctx.lineWidth = taille * 0.055;
        ctx.beginPath();
        ctx.moveTo(taille * 0.06, taille * 0.66);
        ctx.bezierCurveTo(
          taille * 0.24, taille * 0.2,
          taille * 0.74, taille * 0.14,
          taille * 0.94, taille * 0.5
        );
        ctx.stroke();
      }),
      impact: echantillonner(function (ctx, taille) {
        texteCentre(ctx, "IMPACT", '800 120px "Syne", Arial, sans-serif', taille, taille * 0.92);
      })
    };

    var geometrie = new THREE.BufferGeometry();
    var depart = new Float32Array(formes.monogramme);
    var arrivee = new Float32Array(formes.monogramme);
    var alea = new Float32Array(NB * 3);
    for (var i = 0; i < NB; i++) {
      alea[i * 3] = Math.random();
      alea[i * 3 + 1] = Math.random();
      alea[i * 3 + 2] = Math.random();
    }

    geometrie.setAttribute("position", new THREE.BufferAttribute(depart, 3));
    geometrie.setAttribute("aArrivee", new THREE.BufferAttribute(arrivee, 3));
    geometrie.setAttribute("aAlea", new THREE.BufferAttribute(alea, 3));

    var uniforms = {
      uMorph: { value: 1 },
      uTemps: { value: 0 },
      uTaille: { value: 3.2 },
      uSouris: { value: new THREE.Vector2(99, 99) },
      uEncre: { value: new THREE.Color(0x11100e) },
      uOr: { value: new THREE.Color(0xb08a3e) },
      uOpacite: { value: 0.62 }
    };

    var matiere = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: [
        "attribute vec3 aArrivee;",
        "attribute vec3 aAlea;",
        "uniform float uMorph;",
        "uniform float uTemps;",
        "uniform float uTaille;",
        "uniform vec2 uSouris;",
        "varying float vAlea;",
        "void main() {",
        "  vec3 p = mix(position, aArrivee, uMorph);",
        "  p.x += sin(uTemps * 0.7 + aAlea.x * 6.283) * 0.014;",
        "  p.y += cos(uTemps * 0.62 + aAlea.y * 6.283) * 0.014;",
        "  vec2 d = p.xy - uSouris;",
        "  float distance = length(d);",
        "  p.xy += normalize(d + vec2(0.0001)) * smoothstep(0.46, 0.0, distance) * 0.3;",
        "  vAlea = aAlea.z;",
        "  gl_PointSize = uTaille * (0.55 + aAlea.z * 0.95);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uEncre;",
        "uniform vec3 uOr;",
        "uniform float uOpacite;",
        "varying float vAlea;",
        "void main() {",
        "  vec2 c = gl_PointCoord - 0.5;",
        "  float d = dot(c, c);",
        "  if (d > 0.25) discard;",
        "  float a = smoothstep(0.25, 0.05, d);",
        "  vec3 couleur = mix(uEncre, uOr, step(0.7, vAlea));",
        "  gl_FragColor = vec4(couleur, a * uOpacite * (0.45 + vAlea * 0.55));",
        "}"
      ].join("\n")
    });

    var points = new THREE.Points(geometrie, matiere);
    scene.add(points);

    var formeCourante = "monogramme";
    var transition = null;

    function versForme(nom) {
      if (!formes[nom] || nom === formeCourante) return;

      // On fige la position interpolee courante avant de repartir.
      var pos = geometrie.attributes.position.array;
      var arr = geometrie.attributes.aArrivee;
      var m = uniforms.uMorph.value;
      for (var i = 0; i < pos.length; i++) {
        pos[i] = pos[i] + (arr.array[i] - pos[i]) * m;
      }
      geometrie.attributes.position.needsUpdate = true;

      var cible = formes[nom];
      for (var j = 0; j < arr.array.length; j++) arr.array[j] = cible[j];
      arr.needsUpdate = true;

      uniforms.uMorph.value = 0;
      transition = { debut: performance.now(), duree: 1100 };
      formeCourante = nom;
    }

    function dimensionner() {
      var l = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(l, h, false);
      var aspect = l / h;
      camera.left = (-hauteur * aspect) / 2;
      camera.right = (hauteur * aspect) / 2;
      camera.top = hauteur / 2;
      camera.bottom = -hauteur / 2;
      camera.updateProjectionMatrix();
      uniforms.uTaille.value = l < 900 ? 2.2 : 3.2;
      uniforms.uOpacite.value = l < 900 ? 0.26 : 0.38;

      // Le nuage se tient sur le cote laisse libre par le texte.
      etroitEcran = l < 1080;
      points.scale.setScalar(etroitEcran ? 0.62 : 0.76);
      decalage = etroitEcran ? 0.1 : 0.16;
    }

    var decalage = 0.16;
    var etroitEcran = false;
    var cote = 0;
    var coteLisse = 0;

    dimensionner();
    window.addEventListener("resize", dimensionner);

    return {
      canvas: canvas,
      versForme: versForme,
      versCote: function (valeur) { cote = valeur; },
      pas: function (dt) {
        coteLisse = lerp(coteLisse, etroitEcran ? 0 : cote, 0.045);
        points.position.x = coteLisse * camera.right * 0.5;
        uniforms.uTemps.value += dt;

        if (transition) {
          var t = clamp((performance.now() - transition.debut) / transition.duree, 0, 1);
          uniforms.uMorph.value = adouci(t);
          if (t >= 1) transition = null;
        }

        var aspect = window.innerWidth / window.innerHeight;
        if (etat.pointeurActif) {
          // Le pointeur repousse les particules : on le ramene dans le repere du nuage.
          var f = points.scale.x || 1;
          uniforms.uSouris.value.set(
            (etat.pointeurLisseX * ((hauteur * aspect) / 2) - points.position.x) / f,
            (etat.pointeurLisseY * (hauteur / 2) - points.position.y) / f
          );
        } else {
          uniforms.uSouris.value.set(999, 999);
        }

        points.rotation.z = etat.pointeurLisseX * 0.03;
        points.position.y =
          decalage - etat.progression * 0.2 - 0.26 * clamp(-coteLisse, 0, 1);

        renderer.render(scene, camera);
      }
    };
  }

  /* --- Les sections commandent la forme ------------------------------------------------------ */

  var etapesForme = [];
  var formeAffichee = "monogramme";

  function brancherFormes() {
    etapesForme = Array.prototype.slice.call(document.querySelectorAll("[data-etape]"));
  }

  // La forme suit la section dont le centre est le plus proche du centre de l'ecran.
  function majForme() {
    if (!scene3d || !etapesForme.length) return;
    var milieu = window.innerHeight / 2;
    var meilleure = null;
    var ecartMin = Infinity;

    for (var i = 0; i < etapesForme.length; i++) {
      var r = etapesForme[i].getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      var ecart = Math.abs(r.top + r.height / 2 - milieu);
      if (ecart < ecartMin) {
        ecartMin = ecart;
        meilleure = etapesForme[i];
      }
    }

    if (!meilleure) return;
    var nom = meilleure.getAttribute("data-etape");
    if (nom === formeAffichee) return;
    formeAffichee = nom;
    scene3d.versForme(nom);
    scene3d.versCote(meilleure.getAttribute("data-cote") === "gauche" ? -1 : 1);
  }

  function demarrerScene() {
    scene3d = construireScene();
    if (!scene3d) return;
    brancherFormes();
    requestAnimationFrame(function () { scene3d.canvas.classList.add("est-prete"); });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(demarrerScene, demarrerScene);
  } else {
    demarrerScene();
  }

  /* --- Boucle unique --------------------------------------------------------------------------- */

  var dernierTemps = performance.now();

  function boucle(maintenant) {
    var dt = Math.min((maintenant - dernierTemps) / 1000, 0.05);
    dernierTemps = maintenant;

    etat.y = window.scrollY || window.pageYOffset || 0;
    var course = document.documentElement.scrollHeight - window.innerHeight;
    etat.progression = course > 0 ? clamp(etat.y / course, 0, 1) : 0;

    etat.pointeurLisseX = lerp(etat.pointeurLisseX, etat.pointeurX, 0.07);
    etat.pointeurLisseY = lerp(etat.pointeurLisseY, etat.pointeurY, 0.07);

    majEntete();
    majManifeste();
    majChemin();
    majAimants();
    majForme();

    if (scene3d && !document.hidden) scene3d.pas(dt);

    requestAnimationFrame(boucle);
  }

  requestAnimationFrame(boucle);
})();
