document.addEventListener("DOMContentLoaded",()=>{
 const toast=document.getElementById("toast");
 const listings=JSON.parse(localStorage.getItem("campusMarketplaceListings")||"[]");
 const favorites=JSON.parse(localStorage.getItem("campusMarketplaceFavorites")||"[]");
 const name=localStorage.getItem("campusMarketplaceName")||"Campus Student";
 const email=localStorage.getItem("campusMarketplaceUser")||"student@campus.edu";
 const location=localStorage.getItem("campusMarketplaceLocation")||"Campus";
 const join=localStorage.getItem("campusMarketplaceJoinDate")||"2024";
 const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"ME";
 document.getElementById("profileName").textContent=name;document.getElementById("profileEmail").textContent=email;document.getElementById("profileLocation").textContent=location;document.getElementById("joinDate").textContent=join;document.getElementById("avatar").textContent=initials;document.getElementById("favoriteCount").textContent=favorites.length;document.getElementById("soldCount").textContent=listings.filter(x=>String(x.status||"").toLowerCase()==="sold").length;
 function show(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(show.t);show.t=setTimeout(()=>toast.classList.remove("show"),1800)}
 document.getElementById("backButton").addEventListener("click",()=>history.length>1?history.back():location.href="../index.html");
 document.getElementById("settingsButton").addEventListener("click",()=>show("Settings coming next"));
 document.getElementById("viewId").addEventListener("click",()=>show("Student ID verification is active"));
 document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.action;if(a==="favorites")location.href="../favorites/favorites.html";else if(a==="listings")show("My Listings coming next");else if(a==="sold")show("Sold Items coming next");else if(a==="analytics")show("Sales Analytics coming next");else if(a==="bought")show("No purchases yet");else if(a==="messages")show("No messages yet");else show(`${a[0].toUpperCase()+a.slice(1)} settings coming next`)}));
 document.getElementById("signOut").addEventListener("click",()=>{localStorage.removeItem("campusMarketplaceName");localStorage.removeItem("campusMarketplaceUser");show("Signed out");setTimeout(()=>location.href="../login/login.html",450)});
 document.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>{const n=btn.dataset.nav;if(n==="home")location.href="../index.html";if(n==="marketplace")location.href="../marketplace/marketplace.html";if(n==="favorites")location.href="../favorites/favorites.html";if(n==="post")location.href="../marketplace/marketplace.html?post=1"}));
});


/* Unified navigation post action */
(function campusNavPostHandler(){
  const post = document.querySelector('.sell-button, .add-button');
  if (!post) return;
  post.addEventListener('click', function(e){
    if (this.id === 'sellButton' && this.closest('.bottom-nav') && window.location.pathname.includes('/marketplace/')) {
      e.preventDefault();
    }
    const target = this.dataset.nav || 'post';
    if (target === 'post' && !this.closest('[data-post-bound]')) {
      const modal = document.getElementById('modalBackdrop');
      if (modal) { modal.hidden = false; modal.classList.add('show'); return; }
      if (window.location.pathname.includes('/marketplace/')) { window.scrollTo({top:0,behavior:'smooth'}); }
      else window.location.href = 'marketplace/marketplace.html?post=1';
    }
  });
})();
