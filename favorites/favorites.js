document.addEventListener("DOMContentLoaded",()=>{
  const baseProducts=[
    {id:1,name:"Wireless Earbuds",price:1200,category:"Electronics",location:"Near Student Center",condition:"Used",seller:"Alex D.",rating:4.8,image:"https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80"},
    {id:2,name:"Mechanical Keyboard",price:1500,category:"Electronics",location:"Near Engineering",condition:"Used",seller:"Mark R.",rating:4.7,image:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80"},
    {id:3,name:"Chemistry Book",price:300,category:"Books",location:"Near Library",condition:"Used",seller:"Jamie C.",rating:4.9,image:"https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=700&q=80"},
    {id:4,name:"Nike Backpack",price:800,category:"Supplies",location:"Near Gate 2",condition:"Used",seller:"Chris M.",rating:4.6,image:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"},
    {id:5,name:"Gray Hoodie",price:400,category:"Uniforms",location:"Near Gate 3",condition:"Used",seller:"Taylor P.",rating:4.6,image:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80"},
    {id:6,name:"Scientific Calculator",price:600,category:"Supplies",location:"Near Library",condition:"Used",seller:"Sam L.",rating:4.7,image:"https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=700&q=80"},
    {id:7,name:"Casio FX-991ES Plus",price:500,category:"Supplies",location:"Near Library",condition:"Used",seller:"Jordan T.",rating:4.8,image:"https://images.unsplash.com/photo-1596495578061-4e5d5d4f1b8f?auto=format&fit=crop&w=700&q=80"},
    {id:8,name:"Calculus Textbook",price:230,category:"Books",location:"Near Engineering",condition:"Used",seller:"Pat G.",rating:4.7,image:"https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=80"}
  ];
  const saved=JSON.parse(localStorage.getItem("campusMarketplaceUserListings")||"[]");
  const products=[...baseProducts,...(Array.isArray(saved)?saved:[])];
  let favorites=JSON.parse(localStorage.getItem("campusMarketplaceFavorites")||"[]");
  let tab="all"; let query="";
  const list=document.getElementById("favoriteList"),empty=document.getElementById("emptyState"),count=document.getElementById("resultCount"),search=document.getElementById("favoriteSearch"),clear=document.getElementById("clearSearch"),toast=document.getElementById("toast");
  const money=n=>`₱${Number(n).toLocaleString("en-PH")}`;
  const escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1800)}
  function filtered(){return products.filter(p=>favorites.includes(p.id)).filter(p=>{const sold=String(p.status||"").toLowerCase()==="sold"; if(tab==="sale"&&sold)return false;if(tab==="sold"&&!sold)return false;if(!query)return true;const q=query.toLowerCase();return [p.name,p.category,p.location,p.seller].some(v=>String(v||"").toLowerCase().includes(q))})}
  function fallback(category){return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="100%" height="100%" fill="#f1f3f6"/><text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#1457d9">${escape(category)}</text></svg>`)}`}
  function render(){const items=filtered();count.textContent=`${items.length} ${items.length===1?"item":"items"}`;list.innerHTML="";empty.classList.toggle("hidden",items.length!==0);if(!items.length)return;items.forEach(p=>{const sold=String(p.status||"").toLowerCase()==="sold";const date=p.savedAt||p.createdAt||new Date().toISOString();const d=new Date(date);const dateText=Number.isNaN(d.getTime())?"Saved recently":`Saved ${d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;const card=document.createElement("article");card.className="favorite-card";card.dataset.id=p.id;card.innerHTML=`<div class="favorite-image-wrap"><img class="favorite-image" src="${escape(p.image||fallback(p.category))}" alt="${escape(p.name)}"></div><div class="favorite-info"><div class="favorite-name">${escape(p.name)}</div><div class="favorite-price">${money(p.price)}</div><div class="favorite-meta">⌖ ${escape(p.location||"Campus")}</div><div class="favorite-status-row"><span class="status ${sold?"sold":""}">${sold?"Sold":"For Sale"}</span><span class="saved-date">${dateText}</span></div></div><button class="remove-favorite" type="button" aria-label="Remove ${escape(p.name)}" data-remove="${p.id}">♡</button>`;card.querySelector("img").addEventListener("error",e=>e.currentTarget.src=fallback(p.category));list.appendChild(card)})}
  document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{tab=btn.dataset.tab;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b===btn));render()}));
  search.addEventListener("input",()=>{query=search.value;clear.classList.toggle("visible",!!query);render()});
  clear.addEventListener("click",()=>{search.value="";query="";clear.classList.remove("visible");render();search.focus()});
  list.addEventListener("click",e=>{const remove=e.target.closest("[data-remove]");if(!remove)return;const id=Number(remove.dataset.remove);favorites=favorites.filter(x=>x!==id);localStorage.setItem("campusMarketplaceFavorites",JSON.stringify(favorites));render();showToast("Removed from favorites")});
  document.getElementById("browseButton").addEventListener("click",()=>location.href="../marketplace/marketplace.html");
  document.getElementById("backButton").addEventListener("click",()=>history.length>1?history.back():location.href="../marketplace/marketplace.html");
  document.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>{const n=btn.dataset.nav;if(n==="home")location.href="../index.html";if(n==="marketplace")location.href="../marketplace/marketplace.html";if(n==="profile")location.href="../profile/profile.html";if(n==="post")location.href="../post-item/post-item.html"}));
  render();
});


