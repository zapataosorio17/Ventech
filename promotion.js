(function () {
  fetch("http://localhost:5097/api/promotion")
    .then(function (r) {
      return r.status === 204 ? null : r.json();
    })
    .then(function (p) {
      if (!p) return;
      var art = document.getElementById("promoArt");
      if (art && p.image) {
        art.classList.add("promo-image");
        art.style.background = 'center/cover no-repeat url("' + p.image + '")';
        art.innerHTML = "";
      }
      var title = document.getElementById("heroTitle"),
        text = document.getElementById("heroText");
      if (title && p.title) title.textContent = p.title;
      if (text && p.text) text.textContent = p.text;
    })
    .catch(function () {});
})();
