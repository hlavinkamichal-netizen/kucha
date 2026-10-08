(function () {
  "use strict";
  var STORAGE = "kucharka_recipes_v1";
  var BASE_PORTIONS = 4;
  var CATS = ["all", "Hlavní chod", "Polévky", "Dezerty"];
  var FALLBACK = window.FALLBACK_IMAGE;
  var defaults = window.DEFAULT_RECIPES;

  var recipes = defaults.map(function (r) { return Object.assign({}, r); });
  var tab = "all", cat = "all", q = "";

  // Načtení uložených receptů
  try {
    var saved = localStorage.getItem(STORAGE);
    if (saved) {
      var parsed = JSON.parse(saved);
      var fixed = parsed.map(function (r) {
        var d = defaults.find(function (x) { return x.id === r.id; });
        return d && !String(r.image).startsWith("data:") ? Object.assign({}, r, { image: d.image }) : r;
      });
      var missing = defaults.filter(function (d) { return !parsed.some(function (r) { return r.id === d.id; }); });
      recipes = fixed.concat(missing);
    }
  } catch (e) {}

  function persist() { try { localStorage.setItem(STORAGE, JSON.stringify(recipes)); } catch (e) {} }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var catLabel = function (c) { return c === "all" ? "Vše" : c === "Hlavní chod" ? "Hlavní chody" : c; };

  var $list = document.getElementById("list");
  var $cats = document.getElementById("cats");
  var $modal = document.getElementById("modal");

  var ICON = {
    clock: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5v14"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.2 5.9 18.1 2.8a1.7 1.7 0 0 0-2.4 0L3 15.5V21h5.5L21.2 8.3a1.7 1.7 0 0 0 0-2.4Z"/></svg>',
    clock16: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
  };

  function imgFallback(img) { img.onerror = null; img.src = FALLBACK; }
  window.__imgFallback = imgFallback;

  function renderCats() {
    $cats.innerHTML = CATS.map(function (c) {
      return '<button data-cat="' + esc(c) + '" class="' + (cat === c ? "active" : "") + '">' + catLabel(c) + "</button>";
    }).join("");
  }

  function renderList() {
    var s = q.toLowerCase();
    var items = recipes.filter(function (r) {
      return (tab === "all" || r.favorite) &&
        (cat === "all" || r.category === cat) &&
        (!s || r.title.toLowerCase().indexOf(s) !== -1 || r.ingredients.some(function (i) { return i.toLowerCase().indexOf(s) !== -1; }));
    });
    if (!items.length) { $list.innerHTML = '<p class="empty">Nic jsme nenašli.</p>'; return; }
    $list.innerHTML = items.map(function (r) {
      return '<article class="card" data-id="' + esc(r.id) + '">' +
        '<div class="img"><img src="' + esc(r.image) + '" alt="' + esc(r.title) + '" loading="lazy" onerror="__imgFallback(this)">' +
        '<button class="heart ' + (r.favorite ? "on" : "") + '" data-fav="' + esc(r.id) + '" aria-label="Oblíbené">' + ICON.heart + "</button>" +
        '<span class="badge">' + esc(r.category) + "</span></div>" +
        '<div class="body"><h2>' + esc(r.title) + "</h2>" +
        '<div class="meta"><span>' + ICON.clock + r.time + " min</span><span>" + ICON.bag + r.ingredients.length + " surovin</span></div></div></article>";
    }).join("");
  }

  function render() { renderCats(); renderList(); }

  // Události
  document.getElementById("q").addEventListener("input", function (e) { q = e.target.value; renderList(); });
  $cats.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cat]"); if (!b) return;
    cat = b.getAttribute("data-cat"); render();
  });
  document.querySelector(".tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tab]"); if (!b) return;
    tab = b.getAttribute("data-tab");
    document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.toggle("active", x === b); });
    renderList();
  });
  $list.addEventListener("click", function (e) {
    var fav = e.target.closest("[data-fav]");
    if (fav) {
      e.stopPropagation();
      var id = fav.getAttribute("data-fav");
      recipes = recipes.map(function (r) { return r.id === id ? Object.assign({}, r, { favorite: !r.favorite }) : r; });
      persist(); renderList(); return;
    }
    var card = e.target.closest(".card");
    if (card) openDetail(card.getAttribute("data-id"));
  });
  document.getElementById("addBtn").addEventListener("click", function () { openForm(null); });

  // Modální okno
  function openModal(html) {
    $modal.innerHTML = '<div class="sheet">' + '<button class="close" aria-label="Zavřít">' + ICON.x + "</button>" + html + "</div>";
    $modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() { $modal.hidden = true; $modal.innerHTML = ""; document.body.style.overflow = ""; }
  $modal.addEventListener("click", function (e) {
    if (e.target === $modal || e.target.closest(".close")) closeModal();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$modal.hidden) closeModal(); });

  // Přepočet porcí
  function formatAmount(n) {
    var r = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
    return String(r).replace(".", ",");
  }
  function scaleIngredient(ing, factor) {
    if (factor === 1) return ing;
    return ing.replace(/^(\d+)\s*\/\s*(\d+)|^(\d+(?:[.,]\d+)?)/, function (m, a, b, c) {
      var val = a ? Number(a) / Number(b) : Number(String(c).replace(",", "."));
      return formatAmount(val * factor);
    });
  }

  function openDetail(id) {
    var r = recipes.find(function (x) { return x.id === id; });
    if (!r) return;
    var portions = BASE_PORTIONS, done = [];
    openModal("");
    var sheet = $modal.querySelector(".sheet");
    function draw() {
      var closeBtn = sheet.querySelector(".close");
      sheet.innerHTML = "";
      sheet.appendChild(closeBtn);
      var d = document.createElement("div");
      d.innerHTML =
        '<img src="' + esc(r.image) + '" alt="' + esc(r.title) + '" onerror="__imgFallback(this)">' +
        '<div class="pad"><div class="row"><h2>' + esc(r.title) + '</h2>' +
        '<button class="edit" data-act="edit">' + ICON.pencil + "Upravit</button></div>" +
        '<div class="sub"><span class="t">' + ICON.clock16 + r.time + " min</span>" +
        '<div class="stepper"><button data-act="minus" aria-label="Méně porcí">' + ICON.minus + "</button><b>" + portions + " porce</b>" +
        '<button data-act="plus" aria-label="Více porcí">' + ICON.plus + "</button></div></div>" +
        "<h3>Suroviny</h3><ul class=\"ings\">" +
        r.ingredients.map(function (ing, i) {
          var ck = done.indexOf(i) !== -1;
          return '<li><label><input type="checkbox" data-i="' + i + '"' + (ck ? " checked" : "") + '><span class="' + (ck ? "done" : "") + '">' +
            esc(scaleIngredient(ing, portions / BASE_PORTIONS)) + "</span></label></li>";
        }).join("") + "</ul>" +
        "<h3>Postup</h3><div class=\"steps\">" +
        r.instructions.split("\n").map(function (s) { return "<p>" + esc(s) + "</p>"; }).join("") + "</div></div>";
      while (d.firstChild) sheet.appendChild(d.firstChild);
    }
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "minus") { portions = Math.max(1, portions - 1); draw(); }
      else if (act === "plus") { portions++; draw(); }
      else if (act === "edit") { openForm(r); }
    });
    sheet.addEventListener("change", function (e) {
      var i = e.target.getAttribute && e.target.getAttribute("data-i");
      if (i === null || i === undefined) return;
      i = Number(i);
      done = done.indexOf(i) !== -1 ? done.filter(function (x) { return x !== i; }) : done.concat(i);
      draw();
    });
    draw();
  }

  // Formulář pro přidání / úpravu
  function openForm(initial) {
    var image = initial ? initial.image : "";
    var opt = function (c) { return "<option" + (initial && initial.category === c ? " selected" : "") + ">" + c + "</option>"; };
    openModal(
      '<form class="pad" id="rform"><h2>' + (initial ? "Upravit recept" : "Přidat nový recept") + "</h2>" +
      '<input class="field" name="title" required placeholder="Název receptu" value="' + (initial ? esc(initial.title) : "") + '">' +
      '<label class="photo" id="photo">' + (image ? '<img src="' + esc(image) + '" alt="Náhled">' : "Vybrat fotku") +
      '<input type="file" accept="image/*" id="file"></label>' +
      '<div class="two"><select class="field" name="category">' + opt("Hlavní chod") + opt("Polévky") + opt("Dezerty") + "</select>" +
      '<input class="field" name="time" type="number" min="1" placeholder="Čas (min)" value="' + (initial ? initial.time : "") + '"></div>' +
      '<input class="field" name="ingredients" required placeholder="Suroviny oddělené čárkou" value="' + (initial ? esc(initial.ingredients.join(", ")) : "") + '">' +
      '<textarea class="field" name="instructions" required rows="6" placeholder="Postup">' + (initial ? esc(initial.instructions) : "") + "</textarea>" +
      '<button class="save" type="submit">' + (initial ? "Uložit změny" : "Uložit recept") + "</button></form>"
    );
    var form = document.getElementById("rform");
    document.getElementById("file").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        image = String(rd.result);
        var box = document.getElementById("photo");
        var im = box.querySelector("img");
        if (!im) { box.firstChild.textContent = ""; im = document.createElement("img"); im.alt = "Náhled"; box.insertBefore(im, box.firstChild); }
        im.src = image;
      };
      rd.readAsDataURL(f);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var rec = {
        id: initial ? initial.id : String(Date.now()),
        title: String(f.get("title")),
        category: String(f.get("category")),
        time: Number(f.get("time")) || 30,
        image: image || FALLBACK,
        ingredients: String(f.get("ingredients")).split(",").map(function (s) { return s.trim(); }).filter(Boolean),
        instructions: String(f.get("instructions")),
        favorite: initial ? initial.favorite : false
      };
      recipes = initial
        ? recipes.map(function (x) { return x.id === rec.id ? rec : x; })
        : [rec].concat(recipes);
      persist(); closeModal(); renderList();
    });
  }

  render();
})();
