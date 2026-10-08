/* =========================================================
   NORSU CAMPUS MARKETPLACE — ABOUT, CAMPUS MAP, TERMS
   Navigation buttons (sidebar on desktop, bottom bar on phones).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const routes = {
    home: "../index.html",
    marketplace: "../marketplace/marketplace.html",
    post: "../post-item/post-item.html",
    favorites: "../favorites/favorites.html",
    messages: "../messages/messages.html",
    profile: "../profile/profile.html",
  };

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      if (routes[button.dataset.nav]) window.location.href = routes[button.dataset.nav];
    });
  });


  /* Campus Tour: show only the map. norsu.top lays out by its own
     width — a 256px sidebar from 1024px, 224px from 768px, and a
     69px top bar below that — so widen/raise the map by that much
     and let the frame hide it. */
  const frame = document.getElementById("mapFrame");
  if (frame) {
    const map = frame.querySelector("iframe");

    const fit = () => {
      const width = frame.clientWidth;
      let left = 0;
      let top = 0;

      if (width + 256 >= 1024) left = 256;
      else if (width + 224 >= 768) left = 224;
      else top = 69;

      map.style.left = `-${left}px`;
      map.style.top = `-${top}px`;
      map.style.width = `calc(100% + ${left}px)`;
      map.style.height = `calc(100% + ${top}px)`;
    };

    fit();
    new ResizeObserver(fit).observe(frame);
  }
});
