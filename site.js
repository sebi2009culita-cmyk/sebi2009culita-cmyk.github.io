/* Scriptul site-ului (interacțiuni și animații), încărcat de app/layout.tsx. */
(function(){
  /* blocuri comune ale subpaginilor (ședințe, întrebări, avantaje, programare) */
  Array.prototype.forEach.call(document.querySelectorAll("[data-include]"),function(slot){
    var t=document.getElementById(slot.getAttribute("data-include"));
    if(t)slot.replaceWith(t.content.cloneNode(true));
  });

  /* Două moduri:
     - fișierul de lucru (amazingskin-redesign.html): subpaginile se deschid pe hash (#epilare-axile, #criolipoliza…), restul hash-urilor sunt ancore pe pagina principală;
     - site-ul generat de build.py (<html data-mpa>): fiecare subpagină e fișierul ei, cu adresă proprie. */
  var MPA=document.documentElement.hasAttribute("data-mpa");
  var home=(document.querySelector("[data-home]")||document.getElementById("acasa")),views=document.querySelectorAll("[data-view]"),current=null;
  function closeMenus(){
    Array.prototype.forEach.call(document.querySelectorAll(".dd.open"),function(d){d.classList.remove("open");d.firstElementChild.setAttribute("aria-expanded","false")});
  }
  /* SEO: fiecare subpagină își pune titlul, descrierea și adresa canonică */
  document.documentElement.lang="ro";
  var seo={title:document.title,desc:(document.querySelector('meta[name="description"]')||{}).content};
  function setMeta(sel,attr,val){var m=document.querySelector(sel);if(m)m.setAttribute(attr,val)}
  function applySeo(view){
    if(MPA)return; /* pe site-ul generat, title, descrierea și canonicalul sunt deja în <head> */
    var t=(view&&view.getAttribute("data-title"))||seo.title,d=(view&&view.getAttribute("data-desc"))||seo.desc;
    var u="https://amazingskin.ro/"+(view?"#"+view.id:"");
    document.title=t;
    setMeta('meta[name="description"]',"content",d);
    setMeta('meta[property="og:title"]',"content",t);
    setMeta('meta[property="og:description"]',"content",d);
    setMeta('meta[property="og:url"]',"content",u);
    setMeta('link[rel="canonical"]',"href",u);
  }
  function route(){
    var h=decodeURIComponent(location.hash.slice(1)),el=h?document.getElementById(h):null;
    var view=el&&el.hasAttribute("data-view")?el:null;
    if(MPA){
      /* o singură subpagină în fișier (sau niciuna, pe pagina principală): ancorele (#programare…) le derulează browserul */
      view=views[0]||null;
      if(route.done){closeMenus();return}
      route.done=true;el=null;
    }else{
      applySeo(view);
      Array.prototype.forEach.call(views,function(v){v.hidden=v!==view});
      home.hidden=!!view;
    }
    closeMenus();
    /* Bacău și Iași au alt număr: butoanele de sunat fixe (bula și bara de jos) îl folosesc pe acela cât ești pe pagina lor */
    var tel=(view&&view.getAttribute("data-tel"))||"+40732787118",num=tel==="+40742157752"?"0742 157 752":"0732 787 118";
    Array.prototype.forEach.call(document.querySelectorAll(".fab-call,.bar-call,.top .phone"),function(a){a.href="tel:"+tel});
    var topPhone=document.querySelector(".top .phone");if(topPhone)topPhone.textContent=num;
    var fabNum=document.querySelector(".fab-call .num");if(fabNum)fabNum.textContent=num;
    var barCall=document.querySelector(".bar-call");if(barCall)barCall.setAttribute("aria-label","Sună la "+num);
    if(view){
      current=view;
      var city=view.getAttribute("data-city");if(city)setCity(city);
      var m=view.getAttribute("data-msg"),fm=document.getElementById("f-msg");
      if(m&&fm&&(!fm.value||fm.value===route.auto)){fm.value=m;route.auto=m}
      if(MPA)return;
      window.scrollTo(0,0);
      var h1=view.querySelector("h1");if(h1){h1.setAttribute("tabindex","-1");h1.focus({preventScroll:true})}
    }else if(MPA){return}else{
      current=null;
      if(el&&h!=="acasa")requestAnimationFrame(function(){el.scrollIntoView()});
      else window.scrollTo(0,0);
    }
  }
  var an=document.getElementById("an-curent");if(an)an.textContent=new Date().getFullYear();
  /* fișierul de lucru: schimbarea între subpagini (#hash) trece prin aceeași cortină ca site-ul generat;
     ancorele de pe pagina principală (#preturi…) doar derulează */
  window.addEventListener("hashchange",function(){
    var h=decodeURIComponent(location.hash.slice(1)),el=h?document.getElementById(h):null;
    var toView=!!(el&&el.hasAttribute("data-view"));
    if(!MPA&&cortinaEl&&(toView||current))cortinaAcopera(function(){route();setTimeout(cortinaDescopera,150)});else route();
  });
  /* la încărcare pornim mereu de sus: browserul nu mai reține poziția, iar o ancoră de pe pagina principală (#programare, #preturi…) rămasă în adresă e ștearsă.
     Subpaginile (#clinica-iasi, #termeni-si-conditii…) se deschid normal.
     Pe site-ul generat, ancora se păstrează când vii de pe altă pagină (de ex. „Programează-te” de pe o pagină de zonă duce la /#programare) și se șterge doar la reîncărcare. */
  if("scrollRestoration" in history)history.scrollRestoration="manual";
  var navType=((performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||{}).type;
  function anchorTarget(){var h=decodeURIComponent(location.hash.slice(1)),el=h?document.getElementById(h):null;return el&&!el.hasAttribute("data-view")?el:null}
  (function(){
    var h=decodeURIComponent(location.hash.slice(1)),el=h?document.getElementById(h):null;
    if(h&&!(el&&el.hasAttribute("data-view"))&&(!MPA||navType==="reload"||!el)){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
  })();
  route();
  var landing=MPA&&anchorTarget();
  if(landing)requestAnimationFrame(function(){landing.scrollIntoView()});else window.scrollTo(0,0);
  window.addEventListener("load",function(){
    if(MPA){var t=anchorTarget();if(t)t.scrollIntoView();else if(!location.hash)window.scrollTo(0,0);return}
    var v=document.querySelector("[data-view]:not([hidden])");if(!location.hash||v)window.scrollTo(0,0);
  });

  /* ===== Cortina dintre pagini (ecran de încărcare) =====
     Site-ul generat: un click pe un link spre altă pagină trage cortina, apoi deschide pagina; pe pagina nouă cortina pornește trasă
     și se ridică după încărcare (cel puțin 350 ms, ca logo-ul să se vadă; cel mult 1,5 s, ca imaginile lente să nu o țină). */
  var cortinaEl=document.querySelector(".cortina"),KEYC="as-cortina",motionOff=matchMedia("(prefers-reduced-motion: reduce)"),cortinaRezerva=0;
  function cortinaAcopera(done){
    if(!cortinaEl){done();return}
    cortinaEl.classList.remove("iese");void cortinaEl.offsetWidth;cortinaEl.classList.add("intra");
    setTimeout(done,motionOff.matches?240:700);
  }
  function cortinaDescopera(){
    if(!cortinaEl)return;
    clearTimeout(cortinaRezerva);
    cortinaEl.classList.add("intra");document.documentElement.classList.remove("cortina-on");
    void cortinaEl.offsetWidth;cortinaEl.classList.add("iese");
    window.dispatchEvent(new Event("cortina-iese"));
    setTimeout(function(){cortinaEl.classList.remove("intra","iese")},motionOff.matches?380:900);
  }
  if(MPA&&cortinaEl){
    if(document.documentElement.classList.contains("cortina-on")){
      try{sessionStorage.removeItem(KEYC)}catch(e){}
      var cortinaT0=performance.now(),cortinaGata=false;
      var cortinaDeschide=function(){
        if(cortinaGata)return;cortinaGata=true;
        setTimeout(function(){requestAnimationFrame(cortinaDescopera)},Math.max(0,350-(performance.now()-cortinaT0)));
      };
      if(document.readyState==="complete")cortinaDeschide();else window.addEventListener("load",cortinaDeschide,{once:true});
      setTimeout(cortinaDeschide,1500);
    }
    document.addEventListener("click",function(e){
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest("a[href]");
      if(!a||(a.target&&a.target!=="_self")||a.hasAttribute("download"))return;
      var u=new URL(a.href,location.href);
      if(u.origin!==location.origin||(u.pathname===location.pathname&&u.search===location.search))return; /* alt site sau ancoră pe aceeași pagină */
      e.preventDefault();
      try{sessionStorage.setItem(KEYC,"1")}catch(x){}
      cortinaAcopera(function(){location.href=u.href});
      /* dacă navigarea nu pornește (oprită din browser), cortina se ridică singură */
      cortinaRezerva=setTimeout(function(){try{sessionStorage.removeItem(KEYC)}catch(x){}cortinaDescopera()},10000);
    });
    /* înapoi / înainte din cache-ul browserului: pagina revine cu cortina trasă, așa că o ridicăm */
    window.addEventListener("pagehide",function(){clearTimeout(cortinaRezerva)});
    window.addEventListener("pageshow",function(e){if(e.persisted&&cortinaEl.classList.contains("intra"))cortinaDescopera()});
  }

  /* Fundalul din hero: pozele se schimbă la ~6 s; dacă build.py a găsit videoclipuri (data-videos), le redă pe rând,
     cu trecere lină între ele, iar pozele rămân dedesubt cât se încarcă. Pauză din buton, când hero-ul iese de pe ecran
     sau când tabul nu e vizibil; cu „mișcare redusă” sau „economisire date” rămâne prima poză. */
  (function(){
    var hero=document.querySelector(".hero"),film=hero&&hero.querySelector(".hero-film");if(!film)return;
    var slides=film.querySelectorAll(".hf-slide"),btn=hero.querySelector(".hf-pauza");
    var still=matchMedia("(prefers-reduced-motion: reduce)").matches,saveData=!!(navigator.connection&&navigator.connection.saveData);
    var i=0,timer=0,paused=false,onScreen=true,STEP=6000;
    var list=(film.getAttribute("data-videos")||"").split(",").filter(Boolean),vids=[],cur=0,vi=0,usingVideo=false;
    function running(){return !paused&&onScreen&&!document.hidden&&!still}
    function show(k){
      var prev=slides[i];i=k%slides.length;var next=slides[i];if(prev===next)return;
      prev.classList.remove("is-on");prev.classList.add("is-out");next.classList.remove("is-out");next.classList.add("is-on");
      setTimeout(function(){prev.classList.remove("is-out")},1500);
    }
    function tick(){clearTimeout(timer);if(running()&&!usingVideo&&slides.length>1)timer=setTimeout(function(){show(i+1);tick()},STEP)}
    function start(v,src){
      v.src=src;var p=v.play();
      if(p&&p.then)p.then(function(){usingVideo=true;clearTimeout(timer);v.classList.add("is-on");vids[1-vids.indexOf(v)].classList.remove("is-on")}).catch(function(){});
    }
    if(list.length&&!still&&!saveData){
      vids=[0,1].map(function(){
        var v=document.createElement("video");v.className="hf-video";v.muted=true;v.playsInline=true;v.preload="auto";
        v.setAttribute("muted","");v.setAttribute("playsinline","");v.setAttribute("aria-hidden","true");film.appendChild(v);return v;
      });
      if(list.length===1)vids[0].loop=true;
      function next(){cur=1-cur;vi++;start(vids[cur],list[vi%list.length])}
      vids.forEach(function(v,idx){
        v.addEventListener("timeupdate",function(){
          if(list.length<2||idx!==cur||!isFinite(v.duration)||v.duration-v.currentTime>1.2)return;
          next(); /* clipul următor pornește cu 1,2 s înainte de final, pentru trecerea lină */
        });
        /* rezervă: unele clipuri (exportate din telefon) nu au durata în fișier; atunci trecem la următorul când se termină */
        v.addEventListener("ended",function(){if(list.length>1&&idx===cur)next()});
      });
      start(vids[0],list[0]);
    }
    function sync(){
      hero.classList.toggle("oprit",!running());
      vids.forEach(function(v,idx){if(!running())v.pause();else if(idx===cur&&usingVideo)v.play().catch(function(){})});
      tick();
    }
    if(btn)btn.addEventListener("click",function(){
      paused=!paused;btn.setAttribute("aria-pressed",String(paused));
      btn.setAttribute("aria-label",paused?"Pornește animația din fundal":"Oprește animația din fundal");sync();
    });
    if("IntersectionObserver" in window)new IntersectionObserver(function(en){onScreen=en[0].isIntersecting;sync()}).observe(hero);
    document.addEventListener("visibilitychange",sync);
    sync();
  })();

  /* meniuri derulante în header */
  Array.prototype.forEach.call(document.querySelectorAll(".dd > button"),function(b){
    b.addEventListener("click",function(e){
      e.stopPropagation();var d=b.parentElement,open=!d.classList.contains("open");
      closeMenus();if(open){d.classList.add("open");b.setAttribute("aria-expanded","true")}
    });
  });
  document.addEventListener("click",function(e){if(!e.target.closest(".dd"))closeMenus()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeMenus()});

  var mb=document.getElementById("menu-btn"),mn=document.getElementById("mobile-nav");
  /* meniul de pe telefon: încape în ecran și se derulează; pagina din spate stă pe loc cât e deschis */
  function fitMenu(){if(!mn.hidden){mn.style.setProperty("--menu-max",Math.max(160,window.innerHeight-mn.getBoundingClientRect().top)+"px")}}
  function setMenu(open){
    mn.hidden=!open;mb.setAttribute("aria-expanded",String(open));mb.textContent=open?"Închide":"Meniu";
    document.documentElement.style.overflow=open?"hidden":"";
    if(open){mn.scrollTop=0;fitMenu()}
  }
  mb.addEventListener("click",function(){setMenu(mn.hidden)});
  mn.addEventListener("click",function(e){if(e.target.closest("a"))setMenu(false)});
  window.addEventListener("resize",fitMenu);
  matchMedia("(min-width:1181px)").addEventListener("change",function(m){if(m.matches&&!mn.hidden)setMenu(false)});

  var groups=[
    {name:"Față",zones:[["mustata","Mustață, bărbie, perciuni",85],["fata","Față total",200]]},
    {name:"Corp superior",zones:[["axile","Axile",145],["brate","Brațe",250],["umeri","Umeri, ceafă",150],["pectorali","Pectorali, abdomen",250],["spate","Spate total",385],["lombari","Lombari",150]]},
    {name:"Corp inferior",zones:[["bikini","Linia bikini",125],["inghinal","Inghinal total",285],["fese","Fese",150],["picioare-scurt","Picioare (scurt)",285],["picioare-lung","Picioare (lung)",485]]}
  ];
  var byId={},fmt=function(n){return n.toLocaleString("ro-RO")};
  var host=document.getElementById("zones");
  groups.forEach(function(g){g.zones.forEach(function(z){byId[z[0]]={label:z[1],price:z[2]}})});
  /* pe site-ul generat, zonele cu prețuri sunt deja scrise în HTML de build.py (le văd Google și asistenții AI); aici le construim doar dacă lipsesc */
  if(host&&!host.children.length)groups.forEach(function(g){
    var fs=document.createElement("fieldset");
    var lg=document.createElement("legend");lg.textContent=g.name;fs.appendChild(lg);
    var c=document.createElement("div");c.className="chips";
    g.zones.forEach(function(z){
      var w=document.createElement("div");w.className="chip";
      w.innerHTML='<input type="checkbox" id="z-'+z[0]+'" value="'+z[0]+'"><label for="z-'+z[0]+'">'+z[1]+' <span class="num">'+z[2]+' lei</span></label>';
      c.appendChild(w);
    });
    fs.appendChild(c);host.appendChild(fs);
  });
  /* prețuri pe clinici: vin din pagină (lib/prices.ts), aceleași ca pe pagina Prețuri */
  var ZP=null;try{ZP=JSON.parse(document.getElementById("zone-prices").textContent)}catch(e){}
  var calcCity="București";
  function avail(id){return !ZP||(byId[id]&&byId[id].price>0)}
  function applyCity(c){
    if(!ZP||!ZP.prices[c]||!host)return;calcCity=c;
    Object.keys(byId).forEach(function(id){
      var p=ZP.prices[c][id]||0,inp=document.getElementById("z-"+id);byId[id].price=p;
      if(!inp)return;var lab=inp.nextElementSibling,sp=lab.querySelector(".num");
      if(sp)sp.textContent=p?fmt(p)+" lei":"nu e în listă";
      if(p){inp.disabled=false;lab.removeAttribute("title")}
      else{inp.checked=false;inp.disabled=true;lab.title="Zona nu e în lista clinicii din "+c}
    });
  }
  function selected(){return Array.prototype.map.call(host.querySelectorAll("input:checked"),function(i){return i.value})}
  function render(){
    var ids=selected(),sum=0,list=document.getElementById("picked");
    list.innerHTML="";
    ids.forEach(function(id){sum+=byId[id].price;var li=document.createElement("li");li.innerHTML="<span></span><span>"+byId[id].price+" lei</span>";li.firstChild.textContent=byId[id].label;list.appendChild(li)});
    if(!ids.length){list.innerHTML='<li class="empty">Bifează cel puțin o zonă.</li>'}
    var tot=document.getElementById("total"),nt=fmt(sum);if(tot.textContent!==nt){tot.textContent=nt;tot.classList.remove("tick");void tot.offsetWidth;tot.classList.add("tick")}
    document.getElementById("six").textContent=fmt(sum*6)+" lei";
    var has=function(k){return ids.indexOf(k)>-1},deals=[],box=document.getElementById("deal");
    var dl=(ZP&&ZP.deals[calcCity])||{};
    if(has("axile")&&has("inghinal"))deals.push(["Axile și inghinal total au ofertă în "+calcCity,dl.axileInghinal||"Întreabă la programare."]);
    if(has("picioare-lung"))deals.push(["Picior lung are pachet de 6 ședințe în "+calcCity,dl.piciorLung6||"Întreabă la programare."]);
    box.innerHTML="";
    deals.forEach(function(d){var p=document.createElement("p"),s=document.createElement("strong");s.textContent=d[0];p.appendChild(s);p.appendChild(document.createTextNode(d[1]));box.appendChild(p)});
    box.hidden=!deals.length;
  }
  /* zona mare include zona mică: o bifezi pe cea mare, cea mică se debifează și se blochează */
  var covers={"fata":["mustata"],"inghinal":["bikini"],"picioare-lung":["picioare-scurt"],"spate":["lombari","fese"]};
  function applyCovers(){
    var blocked={};
    Object.keys(covers).forEach(function(big){
      if(document.getElementById("z-"+big).checked)covers[big].forEach(function(s){blocked[s]=big});
    });
    Object.keys(covers).forEach(function(big){
      covers[big].forEach(function(s){
        var inp=document.getElementById("z-"+s),lab=inp.nextElementSibling;
        if(blocked[s]){
          inp.checked=false;inp.disabled=true;
          lab.title="Inclus în "+byId[blocked[s]].label;
        }else if(avail(s)){
          inp.disabled=false;lab.removeAttribute("title");
        }
      });
    });
  }
  var msg=document.getElementById("f-msg");
  if(host){
    host.addEventListener("change",function(){applyCovers();render()});
    var cityBox=document.querySelector(".calc-city"),pick=cityBox&&cityBox.querySelector("input:checked");
    if(pick)applyCity(pick.value);
    if(cityBox)cityBox.addEventListener("change",function(e){if(e.target.name!=="calc-city")return;applyCity(e.target.value);applyCovers();render();setCity(e.target.value)});
    applyCovers();render();
    document.getElementById("calc-cta").addEventListener("click",function(){
      var ids=selected();if(ids.length)msg.value=ids.map(function(i){return byId[i].label}).join(", ");
    });
  }
  document.querySelectorAll("[data-offer]").forEach(function(a){
    a.addEventListener("click",function(){msg.value=a.getAttribute("data-offer")});
  });

  var reviews=[
    {city:"București",count:165,revs:[
      ["Cristian Borcan","Am fost pentru epilat definitiv pe spate iar de la prima ședință rezultatele au fost foarte bune. Cristina este amabilă și îți explică la fiecare pas cum urmează sa se desfășoare procedura."],
      ["Carmen","Recomand pentru atitudinea respectuoasa pe care o au față de cliente, pentru promptitudine și conditiile foarte bune de igiena in care se desfasoara tot procesul! Revin cu drag de fiecare data!"],
      ["maria turtoi","Locația arată impecabil iar staff-ul este excepțional. Ți se pune la dispoziție orice îți este necesar și fetele te fac să te simți mereu confortabil."],
      ["Nicoleta Mazanca","Foarte mulțumită! Servicii de calitate și comportament profesionist! Recomand cu drag!"],
      ["diaconu anisoara","O experiență minunată, îmi place să merg acolo, mă simt foarte confortabil de fiecare dată, recomand cu căldură. Fetele sunt super drăguțe și foarte bine pregătite pentru ceea ce fac."],
      ["Anca S","Am gasit in cadrul salonului din Victoriei o tanara domnisoara (Georgiana) care nu numai ca ofera super servicii, vibe ul ei este molipsitor. Numai cuvinte de bine."]]},
    {city:"Popești-Leordeni",count:92,revs:[
      ["Hamzau Marta","Antonia este cea mai bună! Se vede ca știe ce face, este atentă la nevoile clientelor și face o treabă super super bună! Efectele acestui laser sunt WOW."],
      ["Cristina Lita","Recomand cu încredere, salonul este aproape de metrou, serviciile sunt de calitate la preturi accesibile, iar fetele sunt foarte drăguțe și amabile."],
      ["Denisa-Elena Popescu","In urma rezultatelor vizibile dupa sedintele de epilare definitiva, recomand cu incredere acest salon. Antonia este extrem de răbdătoare si cunoaste foarte bine procedurile."],
      ["Diana Fuga","Sunt foarte mulțumită de epilarea definitivă. Personalul este profesionist, iar rezultatele au fost vizibile. Recomand cu încredere!"],
      ["Denisa Stan","Personalul e foarte amabil si ofera servicii profesionale. Atmosfera este una relaxanta. E mereu o placere sa ma reintorc aici."],
      ["Cornelia","Foarte multumita, Antonia este minunata, rezultate excelente, o sa revin cu drag."]]},
    /* Galați: widgetul site-ului vechi arăta 5,0; nota se adaugă (score:5) după verificarea pe Google Maps */
    {city:"Galați",count:176,revs:[
      ["Adina Drumea","Am avut o experiență excelentă la acest salon! Personalul este profesionist, aparatura modernă. Atmosfera este plăcută și igiena impecabilă. Recomand cu încredere!"],
      ["Mihaela Sîrbu","Sunt extrem de multumita! Rezultatele s-au vazut inca de la prima sedinta la epilare definitiva, iar Elena este extraordinara si s-a asigurat mereu ca ma simt confortabil."],
      ["Artemiza Lovin","Recomand. Tehnologie performanta care da rezultatele promise. Elena e o persoana care te face sa te simti comfortabil, iti raspunde la toate intrebarile si da sfaturi utile."],
      ["Madalina Dima","Sunt extrem de multumita! Rezultatele s-au vazut dupa prima sedinta. Totul a fost minunat."],
      ["teo ava","Recomand. Rezultate chiar din prima sedinta, durere minima."],
      ["Geanina Dascălu","Rezultate chiar după prima ședință, personal profesionist!"]]},
    {city:"Brăila",count:218,revs:[
      ["Burtea Monalisa","Alexandra este o persoană foarte caldă, implicată, răbdătoare și atentă la nevoile mele! Rezultatele epilării cu laser se văd încă de la prima ședință. Recomand cu drag!"],
      ["Marinela Avramescu","Recomand Amazing Skin Brăila, pentru profesionalismul și răbdarea Alexandrei. Datorită ei, daca ar fi posibil, aș modifica numărul steluțelor din 5 in 1000!"],
      ["Geanina Chirac","Personalul foarte amabil, am deja rezultate de la prima ședință iar Anca este foarte atenta la toate detaliile și îmi explica tot."],
      ["Diana Neicu","Am fost placut impresionata sa vad rezultatele de la prima sedinta. O recomand pe Anca! O super fata, foarte profesionista!"],
      ["Osip Irina","Foarte multumita de servicii, domnișoara Alexandra este foarte atenta la detalii, profi! Recomand."],
      ["Oana Mucuta","Recomand, servicii de calitate si foarte profesional, personal pregatit si amabil."]]},
    /* Bacău și Iași: nota și numărul de recenzii de pe Google Maps, 17 noiembrie 2026; recenziile, așa cum apar acolo */
    
    
  ];
  /* „9 recenzii”, „218 recenzii”, dar „165 de recenzii”: în română „de” vine doar când ultimele două cifre fac 20 sau mai mult (sau 00) */
  function revCount(n){var t=n%100;return n+((t===0&&n>0)||t>=20?" de recenzii":" recenzii")+" pe Google"}
  var rows=document.getElementById("rev-rows"),tabs=document.getElementById("rev-tabs");
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function slide(s,dir){var c=s.firstElementChild;var w=c?c.getBoundingClientRect().width+16:300;s.scrollBy({left:dir*w,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
  /* pe site-ul generat, build.py scrie recenziile direct în HTML (le văd și crawlerele fără JavaScript); aici le construim doar dacă lipsesc */
  if(rows&&tabs&&!rows.children.length)reviews.forEach(function(r,i){
    var row=el("div","rev-row"),side=el("div","rev-city");
    side.appendChild(el("h3",null,r.city));
    /* nota medie apare doar unde o avem verificată pe Google (score); altfel doar numărul de recenzii */
    if(r.score){
      var score=r.score,scoreTxt=score.toFixed(1).replace(".",",");
      var sc=el("div","rev-score");sc.appendChild(el("strong","num",scoreTxt));
      var st=el("span","stars","★★★★★");st.setAttribute("role","img");st.setAttribute("aria-label",scoreTxt+" stele din 5");st.style.setProperty("--pct",(score/5*100)+"%");sc.appendChild(st);side.appendChild(sc);
    }
    side.appendChild(el("p","num",revCount(r.count)));
    var strip=el("div","rev-strip");strip.tabIndex=0;strip.setAttribute("aria-label","Recenzii "+r.city);
    var ctrl=el("div","rev-ctrl"),p=el("button",null,"‹"),n=el("button",null,"›");
    p.type=n.type="button";p.setAttribute("aria-label","Recenziile anterioare, "+r.city);n.setAttribute("aria-label","Recenziile următoare, "+r.city);
    ctrl.appendChild(p);ctrl.appendChild(n);side.appendChild(ctrl);
    r.revs.forEach(function(v){
      var card=el("figure","rev-card"),who=el("figcaption","rev-who");
      var av=el("span","rev-av",v[0].trim().charAt(0).toUpperCase());av.setAttribute("aria-hidden","true");
      who.appendChild(av);who.appendChild(el("span",null,v[0]));
      var s2=el("span","stars","★★★★★");s2.setAttribute("aria-label","5 stele");
      card.appendChild(who);card.appendChild(s2);card.appendChild(el("blockquote",null,v[1]));
      strip.appendChild(card);
    });
    if(i===0)row.classList.add("is-active");
    var tab=el("button",null,r.city);tab.type="button";tab.setAttribute("role","tab");tab.setAttribute("aria-selected",String(i===0));
    tabs.appendChild(tab);
    row.appendChild(side);row.appendChild(strip);rows.appendChild(row);
  });
  /* butoanele ‹ › și taburile pe orașe (merg și pe recenziile scrise de build.py) */
  if(rows&&tabs)Array.prototype.forEach.call(rows.children,function(row,i){
    var strip=row.querySelector(".rev-strip"),b=row.querySelectorAll(".rev-ctrl button"),tab=tabs.children[i];
    b[0].addEventListener("click",function(){slide(strip,-1)});b[1].addEventListener("click",function(){slide(strip,1)});
    tab.addEventListener("click",function(){
      Array.prototype.forEach.call(rows.children,function(x){x.classList.remove("is-active")});
      Array.prototype.forEach.call(tabs.children,function(x){x.setAttribute("aria-selected","false")});
      row.classList.add("is-active");tab.setAttribute("aria-selected","true");
    });
  });

  /* Pagina Prețuri: tabelul pe zone vine din aceeași listă ca și calculatorul (groups), ca prețurile să nu difere.
     Paginile de clinică: recenziile orașului, scrise direct în pagină. Pe site-ul generat, build.py le scrie deja în HTML. */
  document.querySelectorAll("table[data-zone-table]").forEach(function(t){
    if(t.tBodies.length)return;
    var tb=document.createElement("tbody");
    groups.forEach(function(g){
      var gr=document.createElement("tr"),th=el("th",null,g.name);th.colSpan=2;th.scope="rowgroup";gr.appendChild(th);tb.appendChild(gr);
      g.zones.forEach(function(z){var tr=document.createElement("tr");tr.appendChild(el("td",null,z[1]));tr.appendChild(el("td",null,fmt(z[2])+" lei"));tb.appendChild(tr)});
    });
    t.appendChild(tb);
  });
  document.querySelectorAll("[data-reviews]").forEach(function(box){
    if(box.children.length)return;
    var r=reviews.filter(function(x){return x.city===box.getAttribute("data-reviews")})[0];if(!r)return;
    r.revs.forEach(function(v){
      var card=el("figure","rev-card"),who=el("figcaption","rev-who");
      var av=el("span","rev-av",v[0].trim().charAt(0).toUpperCase());av.setAttribute("aria-hidden","true");
      who.appendChild(av);who.appendChild(el("span",null,v[0]));
      card.appendChild(who);card.appendChild(el("blockquote",null,v[1]));box.appendChild(card);
    });
  });

  var strip=document.getElementById("strip");
  var step=function(dir){var card=strip.querySelector(".offer-card");var w=card?card.getBoundingClientRect().width+20:300;strip.scrollBy({left:dir*w,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})};
  if(strip){
    document.getElementById("strip-prev").addEventListener("click",function(){step(-1)});
    document.getElementById("strip-next").addEventListener("click",function(){step(1)});
  }
  /* calculator: rotița mouse-ului derulează ofertele; la capete, pagina merge mai departe */
  if(matchMedia("(pointer:fine)").matches){
    /* pe calculator: rotița derulează lin rândul pe orizontală (fără snap); la capete, pagina merge mai departe */
    var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    var smoothWheel=function(el){
      el.style.scrollSnapType="none";
      var target=null,pos=0,raf=0,last=0;
      function maxX(){return el.scrollWidth-el.clientWidth}
      function tick(t){
        var dt=last?Math.min(t-last,50):16.7;last=t;
        var d=target-pos;
        if(Math.abs(d)<0.5||reduce){pos=target;el.scrollLeft=pos;raf=0;last=0;target=null;return}
        pos+=d*(1-Math.pow(0.82,dt/16.7));
        el.scrollLeft=pos;
        raf=requestAnimationFrame(tick);
      }
      function glideTo(x){
        if(target===null)pos=el.scrollLeft;
        target=Math.max(0,Math.min(maxX(),x));
        if(!raf)raf=requestAnimationFrame(tick);
      }
      el.addEventListener("wheel",function(e){
        if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
        var dy=e.deltaY*(e.deltaMode===1?40:e.deltaMode===2?el.clientWidth:1);
        var cur=target===null?el.scrollLeft:target,m=maxX();
        if((dy>0&&cur>=m-1)||(dy<0&&cur<=1))return;
        e.preventDefault();
        glideTo(cur+dy*1.5);
      },{passive:false});
      return {
        /* merge la marginea cardului următor / anterior */
        step:function(dir){
          var cur=target===null?el.scrollLeft:target,base=el.getBoundingClientRect().left-el.scrollLeft,xs=[];
          Array.prototype.forEach.call(el.children,function(c){xs.push(c.getBoundingClientRect().left-base)});
          var next=dir>0?xs.filter(function(x){return x>cur+2})[0]:xs.filter(function(x){return x<cur-2}).pop();
          glideTo(next===undefined?(dir>0?maxX():0):next);
        }
      };
    };
    if(strip)step=smoothWheel(strip).step;
    document.querySelectorAll(".rev-strip").forEach(smoothWheel);
  }

  if("IntersectionObserver" in window){
    /* venit prin cortină de pe altă pagină: animațiile de intrare pornesc când se ridică cortina, iar ce e deja pe ecran
       intră pe rând, mai repede decât la prima vizită (rv-rapid: 600 ms, 70 ms între elemente) */
    var arrived=document.documentElement.classList.contains("cortina-on");
    function whenOpen(fn){if(arrived)window.addEventListener("cortina-iese",fn,{once:true});else fn()}
    function onScreen(t){var r=t.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}
    var targets=document.querySelectorAll("#zone .band-head,#zone .zone,#remodelare .band-head,#remodelare .svc,#faciale .band-head,#faciale .facial-list,#faciale .facial-list li");
    var pending=Array.prototype.slice.call(targets),ticking=false;
    function show(t){
      if(t.classList.contains("is-in"))return;
      var p=t.parentElement,cols=1;
      if(getComputedStyle(p).display==="grid")cols=getComputedStyle(p).gridTemplateColumns.split(" ").length;
      var idx=Array.prototype.indexOf.call(p.children,t);
      t.style.setProperty("--i",cols>1?idx%cols:0);
      t.classList.add("is-in");io.unobserve(t);
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){if(en.isIntersecting||en.boundingClientRect.top<0)show(en.target)});
    },{threshold:[0,.18],rootMargin:"0px 0px -6% 0px"});
    /* anything the visitor jumped past (menu links) is shown too, so nothing stays blank above the fold */
    function sweep(){ticking=false;pending=pending.filter(function(t){if(t.classList.contains("is-in"))return false;if(t.getBoundingClientRect().bottom<0){show(t);return false}return true})}
    window.addEventListener("scroll",function(){if(!ticking&&pending.length){ticking=true;requestAnimationFrame(sweep)}},{passive:true});
    Array.prototype.forEach.call(targets,function(t){t.setAttribute("data-reveal","")});
    whenOpen(function(){Array.prototype.forEach.call(targets,function(t){io.observe(t)})});

    /* restul site-ului: fiecare bloc (titlu, paragraf, poză, element de listă) apare când intră pe ecran */
    var SKIP="#zone,#remodelare,#faciale,script,template,[hidden],.laser-line,.hero-film,.hf-pauza";
    var FLAT="section,header.v-hero,.wrap:not(.crumbs),.split,.split>div:not(.photo),.hero-text,.hero-side,.v-text,.strip-head,.band-head,.calc-grid,form,footer";
    var GROUP="ul,ol,.perks,.loc-grid,.hours,.facts-row,.faq,.rev-rows,.prose,.row2";
    var units=[];
    function walk(el){Array.prototype.forEach.call(el.children,function(c){
      if(c.matches(SKIP))return;
      if(c.matches(FLAT))walk(c);
      else if(c.matches(GROUP)&&c.children.length>1)Array.prototype.forEach.call(c.children,function(x){if(!x.matches(SKIP))units.push(x)});
      else units.push(c);
    })}
    if(home)walk(home);Array.prototype.forEach.call(views,walk);walk(document.querySelector("footer"));
    function done(t){t.classList.remove("rv","is-in");t.style.removeProperty("--rd")}
    function showU(t,n){
      if(!t.classList.contains("rv")||t.classList.contains("is-in"))return;
      t.style.setProperty("--rd",t.classList.contains("rv-rapid")?Math.min(n,6)*70+"ms":Math.min(n,5)*150+"ms");
      t.classList.add("is-in");io2.unobserve(t);
      t.addEventListener("transitionend",function h(e){if(e.target===t&&e.propertyName==="opacity"){t.removeEventListener("transitionend",h);done(t)}});
    }
    var io2=new IntersectionObserver(function(entries){
      var n=0;entries.forEach(function(en){if(en.isIntersecting||en.boundingClientRect.top<0)showU(en.target,en.boundingClientRect.top<0?0:n++)});
    },{threshold:0,rootMargin:"0px 0px -8% 0px"});
    if(arrived)units.forEach(function(t){if(onScreen(t))t.classList.add("rv-rapid")});
    units.forEach(function(t){t.classList.add("rv")});
    whenOpen(function(){units.forEach(function(t){io2.observe(t)})});
    pending=pending.concat(units);
    sweep=function(){ticking=false;pending=pending.filter(function(t){
      var old=t.hasAttribute("data-reveal");
      if(t.classList.contains("is-in")||(!old&&!t.classList.contains("rv")))return false;
      if(t.getBoundingClientRect().bottom<0){if(old)show(t);else showU(t,0);return false}
      return true})};
    document.documentElement.classList.add("js-reveal");
  }

  /* înainte / după: linia urmărește mouse-ul; pe telefon se trage cu degetul; din tastatură cu săgețile */
  var ba=document.getElementById("ba");
  if(ba){
    var baRange=ba.querySelector(".ba-range"),baDrag=false,baTouched=false;
    function baSet(p){p=Math.max(0,Math.min(100,p));ba.style.setProperty("--p",p+"%");baRange.value=Math.round(p)}
    function baX(x){var r=ba.getBoundingClientRect();baSet((x-r.left)/r.width*100)}
    ba.addEventListener("pointermove",function(e){if(e.pointerType==="mouse"||baDrag){baTouched=true;baX(e.clientX)}});
    ba.addEventListener("pointerdown",function(e){baTouched=baDrag=true;baX(e.clientX)});
    ["pointerup","pointercancel","pointerleave"].forEach(function(ev){ba.addEventListener(ev,function(){baDrag=false})});
    baRange.addEventListener("input",function(){baTouched=true;baSet(+baRange.value)});
    /* o singură mișcare de probă când cercul apare, ca să se vadă că linia se mută */
    if("IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
      var baIo=new IntersectionObserver(function(en){
        if(!en[0].isIntersecting)return;baIo.disconnect();
        var t0=null;setTimeout(function(){requestAnimationFrame(function step(t){
          if(baTouched)return;if(t0===null)t0=t;var k=(t-t0)/2200;
          if(k>=1){baSet(50);return}
          baSet(50+Math.sin(k*Math.PI*2)*22*(1-k));requestAnimationFrame(step)})},900);
      },{threshold:.6});
      baIo.observe(ba);
    }
  }

  var locMq=matchMedia("(max-width:560px)"),locs=document.querySelectorAll("details.loc");
  function syncLocs(){Array.prototype.forEach.call(locs,function(d,i){d.open=!locMq.matches||i===0})}
  syncLocs();if(locMq.addEventListener)locMq.addEventListener("change",syncLocs);

  var bar=document.getElementById("cta-bar");
  if("IntersectionObserver" in window){new IntersectionObserver(function(en){bar.classList.toggle("is-hidden",en[0].isIntersecting)},{threshold:.15}).observe(document.getElementById("programare"))}


  /* consimțământ cookie-uri. Scripturile de urmărire se pun ca <script type="text/plain" data-consent="analytics|ads"> și pornesc doar după acord */
  (function(){
    var KEY="as-consent",VER=1,MAX=1000*60*60*24*182,box=document.getElementById("ck"),dlg=document.getElementById("ck-dlg");
    var an=document.getElementById("ck-analytics"),ad=document.getElementById("ck-ads");
    function read(){try{var c=JSON.parse(localStorage.getItem(KEY));if(c&&c.v===VER&&Date.now()-c.t<MAX)return c}catch(e){}return null}
    function write(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}}
    function run(c){
      window.asConsent={analytics:!!c.analytics,ads:!!c.ads};
      document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(function(old){
        if(!window.asConsent[old.getAttribute("data-consent")])return;
        var n=document.createElement("script");
        Array.prototype.forEach.call(old.attributes,function(a){if(a.name!=="type"&&a.name!=="data-consent")n.setAttribute(a.name,a.value)});
        n.text=old.text;old.replaceWith(n);
      });
      window.dispatchEvent(new CustomEvent("as-consent",{detail:window.asConsent}));
    }
    function decide(analytics,ads){
      var prev=read(),c={v:VER,t:Date.now(),analytics:analytics,ads:ads};
      write(c);box.hidden=true;if(dlg.open)dlg.close();
      /* dacă cineva retrage acordul, reîncărcăm ca să oprim scripturile deja pornite */
      if(prev&&((prev.analytics&&!analytics)||(prev.ads&&!ads))){location.reload();return}
      run(c);
    }
    function openPrefs(){var c=read()||{};an.checked=!!c.analytics;ad.checked=!!c.ads;if(dlg.showModal)dlg.showModal();else dlg.setAttribute("open","")}
    document.addEventListener("click",function(e){
      var b=e.target.closest("[data-ck]");if(!b)return;
      var k=b.getAttribute("data-ck");
      if(k==="accept")decide(true,true);
      else if(k==="refuse")decide(false,false);
      else if(k==="save")decide(an.checked,ad.checked);
      else if(k==="prefs")openPrefs();
      else if(k==="close")dlg.close();
    });
    dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close()});
    dlg.addEventListener("click",function(e){if(e.target.closest('a[href^="#"]'))dlg.close()});
    var c=read();if(c)run(c);else box.hidden=false;
  })();
  /* demo de apăsare pe Programează-te: la fiecare încărcare a paginii principale (și la reîncărcare), pe butonul vizibil.
     Dacă bannerul de cookie-uri e deschis, așteaptă alegerea; dacă cookie-urile sunt deja confirmate, pornește după 2,2 s. */
  (function(){
    if(MPA?location.pathname!=="/":current)return; /* doar pe pagina principală */
    var hero=document.querySelector(".hero-actions .btn-primary"),topBtn=document.querySelector(".top .btn-primary"),
        barBtn=document.querySelector(".cta-bar .btn-primary"),header=document.querySelector(".top");
    /* vizibil cu adevărat: întreg pe ecran, sub antetul fix (dacă nu e chiar în antet) și neacoperit de nimic (banner, cortină) */
    function visible(el){
      if(!el||getComputedStyle(el).visibility==="hidden")return false;
      var r=el.getBoundingClientRect();if(!r.width||!r.height)return false;
      var top=header&&!header.contains(el)?header.getBoundingClientRect().bottom:0;
      if(r.top<top-1||r.bottom>innerHeight+1)return false;
      var hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return !!hit&&(hit===el||el.contains(hit));
    }
    function press(b,onGone){
      b.classList.remove("demo-press","glow-loop");void b.offsetWidth;b.classList.add("demo-press");
      function stop(){b.classList.remove("demo-press");b.removeEventListener("animationend",end);removeEventListener("scroll",watch)}
      /* demo-ul s-a terminat pe ecran: butonul primește lumina care se rotește pe contur */
      function end(e){if(e.target===b&&!e.pseudoElement&&e.animationName.indexOf("demo")===0){stop();startGlow()}}
      /* dacă butonul iese de pe ecran în timpul demo-ului (s-a derulat), îl oprim aici și îl mutăm */
      function watch(){if(onGone&&!visible(b)){stop();onGone()}}
      b.addEventListener("animationend",end);
      if(onGone)addEventListener("scroll",watch,{passive:true});
    }
    /* lumina de după demo: pe butonul din hero doar cât timp pagina e sus de tot; cum derulezi (chiar și puțin),
       trece pe butonul din antet (pe telefon, unde antetul nu are buton, pe cel din bara de jos) și revine pe hero când urci până sus */
    var glowOn=null,glowRaf=0;
    function shown(el){return !!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden"}
    function glowTarget(){
      var r=hero&&hero.getBoundingClientRect(),hb=header?header.getBoundingClientRect().bottom:0;
      var heroOn=!!(r&&r.height&&r.bottom>hb&&r.top<innerHeight);
      if(heroOn&&scrollY<=8)return hero;
      if(shown(topBtn))return topBtn;
      var bar=barBtn&&barBtn.closest(".cta-bar");
      if(shown(barBtn)&&!(bar&&bar.classList.contains("is-hidden")))return barBtn;
      return heroOn?hero:null;
    }
    function placeGlow(){
      glowRaf=0;var t=glowTarget();if(t===glowOn)return;
      if(glowOn)glowOn.classList.remove("glow-loop");
      glowOn=t;if(t&&!t.classList.contains("demo-press"))t.classList.add("glow-loop");
    }
    function queueGlow(){if(!glowRaf)glowRaf=requestAnimationFrame(placeGlow)}
    var glowStarted=false;
    function startGlow(){
      if(!glowStarted){glowStarted=true;addEventListener("scroll",queueGlow,{passive:true});addEventListener("resize",queueGlow)}
      glowOn=null;placeGlow();
    }
    var tries=0;
    function play(){
      if(document.getElementById("ck").hidden===false)return;
      /* întâi butonul mare din hero; dacă s-a derulat (sau nu încape pe ecran), cel din antet sau din bara de jos */
      var b=[hero,topBtn,barBtn].filter(visible)[0];
      if(!b){if(tries++<8)setTimeout(play,400);return}
      /* dacă butonul din hero încă apare treptat (animația de intrare a paginii), așteptăm să fie complet vizibil */
      if(b===hero&&b.closest(".rv:not(.is-in),[data-reveal]:not(.is-in)")&&tries++<12){setTimeout(play,250);return}
      press(b,b===hero?function(){var alt=[topBtn,barBtn].filter(visible)[0];if(alt)press(alt)}:null);
    }
    function later(ms){setTimeout(play,ms)}
    if(document.getElementById("ck").hidden)later(2200);
    else window.addEventListener("as-consent",function(){later(900)},{once:true});
  })();
  /* formular pe pași */
  function setCity(c){
    document.querySelectorAll('#programare input[name="city"]').forEach(function(r){r.checked=r.value===c});
    var h=document.getElementById("f-city");if(h)h.value=c;
  }
  (function(){
    var f=document.getElementById("programare"),steps=f.querySelectorAll(".st"),N=steps.length,cur=0;
    var bar=document.getElementById("st-bar"),count=document.getElementById("st-count"),err=document.getElementById("f-err");
    var back=document.getElementById("st-back"),next=document.getElementById("st-next"),send=document.getElementById("st-send");
    var $=function(id){return document.getElementById(id)};
    f.classList.add("js");
    function fail(msg,el){err.textContent=msg;err.hidden=false;if(el)el.focus()}
    function check(i){
      if(i===2&&!$("f-name").value.trim()){fail("Scrie-ți numele ca să știm pe cine sunăm.",$("f-name"));return false}
      if(i===3&&!/^\+?\d{9,12}$/.test($("f-phone").value.replace(/[\s.()-]/g,""))){fail("Numărul pare incomplet. Folosește formatul 07xx xxx xxx.",$("f-phone"));return false}
      if(i===4){var e=$("f-email").value.trim();if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){fail("Adresa de e-mail nu pare corectă. O poți și șterge, e opțională.",$("f-email"));return false}}
      if(i===5&&!$("f-gdpr").checked){fail("Bifează acordul pentru prelucrarea datelor, ca să te putem contacta.",$("f-gdpr"));return false}
      err.hidden=true;return true;
    }
    function summary(){
      var rows=[["Oraș",$("f-city").value,0],["Zone",$("f-msg").value.trim()||"alegem la consultație",1],["Când",$("f-when").value.trim()||"oricând",1],["Nume",$("f-name").value.trim(),2],["Telefon",$("f-phone").value.trim(),3],["E-mail",$("f-email").value.trim()||"fără",4]];
      var dl=$("st-sum");dl.innerHTML="";
      rows.forEach(function(r){
        var dt=document.createElement("dt"),dd=document.createElement("dd"),b=document.createElement("button");
        dt.textContent=r[0];dd.textContent=r[1];b.type="button";b.textContent="Modifică";b.setAttribute("aria-label","Modifică "+r[0].toLowerCase());
        b.addEventListener("click",function(){go(r[2])});
        dl.appendChild(dt);dl.appendChild(dd);dl.appendChild(b);
      });
    }
    function go(i,focus){
      f.classList.toggle("back",i<cur);cur=i;
      steps.forEach(function(st,k){st.classList.toggle("is-on",k===i)});
      bar.style.width=((i+1)/N*100)+"%";
      count.textContent="Pasul "+(i+1)+" din "+N;
      back.hidden=i===0;next.hidden=i===N-1;send.hidden=i!==N-1;
      next.textContent=(i===1&&!$("f-msg").value.trim())||(i===4&&!$("f-email").value.trim())?"Sari peste":"Continuă";
      if(i===N-1)summary();
      err.hidden=true;
      if(focus!==false){var el=steps[i].querySelector("input:checked,input:not([type=hidden]),textarea");if(el)el.focus({preventScroll:true})}
    }
    function forward(){if(check(cur)&&cur<N-1)go(cur+1)}
    next.addEventListener("click",forward);
    back.addEventListener("click",function(){if(cur>0)go(cur-1)});
    ["f-msg","f-email"].forEach(function(id){$(id).addEventListener("input",function(){if(steps[cur].contains($(id)))go(cur,false)})});
    f.addEventListener("change",function(e){
      if(e.target.name==="city"){$("f-city").value=e.target.value;setTimeout(forward,180)}
    });
    f.addEventListener("keydown",function(e){
      if(e.key!=="Enter"||e.isComposing)return;
      if(e.target.tagName==="TEXTAREA"&&!(e.ctrlKey||e.metaKey))return;
      if(e.target.tagName==="BUTTON"||e.target.tagName==="A")return;
      e.preventDefault();if(cur<N-1)forward();else f.requestSubmit?f.requestSubmit():send.click();
    });
    /* Trimiterea cererii:
       - dacă formularul are data-endpoint="https://…" (Formspree, Web3Forms sau un script pe server), datele pleacă acolo ca JSON;
       - altfel, cererea se trimite pe WhatsApp: se deschide conversația cu mesajul gata scris, iar clientul apasă Trimite. */
    var WA="40732787118";
    function waText(){
      var t="Bună ziua! Aș vrea o programare la consultația gratuită.\nClinica: "+$("f-city").value+
        "\nZone / ofertă: "+($("f-msg").value.trim()||"alegem la consultație")+($("f-when").value.trim()?"\nCând mi-ar conveni: "+$("f-when").value.trim():"")+
        "\nNume: "+$("f-name").value.trim()+"\nTelefon: "+$("f-phone").value.trim();
      var em=$("f-email").value.trim();if(em)t+="\nE-mail: "+em;
      return t;
    }
    function done(text,waLink){
      $("f-ok-text").textContent=text;
      var a=$("f-wa");if(a){a.hidden=!waLink;if(waLink)a.href=waLink}
      f.classList.add("done");$("f-ok").hidden=false;$("f-ok").focus();
    }
    f.addEventListener("submit",function(e){
      e.preventDefault();
      for(var k=2;k<N;k++){if(!check(k)){var bad=k;if(cur!==bad)go(bad);check(bad);return}}
      var city=$("f-city").value,ep=f.getAttribute("data-endpoint");
      if(ep){
        send.disabled=true;
        fetch(ep,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({
          oras:city,zone:$("f-msg").value.trim(),cand:$("f-when").value.trim(),nume:$("f-name").value.trim(),telefon:$("f-phone").value.trim(),email:$("f-email").value.trim(),pagina:location.pathname})})
          .then(function(r){if(!r.ok)throw new Error(r.status);done("Am primit cererea pentru clinica din "+city+". Te sunăm noi pentru a stabili ziua și ora.")})
          .catch(function(){done("Cererea nu a putut fi trimisă. Trimite-ne-o pe WhatsApp sau sună-ne la 0732 787 118.","https://wa.me/"+WA+"?text="+encodeURIComponent(waText()))})
          .then(function(){send.disabled=false});
        return;
      }
      var link="https://wa.me/"+WA+"?text="+encodeURIComponent(waText());
      done("Ultimul pas: apasă butonul de mai jos, verifică mesajul în WhatsApp și trimite-l. Te sunăm noi pentru a stabili ziua și ora la clinica din "+city+".",link);
      window.open(link,"_blank","noopener");
    });
    $("st-again").addEventListener("click",function(){
      ["f-name","f-phone","f-email","f-msg","f-when"].forEach(function(id){$(id).value=""});$("f-gdpr").checked=false;
      $("f-ok").hidden=true;f.classList.remove("done");go(0);
    });
    go(0,false);
  })();

  /* antetul peste hero: sticlă întunecată cu text alb cât timp hero-ul e sub el (vezi CSS-ul „Hero fără margini”) */
  (function(){
    var top=document.querySelector(".top"),hero=document.querySelector(".hero");
    if(!top||!hero)return;
    var raf=0;
    function upd(){raf=0;var r=hero.getBoundingClientRect();top.classList.toggle("peste-hero",r.height>0&&r.bottom>top.offsetHeight)}
    function req(){if(!raf)raf=requestAnimationFrame(upd)}
    addEventListener("scroll",req,{passive:true});addEventListener("resize",req);addEventListener("hashchange",function(){setTimeout(upd,0)});
    upd();
  })();

  /* „Programează-te”: formularul se deschide într-o fereastră, fără derulare (vezi CSS-ul „Programarea într-o fereastră”) */
  (function(){
    var form=document.getElementById("programare");
    if(!form||typeof HTMLDialogElement!=="function")return;
    var dlg=document.createElement("dialog");dlg.className="book-dlg";dlg.setAttribute("aria-labelledby","book-dlg-t");
    dlg.innerHTML='<div class="book-dlg-head"><h2 id="book-dlg-t">Programează consultația gratuită</h2>'+
      '<button type="button" class="book-dlg-x" aria-label="Închide"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg></button></div><div class="book-dlg-body"></div>';
    document.body.appendChild(dlg);
    var body=dlg.querySelector(".book-dlg-body"),loc=document.createElement("div"),opener=null,ret=0;
    loc.className="book-loc";loc.textContent="Formularul e deschis în fereastra de programare.";
    function open(from){
      if(dlg.open)return;
      opener=from||document.activeElement;
      clearTimeout(ret);
      if(!body.contains(form)){form.parentNode.insertBefore(loc,form);body.appendChild(form)}
      document.documentElement.classList.add("book-open");
      dlg.showModal();shown=true;
      var el=form.querySelector(".st.is-on input:checked,.st.is-on input:not([type=hidden]),.st.is-on textarea");
      if(el)el.focus({preventScroll:true});
    }
    /* închiderea nu depinde doar de evenimentul „close” al browserului (nu vine mereu la timp) */
    var shown=false;
    function after(){
      if(dlg.open||!shown)return;shown=false;
      document.documentElement.classList.remove("book-open");
      /* formularul se întoarce după animația de închidere, ca fereastra să nu se golească sub ochii vizitatorului */
      clearTimeout(ret);
      ret=setTimeout(function(){if(!dlg.open&&loc.parentNode&&body.contains(form)){loc.parentNode.insertBefore(form,loc);loc.remove()}},450);
      if(opener&&opener.focus)opener.focus({preventScroll:true});
    }
    function shut(){if(dlg.open)dlg.close();after()}
    dlg.addEventListener("close",after);
    dlg.addEventListener("cancel",function(e){e.preventDefault();shut()});
    dlg.querySelector(".book-dlg-x").addEventListener("click",shut);
    /* click pe fundalul întunecat închide fereastra */
    dlg.addEventListener("click",function(e){if(e.target===dlg){var r=dlg.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)shut()}});
    document.addEventListener("click",function(e){
      if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest('a[href]');if(!a)return;
      var u=new URL(a.href,location.href);
      if(u.hash!=="#programare"||u.origin!==location.origin||u.pathname!==location.pathname)return;
      if(dlg.contains(a))return;
      e.preventDefault();
      var m=document.getElementById("mobile-nav");if(m&&!m.hidden){var mb=document.getElementById("menu-btn");if(mb)mb.click()}
      open(a);
    },true);
    /* venit de pe altă pagină cu /#programare: fereastra se deschide direct */
    if(location.hash==="#programare")setTimeout(function(){open(null)},400);
  })();
})();
