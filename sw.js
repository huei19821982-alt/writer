/* 나만의 기록 — 앱 화면을 기기에 저장해서 인터넷이 없어도 열리게 하는 파일 */
const CACHE='writer-v1';
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
const CORE=['./','index.html','firebase-config.js','journal.webmanifest','icon-192.png','icon-512.png'];
const LIBS=[SDK+'firebase-app.js',SDK+'firebase-auth.js',SDK+'firebase-firestore.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all([
    ...CORE.map(u=>c.add(u).catch(()=>{})),
    ...LIBS.map(u=>c.add(new Request(u,{mode:'cors'})).catch(()=>{}))
  ])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url);
  // 기록 데이터(Firestore·로그인)는 건드리지 않음: Firebase가 직접 기기에 보관하고 올림
  if(/googleapis\.com$|firebaseio\.com$|identitytoolkit|securetoken/.test(u.hostname))return;
  const same=u.origin===location.origin;
  const lib=u.href.startsWith(SDK)||/fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$/.test(u.hostname);
  if(same){ // 앱 화면: 인터넷이 되면 최신 것을, 안 되면 저장해 둔 것을
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))));
  }else if(lib){ // Firebase 프로그램·글꼴: 저장해 둔 것을 먼저
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));
  }
});
