(function () {
  const API_BASE = "https://poong-chi.vercel.app/api";

  const CREWS = [
    {
      name: "YB",
      logo: "https://yxl.kr/inf/img/yb_logo_main.webp",
      since: "24.10.01",
      bossRole: "수장",
      members: [
        { n: "A-염보성!!", id: "yuambo", r: "수장", img: "https://poong-chi.vercel.app/images/yb/yuambo.jpg" },
        { n: "Scan유승계", id: "scan1014", r: "교수", img: "https://poong-chi.vercel.app/images/yb/scan1014.jpg" },
        { n: "전제민", id: "wjswpalssla1", r: "교수", img: "https://poong-chi.vercel.app/images/yb/wjswpalssla1.jpg" },
        { n: "오메틴승도4²", id: "rlatldgus", r: "교수", img: "https://poong-chi.vercel.app/images/yb/rlatldgus.jpg" },
        { n: "뎅크~_~", id: "dkwkal", r: "교수", img: "https://poong-chi.vercel.app/images/yb/dkwkal.jpg" },
        { n: "저라닛", id: "joey1114", r: "어드바이저", img: "https://poong-chi.vercel.app/images/yb/joey1114.jpg" },
        { n: "우리밍_", id: "kmj05317", r: "학생", img: "https://poong-chi.vercel.app/images/yb/kmj05317.jpg" },
        { n: "태영♥", id: "xodud1898", r: "학생", img: "https://poong-chi.vercel.app/images/yb/xodud1898.jpg" },
        { n: "하랑e♥", id: "candyrang00", r: "학생", img: "https://poong-chi.vercel.app/images/yb/candyrang00.jpg" },
        { n: "삐긋지니♥", id: "son4069", r: "학생", img: "https://poong-chi.vercel.app/images/yb/son4069.jpg" },
        { n: "으늘이", id: "rhakdncjs90", r: "학생", img: "https://poong-chi.vercel.app/images/yb/rhakdncjs90.jpg" },
        { n: "임빙지", id: "dlaalswl22", r: "학생", img: "https://poong-chi.vercel.app/images/yb/dlaalswl22.jpg" },
        { n: "히요코", id: "hiyoko040", r: "학생", img: "https://poong-chi.vercel.app/images/yb/hiyoko040.jpg" },
        { n: "한쌕니", id: "zzonii", r: "학생", img: "https://poong-chi.vercel.app/images/yb/zzonii.jpg" },
        { n: "하루묵.", id: "harumyong", r: "학생", img: "https://poong-chi.vercel.app/images/yb/harumyong.jpg" },
        { n: "윤하랑=_=", id: "xx00uxx", r: "유스", img: "https://poong-chi.vercel.app/images/yb/xx00uxx.jpg" },
        { n: "준봇드", id: "gksdidqksxn", r: "기타", img: "https://poong-chi.vercel.app/images/yb/gksdidqksxn.jpg" },
        { n: "임아니", id: "1004suna", r: "기타", img: "https://poong-chi.vercel.app/images/yb/1004suna.jpg" },
      ],
    },
    {
      name: "YXL",
      logo: "https://yxl.kr/inf/img/yxl_logo_main.webp",
      since: "24.04.01",
      bossRole: "대표",
      members: [
        { n: "A-염보성!!", id: "yuambo", r: "대표", img: "https://poong-chi.vercel.app/images/yxl/yuambo.jpg" },
        { n: "리윤_♥", id: "sladk51", r: "부장", img: "https://poong-chi.vercel.app/images/yxl/sladk51.jpg" },
        { n: "후육♥", id: "jaeha010", r: "차장", img: "https://poong-chi.vercel.app/images/yxl/jaeha010.jpg" },
        { n: "서니_♥", id: "iluvpp", r: "과장", img: "https://poong-chi.vercel.app/images/yxl/iluvpp.jpg" },
        { n: "하랍쌍♥", id: "asy1218", r: "대리", img: "https://poong-chi.vercel.app/images/yxl/asy1218.jpg" },
        { n: "소다♥", id: "zbxlzzz", r: "비서실장", img: "https://poong-chi.vercel.app/images/yxl/zbxlzzz.jpg" },
        { n: "#율무", id: "offside629", r: "주임", img: "https://poong-chi.vercel.app/images/yxl/offside629.jpg" },
        { n: "김유정S2", id: "tkek55", r: "사원", img: "https://poong-chi.vercel.app/images/yxl/tkek55.jpg" },
        { n: "꺼니", id: "callgg", r: "웨이터", img: "https://poong-chi.vercel.app/images/yxl/callgg.jpg" },
        { n: "김푸:)", id: "kimpooh0707", r: "웨이터", img: "https://poong-chi.vercel.app/images/yxl/kimpooh0707.jpg" },
        { n: "유나연♡", id: "jeewon1202", r: "시급", img: "https://poong-chi.vercel.app/images/yxl/jeewon1202.jpg" },
        { n: "뭉뭉수주", id: "star49", r: "신입", img: "https://poong-chi.vercel.app/images/yxl/star49.jpg" },
        { n: "미로。", id: "fhwm0602", r: "신입", img: "https://poong-chi.vercel.app/images/yxl/fhwm0602.jpg" },
        { n: "넘서하♡", id: "smkim82372", r: "신입", img: "https://poong-chi.vercel.app/images/yxl/smkim82372.jpg" },
      ],
    },
  ];

  const ROLE_COLORS = {
    "수장":"#dc2626","대표":"#dc2626","교수":"#7c3aed","부장":"#7c3aed",
    "차장":"#9333ea","과장":"#a855f7","어드바이저":"#ea580c","비서실장":"#ea580c",
    "대리":"#f97316","주임":"#fb923c","사원":"#2563eb","웨이터":"#3b82f6",
    "시급":"#60a5fa","학생":"#2563eb","유스":"#059669","신입":"#059669","기타":"#64748b"
  };

  const liveData = {};

  // Fetch live status
  async function fetchLive() {
    const seen = new Set();
    const all = [];
    CREWS.forEach(c => c.members.forEach(m => {
      if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
    }));
    await Promise.all(all.map(m =>
      fetch(`${API_BASE}/soop-station?id=${m.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.broad && d.broad.broad_no) {
            liveData[m.id] = { live: true, title: d.broad.broad_title || "", viewers: d.broad.current_sum_viewer || 0 };
          }
        }).catch(() => {})
    ));
  }

  function isLive(id) { return liveData[id]?.live || false; }

  function render() {
    const root = document.getElementById("app-root") || document.createElement("div");
    if (!root.id) { root.id = "app-root"; document.body.appendChild(root); }

    root.innerHTML = `
      <style>
        #app-root { font-family:'Noto Sans KR',sans-serif; max-width:900px; margin:0 auto; background:#0f1117; color:#e2e8f0; padding:20px; border-radius:12px; }
        #app-root * { box-sizing:border-box; margin:0; padding:0; }
        .cr-section { margin-bottom:36px; }
        .cr-header { display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap; }
        .cr-logo { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#d97706,#b45309); padding:3px; }
        .cr-logo img { width:100%; height:100%; object-fit:contain; border-radius:50%; }
        .cr-name { font-size:22px; font-weight:900; }
        .cr-since { font-size:11px; color:#d97706; font-weight:600; }
        .cr-live-count { background:#450a0a; border:1px solid rgba(239,68,68,0.25); border-radius:16px; padding:3px 10px; font-size:11px; font-weight:700; color:#ef4444; margin-left:auto; }
        .cr-summary { font-size:13px; color:#94a3b8; padding:10px 0; border-bottom:1px solid #2a2d3a; margin-bottom:14px; }
        .cr-summary b { color:#e2e8f0; }
        .cr-boss { display:flex; align-items:center; gap:14px; padding:16px 0; border-bottom:1px solid #2a2d3a; margin-bottom:16px; text-decoration:none; color:inherit; }
        .cr-boss:hover .boss-ph { border-color:#f59e0b; }
        .boss-ph-wrap { position:relative; flex-shrink:0; }
        .boss-ph { width:72px; height:72px; border-radius:50%; border:3px solid #f59e0b; overflow:hidden; background:#252836; box-shadow:0 0 0 3px rgba(245,158,11,0.2); }
        .boss-ph img { width:100%; height:100%; object-fit:cover; }
        .boss-nm { font-size:17px; font-weight:800; }
        .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:700; color:#fff; margin-bottom:2px; }
        .members { display:grid; grid-template-columns:repeat(auto-fill,minmax(85px,1fr)); gap:16px 10px; }
        .mem { display:flex; flex-direction:column; align-items:center; gap:3px; text-decoration:none; color:inherit; transition:transform .15s; }
        .mem:hover { transform:translateY(-2px); }
        .mem:hover .mem-ph { border-color:#f59e0b; }
        .mem-ph-wrap { position:relative; }
        .mem-ph { width:66px; height:66px; border-radius:50%; border:2px solid #2a2d3a; overflow:hidden; background:#252836; transition:border-color .15s; }
        .mem-ph img { width:100%; height:100%; object-fit:cover; }
        .mem-nm { font-size:12px; font-weight:700; text-align:center; max-width:85px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .live-ring { border:3px solid #ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,0.3),0 0 12px rgba(239,68,68,0.2); animation:lglow 2s ease-in-out infinite; }
        @keyframes lglow { 0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.3),0 0 12px rgba(239,68,68,0.2)} 50%{box-shadow:0 0 0 3px rgba(239,68,68,0.5),0 0 20px rgba(239,68,68,0.3)} }
        .live-tag { position:absolute; bottom:-2px; left:50%; transform:translateX(-50%); background:#ef4444; color:#fff; font-size:8px; font-weight:800; padding:1px 5px; border-radius:6px; letter-spacing:.5px; }
        .live-title { font-size:11px; color:#64748b; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cr-footer { text-align:center; font-size:10px; color:#64748b; padding-top:16px; border-top:1px solid #2a2d3a; margin-top:10px; }
        .cr-footer a { color:#d97706; text-decoration:none; }
      </style>
      ${CREWS.map(crew => {
        const boss = crew.members.find(m => m.r === crew.bossRole);
        const others = crew.members.filter(m => m.r !== crew.bossRole)
          .sort((a, b) => (isLive(b.id) ? 1 : 0) - (isLive(a.id) ? 1 : 0));
        const liveCount = crew.members.filter(m => isLive(m.id)).length;
        return `
        <div class="cr-section">
          <div class="cr-header">
            <div class="cr-logo"><img src="${crew.logo}" onerror="this.style.display='none'"></div>
            <div>
              <div class="cr-name">${crew.name}</div>
              <div class="cr-since">SINCE ${crew.since}</div>
            </div>
            ${liveCount > 0 ? `<div class="cr-live-count">🔴 LIVE ${liveCount}명</div>` : ""}
          </div>
          <div class="cr-summary">총원 <b>${crew.members.length}명</b></div>
          ${boss ? `
          <a class="cr-boss" href="https://www.sooplive.co.kr/${boss.id}" target="_blank">
            <div class="boss-ph-wrap">
              <div class="boss-ph ${isLive(boss.id) ? "live-ring" : ""}">
                <img src="${boss.img}" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:20px;color:#64748b;background:#252836\\'>${boss.n[0]}</div>'">
              </div>
              ${isLive(boss.id) ? '<span class="live-tag">LIVE</span>' : ""}
            </div>
            <div>
              <span class="badge" style="background:${ROLE_COLORS[boss.r] || "#64748b"}">${boss.r}</span>
              <div class="boss-nm">${boss.n}</div>
              ${isLive(boss.id) ? `<div class="live-title">${liveData[boss.id].title}</div>` : ""}
            </div>
          </a>` : ""}
          <div class="members">
            ${others.map(m => `
            <a class="mem" href="https://www.sooplive.co.kr/${m.id}" target="_blank">
              <div class="mem-ph-wrap">
                <div class="mem-ph ${isLive(m.id) ? "live-ring" : ""}">
                  <img src="${m.img}" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:18px;color:#64748b;background:#252836\\'>${m.n[0]}</div>'">
                </div>
                ${isLive(m.id) ? '<span class="live-tag">LIVE</span>' : ""}
              </div>
              <span class="badge" style="background:${ROLE_COLORS[m.r] || "#64748b"}">${m.r}</span>
              <span class="mem-nm">${m.n}</span>
            </a>`).join("")}
          </div>
        </div>`;
      }).join("")}
      <div class="cr-footer">
        YB/YXL 크루 현황판 — <a href="https://poong-chi.vercel.app/" target="_blank">실시간 버전 바로가기</a>
      </div>
    `;
  }

  // Init
  async function init() {
    render(); // render first with no live data
    await fetchLive();
    render(); // re-render with live data
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
