document.addEventListener("DOMContentLoaded",()=>{
  const products=[]; // every student's listings, loaded from the database (../products.js)
  const favoritesKey=CampusAuth.storageKey("campusMarketplaceFavorites"); // per account, see auth.js
  let favorites=JSON.parse(localStorage.getItem(favoritesKey)||"[]");
  let tab="all"; let query="";
  const list=document.getElementById("favoriteList"),empty=document.getElementById("emptyState"),count=document.getElementById("resultCount"),search=document.getElementById("favoriteSearch"),clear=document.getElementById("clearSearch"),toast=document.getElementById("toast");
  const money=n=>`₱${Number(n).toLocaleString("en-PH")}`;
  const escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1800)}
  function filtered(){return products.filter(p=>favorites.includes(p.id)).filter(p=>{const sold=String(p.status||"").toLowerCase()==="sold"; if(tab==="sale"&&sold)return false;if(tab==="sold"&&!sold)return false;if(!query)return true;const q=query.toLowerCase();return [p.name,p.category,p.location,p.seller].some(v=>String(v||"").toLowerCase().includes(q))})}
  function fallback(category){return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="100%" height="100%" fill="#f1f3f6"/><text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#1457d9">${escape(category)}</text></svg>`)}`}
  function render(){const items=filtered();count.textContent=`${items.length} ${items.length===1?"item":"items"}`;list.innerHTML="";empty.classList.toggle("hidden",items.length!==0);if(!items.length)return;items.forEach(p=>{const sold=String(p.status||"").toLowerCase()==="sold";const dateText=p.listedAgo?`Listed ${p.listedAgo}`:"";const card=document.createElement("article");card.className="favorite-card";card.dataset.id=p.id;card.innerHTML=`<div class="favorite-image-wrap"><img class="favorite-image" src="${escape(p.image||fallback(p.category))}" alt="${escape(p.name)}"></div><div class="favorite-info"><div class="favorite-name">${escape(p.name)}</div><div class="favorite-price">${money(p.price)}</div><div class="favorite-meta">⌖ ${escape(p.location||"Campus")}</div><div class="favorite-status-row"><span class="status ${sold?"sold":""}">${sold?"Sold":"For Sale"}</span><span class="saved-date">${dateText}</span></div></div><button class="remove-favorite" type="button" aria-label="Remove ${escape(p.name)}" data-remove="${p.id}">♡</button>`;card.querySelector("img").addEventListener("error",e=>e.currentTarget.src=fallback(p.category));list.appendChild(card)})}
  document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{tab=btn.dataset.tab;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b===btn));render()}));
  search.addEventListener("input",()=>{query=search.value;clear.classList.toggle("visible",!!query);render()});
  clear.addEventListener("click",()=>{search.value="";query="";clear.classList.remove("visible");render();search.focus()});
  list.addEventListener("click",e=>{const remove=e.target.closest("[data-remove]");if(!remove){const card=e.target.closest(".favorite-card");if(card)location.href=`../marketplace/marketplace.html?item=${encodeURIComponent(card.dataset.id)}`;return;}const id=Number(remove.dataset.remove);favorites=favorites.filter(x=>x!==id);localStorage.setItem(favoritesKey,JSON.stringify(favorites));render();showToast("Removed from favorites")});
  document.getElementById("browseButton").addEventListener("click",()=>location.href="../marketplace/marketplace.html");
  document.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>{const n=btn.dataset.nav;if(n==="home")location.href="../index.html";if(n==="marketplace")location.href="../marketplace/marketplace.html";if(n==="profile")location.href="../profile/profile.html";if(n==="messages")location.href="../messages/messages.html";if(n==="post")location.href="../post-item/post-item.html"}));
  count.textContent="Loading…";
  CampusCatalog.load().then(items=>{products.push(...items);render();},error=>{count.textContent="";list.innerHTML=`<p style="padding:30px 0;color:#667085;text-align:center">Items couldn't load. ${escape(error.message)}</p>`;});
});


