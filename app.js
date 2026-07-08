/* ==========================================================
   VEGALTA 仙台 Player & Formation Tracker (PWA / vanilla JS)
   データは端末内 localStorage のみに保存。オフラインで動作。
========================================================== */

const POS_COLOR = { GK: "#5AA9E6", DF: "#6FCF97", MF: "#F2C94C", FW: "#EB5757" };
const COMPETITIONS = ["J1リーグ", "J2リーグ", "J3リーグ", "天皇杯", "ルヴァンカップ", "その他"];
const SEASON_ROUNDS = 38;
const STORAGE_KEY = "vegalta_pwa_state_v1";

const FORMATIONS = {
  "4-4-2": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 15, y: 72 }, { id: "df2", pos: "DF", x: 38, y: 76 },
    { id: "df3", pos: "DF", x: 62, y: 76 }, { id: "df4", pos: "DF", x: 85, y: 72 },
    { id: "mf1", pos: "MF", x: 15, y: 45 }, { id: "mf2", pos: "MF", x: 38, y: 48 },
    { id: "mf3", pos: "MF", x: 62, y: 48 }, { id: "mf4", pos: "MF", x: 85, y: 45 },
    { id: "fw1", pos: "FW", x: 38, y: 15 }, { id: "fw2", pos: "FW", x: 62, y: 15 },
  ],
  "4-3-3": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 15, y: 72 }, { id: "df2", pos: "DF", x: 38, y: 76 },
    { id: "df3", pos: "DF", x: 62, y: 76 }, { id: "df4", pos: "DF", x: 85, y: 72 },
    { id: "mf1", pos: "MF", x: 30, y: 50 }, { id: "mf2", pos: "MF", x: 50, y: 55 }, { id: "mf3", pos: "MF", x: 70, y: 50 },
    { id: "fw1", pos: "FW", x: 20, y: 18 }, { id: "fw2", pos: "FW", x: 50, y: 12 }, { id: "fw3", pos: "FW", x: 80, y: 18 },
  ],
  "4-2-3-1": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 15, y: 72 }, { id: "df2", pos: "DF", x: 38, y: 76 },
    { id: "df3", pos: "DF", x: 62, y: 76 }, { id: "df4", pos: "DF", x: 85, y: 72 },
    { id: "dm1", pos: "MF", x: 35, y: 58 }, { id: "dm2", pos: "MF", x: 65, y: 58 },
    { id: "am1", pos: "MF", x: 20, y: 32 }, { id: "am2", pos: "MF", x: 50, y: 28 }, { id: "am3", pos: "MF", x: 80, y: 32 },
    { id: "fw1", pos: "FW", x: 50, y: 12 },
  ],
  "3-4-2-1": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 25, y: 75 }, { id: "df2", pos: "DF", x: 50, y: 78 }, { id: "df3", pos: "DF", x: 75, y: 75 },
    { id: "mf1", pos: "MF", x: 12, y: 50 }, { id: "mf2", pos: "MF", x: 37, y: 52 },
    { id: "mf3", pos: "MF", x: 63, y: 52 }, { id: "mf4", pos: "MF", x: 88, y: 50 },
    { id: "am1", pos: "MF", x: 35, y: 25 }, { id: "am2", pos: "MF", x: 65, y: 25 },
    { id: "fw1", pos: "FW", x: 50, y: 10 },
  ],
  "3-5-2": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 25, y: 75 }, { id: "df2", pos: "DF", x: 50, y: 78 }, { id: "df3", pos: "DF", x: 75, y: 75 },
    { id: "mf1", pos: "MF", x: 10, y: 50 }, { id: "mf2", pos: "MF", x: 30, y: 48 }, { id: "mf3", pos: "MF", x: 50, y: 52 },
    { id: "mf4", pos: "MF", x: 70, y: 48 }, { id: "mf5", pos: "MF", x: 90, y: 50 },
    { id: "fw1", pos: "FW", x: 38, y: 15 }, { id: "fw2", pos: "FW", x: 62, y: 15 },
  ],
  "5-3-2": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 10, y: 70 }, { id: "df2", pos: "DF", x: 30, y: 76 }, { id: "df3", pos: "DF", x: 50, y: 80 },
    { id: "df4", pos: "DF", x: 70, y: 76 }, { id: "df5", pos: "DF", x: 90, y: 70 },
    { id: "mf1", pos: "MF", x: 25, y: 48 }, { id: "mf2", pos: "MF", x: 50, y: 50 }, { id: "mf3", pos: "MF", x: 75, y: 48 },
    { id: "fw1", pos: "FW", x: 38, y: 15 }, { id: "fw2", pos: "FW", x: 62, y: 15 },
  ],
  "3-1-4-2": [
    { id: "gk", pos: "GK", x: 50, y: 92 },
    { id: "df1", pos: "DF", x: 25, y: 75 }, { id: "df2", pos: "DF", x: 50, y: 78 }, { id: "df3", pos: "DF", x: 75, y: 75 },
    { id: "dm1", pos: "MF", x: 50, y: 62 },
    { id: "mf1", pos: "MF", x: 12, y: 42 }, { id: "mf2", pos: "MF", x: 37, y: 40 },
    { id: "mf3", pos: "MF", x: 63, y: 40 }, { id: "mf4", pos: "MF", x: 88, y: 42 },
    { id: "fw1", pos: "FW", x: 38, y: 15 }, { id: "fw2", pos: "FW", x: 62, y: 15 },
  ],
};

/* ---------------- helpers ---------------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const posOrder = (pos) => ({ GK: 0, DF: 1, MF: 2, FW: 3 }[pos] ?? 4);
const posFullName = (pos) => ({ GK: "GOALKEEPER", DF: "DEFENDER", MF: "MIDFIELDER", FW: "FORWARD" }[pos]);
const esc = (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function blankMatch(round) {
  return {
    id: uid(), round: round ?? null, date: "", kickoff: "", opponent: "", opponentId: null, competition: COMPETITIONS[0],
    homeAway: "H", scoreFor: "", scoreAgainst: "", formation: "4-4-2", lineup: {},
    bench: Array(9).fill(null), stats: {}, note: "",
  };
}
function buildSeasonTemplates() {
  return Array.from({ length: SEASON_ROUNDS }, (_, i) => blankMatch(i + 1));
}
function normalizeMatch(m) {
  return {
    ...blankMatch(m.round ?? null), ...m,
    lineup: m.lineup || {},
    bench: m.bench && m.bench.length === 9 ? m.bench : Array(9).fill(null),
    stats: m.stats || {},
  };
}
function aggregateStats(players, matches) {
  const totals = {};
  players.forEach((p) => { totals[p.id] = { goals: 0, assists: 0, appearances: 0, minutes: 0, yellowCards: 0, redCards: 0 }; });
  matches.forEach((m) => {
    Object.entries(m.stats || {}).forEach(([pid, s]) => {
      if (!totals[pid]) return;
      totals[pid].goals += Number(s.goals) || 0;
      totals[pid].assists += Number(s.assists) || 0;
      totals[pid].minutes += Number(s.minutes) || 0;
      totals[pid].yellowCards += Number(s.yellow) || 0;
      totals[pid].redCards += Number(s.red) || 0;
      if ((Number(s.minutes) || 0) > 0) totals[pid].appearances += 1;
    });
  });
  return players.map((p) => ({ ...p, ...totals[p.id] }));
}
function setByPath(root, pathStr, value) {
  const parts = pathStr.split(".");
  let obj = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined || obj[parts[i]] === null) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
}

/* ---------------- storage ---------------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const players = data.players || [];
      const opponents = data.opponents || [];
      const rawMatches = data.matches && data.matches.length ? data.matches : buildSeasonTemplates();
      return { players, opponents, matches: rawMatches.map(normalizeMatch), updatedAt: data.updatedAt || 0 };
    }
  } catch (e) { /* fall through to fresh state */ }
  return { players: [], opponents: [], matches: buildSeasonTemplates(), updatedAt: 0 };
}
function saveState() {
  STATE.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players: STATE.players, opponents: STATE.opponents, matches: STATE.matches, updatedAt: STATE.updatedAt,
    }));
  } catch (e) { console.error("save failed", e); }
  scheduleSyncPush();
}

/* ---------------- cloud sync (Firebase Auth + Firestore) ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCKZfC6PtJFVEIgNYEy5nIxrtaw68rinRo",
  authDomain: "delivery-2cac6.firebaseapp.com",
  projectId: "delivery-2cac6",
  storageBucket: "delivery-2cac6.firebasestorage.app",
  messagingSenderId: "441822108642",
  appId: "1:441822108642:web:2ea69e84df557df5d777bb",
};
let fbApp = null, fbAuth = null, fbDb = null, fbAvailable = false;
try {
  if (typeof firebase !== "undefined") {
    fbApp = firebase.initializeApp(firebaseConfig);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
    fbAvailable = true;
  }
} catch (e) { console.error("Firebase init failed", e); }

let currentUser = null;
let unsubscribeSnapshot = null;
let suppressNextPush = false;
let pushTimer = null;

function firestoreDocRef(uid) {
  return fbDb.collection("users").doc(uid).collection("appData").doc("vegalta-tracker");
}

let lastStatusKey = "";
let lastStatusAt = 0;
function setSyncStatus(state, message) {
  const now = Date.now();
  const key = state + "|" + message;
  if (key === lastStatusKey && now - lastStatusAt < 1500) return; // 短時間の連続同一更新は無視（再接続ループ対策）
  lastStatusKey = key; lastStatusAt = now;
  STATE.syncStatus = { state, message: message || "", at: now };
  const el = document.getElementById("syncIndicator");
  if (el) {
    el.textContent = state === "syncing" ? " …" : state === "success" ? " ✓" : state === "error" ? " !" : "";
    el.style.color = state === "error" ? "#EB5757" : state === "success" ? "#6FCF97" : "var(--dim)";
  }
  if (STATE.syncModal) render();
}

function applyRemoteData(remote) {
  STATE.players = remote.players || [];
  STATE.opponents = remote.opponents || [];
  STATE.matches = (remote.matches && remote.matches.length ? remote.matches : buildSeasonTemplates()).map(normalizeMatch);
  STATE.updatedAt = remote.updatedAt || Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players: STATE.players, opponents: STATE.opponents, matches: STATE.matches, updatedAt: STATE.updatedAt,
    }));
  } catch (e) { /* ignore */ }
}

async function pushToFirestore() {
  if (!currentUser || !fbAvailable) return;
  try {
    await firestoreDocRef(currentUser.uid).set({
      players: STATE.players, opponents: STATE.opponents, matches: STATE.matches, updatedAt: STATE.updatedAt || Date.now(),
    });
    setSyncStatus("success", `${currentUser.displayName || "Google"} さんと同期済み`);
  } catch (e) {
    console.error(e);
    const raw = e.message || "";
    if (raw.includes("exceeds the maximum allowed size") || raw.includes("maximum size")) {
      setSyncStatus("error", "データ量が上限（1MB）を超えています。");
    } else {
      setSyncStatus("error", "クラウドへの送信に失敗しました：" + (e.code || raw || "不明なエラー"));
    }
  }
}

function scheduleSyncPush() {
  if (!currentUser) return;
  if (suppressNextPush) { suppressNextPush = false; return; }
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushToFirestore(); }, 500);
}

function startRealtimeSync(user) {
  currentUser = user;
  setSyncStatus("syncing", "クラウドと接続中…");
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  let settled = false;
  const timeoutId = setTimeout(() => {
    if (!settled) {
      setSyncStatus("error", "接続がタイムアウトしました。古いキャッシュが原因の可能性があります。サイトのデータを削除して開き直してください。");
    }
  }, 9000);
  unsubscribeSnapshot = firestoreDocRef(user.uid).onSnapshot((doc) => {
    settled = true;
    clearTimeout(timeoutId);
    if (doc.exists) {
      const remote = doc.data();
      if ((remote.updatedAt || 0) > (STATE.updatedAt || 0)) {
        suppressNextPush = true;
        applyRemoteData(remote);
        render();
      }
      setSyncStatus("success", `${user.displayName || "Google"} さんと同期中`);
    } else {
      pushToFirestore();
    }
  }, (err) => {
    settled = true;
    clearTimeout(timeoutId);
    console.error(err);
    setSyncStatus("error", "同期エラー：" + (err.code || "") + " " + (err.message || ""));
  });
}
function stopRealtimeSync() {
  if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
  currentUser = null;
}
function signIn() {
  if (!fbAvailable) { setSyncStatus("error", "Firebaseの読み込みに失敗しました"); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  setSyncStatus("syncing", "ログイン中…");
  fbAuth.signInWithPopup(provider).catch((e) => {
    console.error(e);
    if (e.code === "auth/popup-closed-by-user") {
      setSyncStatus("error", "ログインウィンドウが閉じられました。もう一度お試しください。");
    } else if (e.code === "auth/popup-blocked") {
      setSyncStatus("error", "ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。");
    } else {
      setSyncStatus("error", "ログインに失敗しました：" + e.message);
    }
  });
}
function signOutUser() {
  stopRealtimeSync();
  if (fbAvailable) fbAuth.signOut();
  setSyncStatus("idle", "");
}
if (fbAvailable) {
  fbAuth.onAuthStateChanged((user) => {
    if (user) startRealtimeSync(user);
    else { stopRealtimeSync(); setSyncStatus("idle", ""); }
    if (STATE.syncModal) render();
  });
}

const loaded = loadState();
let STATE = {
  tab: "roster", playerModal: null, opponentModal: null, syncModal: null, syncStatus: { state: "idle", message: "", at: 0 },
  editingMatch: null, activeSlot: null, viewingMatchId: null,
  calendarMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
  players: loaded.players, opponents: loaded.opponents, matches: loaded.matches, updatedAt: loaded.updatedAt,
  standingsData: null, standingsLoading: false, standingsError: null,
};

function getOpponentById(id) { return STATE.opponents.find((o) => o.id === id); }
function emblemImg(emblem, size) {
  if (!emblem) return "";
  return `<img src="${emblem}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:6px;background:#131310;border:1px solid var(--border2);flex-shrink:0;">`;
}

function computePlayers() { return aggregateStats(STATE.players, STATE.matches); }

/* ---------------- small render helpers ---------------- */
function statChip(label, value) { return `<div class="stat-chip"><div class="v">${value || 0}</div><div class="l">${label}</div></div>`; }
function tagHTML(pos) { return `<span class="tag" style="background:${POS_COLOR[pos]}">${pos}</span>`; }
function avatarHTML(p, size) {
  const color = POS_COLOR[p.position] || "#9C9686";
  const initial = esc((p.name || "?").trim().charAt(0));
  const style = `width:${size}px;height:${size}px;border:2px solid ${color};box-shadow:0 0 0 3px rgba(0,0,0,0.4);`;
  if (p.photoUrl) {
    return `<div class="avatar" style="${style}"><img src="${esc(p.photoUrl)}" onerror="this.style.display='none'"/></div>`;
  }
  return `<div class="avatar" style="${style}"><span class="mono" style="font-weight:700;font-size:${Math.round(size * 0.38)}px;color:${color};">${initial}</span></div>`;
}
function moonSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M15.5 3C10 3 6 7.5 6 13c0 5 4 9 9.5 9-2-1.8-3.2-4.4-3.2-8.5S13.5 5.3 15.5 3z" fill="#F4B400"/></svg>`;
}
function crownSVG() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4B400" stroke-width="2"><path d="M2 18h20L19 8l-5 4-2-6-2 6-5-4-3 10z"/></svg>`;
}
function shortName(name) { return name.length > 6 ? name.slice(0, 6) + "…" : name; }
function homeAwayBadge(ha, large) {
  const isHome = ha === "H";
  return `<span class="ha-badge ${isHome ? "home" : "away"}${large ? " large" : ""}">${isHome ? "🏠 HOME" : "✈ AWAY"}</span>`;
}

function pitchSVG(formation, lineup, players, editable) {
  const slots = FORMATIONS[formation] || [];
  let defs = "";
  let inner = `<rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.4"/>
    <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.22)" stroke-width="0.4"/>
    <circle cx="50" cy="50" r="9" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.4"/>
    <rect x="27" y="3" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.4"/>
    <rect x="27" y="83" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.4"/>`;
  slots.forEach((slot) => {
    const pid = lineup[slot.id];
    const pl = pid ? players.find((p) => p.id === pid) : null;
    const color = POS_COLOR[slot.pos];
    const r = pl ? 6.5 : 5.5;
    const dash = pl ? "" : 'stroke-dasharray="1.4 1.2"';
    const clickAttr = editable ? `data-action="open-slot" data-slot-id="${slot.id}" style="cursor:pointer;"` : "";
    const hasPhoto = pl && pl.photoUrl;
    if (hasPhoto) {
      defs += `<clipPath id="pitchclip-${slot.id}"><circle cx="${slot.x}" cy="${slot.y}" r="${r}"/></clipPath>`;
    }
    inner += `<g ${clickAttr}>
      <circle cx="${slot.x}" cy="${slot.y}" r="${r}" fill="${pl ? "#131310" : "rgba(255,255,255,0.06)"}" stroke="${color}" stroke-width="${pl ? 1 : 0.6}" ${dash}/>
      ${hasPhoto ? `
        <image href="${esc(pl.photoUrl)}" x="${slot.x - r}" y="${slot.y - r}" width="${r * 2}" height="${r * 2}"
          clip-path="url(#pitchclip-${slot.id})" preserveAspectRatio="xMidYMid slice" onerror="this.style.display='none'"/>
        <circle cx="${slot.x + r * 0.72}" cy="${slot.y + r * 0.72}" r="2.6" fill="${color}" stroke="#131310" stroke-width="0.4"/>
        <text x="${slot.x + r * 0.72}" y="${slot.y + r * 0.72 + 1}" text-anchor="middle" font-size="2.6" font-weight="700" fill="#131310">${pl.number}</text>
      ` : (pl ? `<text x="${slot.x}" y="${slot.y + 1.8}" text-anchor="middle" font-size="5" font-weight="700" fill="${color}">${pl.number}</text>` : "")}
      <text x="${slot.x}" y="${slot.y + (pl ? 10.5 : 9.5)}" text-anchor="middle" font-size="3.3" fill="#F3EFE3" opacity="0.9">${esc(pl ? shortName(pl.name) : slot.pos)}</text>
    </g>`;
  });
  return `<svg viewBox="0 0 100 100" style="width:100%;aspect-ratio:0.72;background:#163326;border-radius:12px;border:1px solid #24462f;">${defs ? `<defs>${defs}</defs>` : ""}${inner}</svg>`;
}

/* ---------------- tab renderers ---------------- */
function navHTML() {
  const tabs = [
    ["roster", "👥", "選手"],
    ["opponents", "🛡", "相手"],
    ["matches", "📋", "記録"],
    ["calendar", "📅", "日程"],
    ["standings", "📊", "順位表"],
    ["leaders", "🏆", "個人成績"],
  ];
  return tabs.map(([id, icon, label]) =>
    `<button class="${STATE.tab === id ? "active" : ""}" data-action="tab" data-tab="${id}">
      <span class="nav-icon">${icon}</span><span>${label}</span>
    </button>`).join("");
}

function renderRoster() {
  const players = computePlayers();
  let html = `<div class="row-between">
    <div><h2 class="section">選手名鑑</h2><div class="section-sub">${players.length} 名登録</div></div>
    <button class="btn-gold" data-action="add-player">＋ 選手を追加</button>
  </div>`;
  if (players.length === 0) {
    html += `<div class="empty">まだ選手が登録されていません。「選手を追加」から選手名鑑を作りましょう。</div>`;
  }
  ["GK", "DF", "MF", "FW"].forEach((pos) => {
    const list = players.filter((p) => p.position === pos).sort((a, b) => a.number - b.number);
    if (list.length === 0) return;
    html += `<div class="pos-group">
      <div class="pos-head"><div class="dot" style="background:${POS_COLOR[pos]}"></div><span class="label-mono">${posFullName(pos)}</span></div>
      <div class="grid-cards">`;
    list.forEach((p) => {
      html += `<div class="card" data-action="edit-player" data-id="${p.id}">
        <div style="display:flex;gap:12px;align-items:center;">
          ${avatarHTML(p, 56)}
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="mono" style="color:var(--gold);font-weight:700;font-size:15px;">${p.number}</span>${tagHTML(p.position)}
            </div>
            <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</div>
          </div>
        </div>
        <div class="stats-grid" style="margin-top:12px;border-top:1px solid #26261e;padding-top:10px;">
          ${statChip("出場", p.appearances)}${statChip("得点", p.goals)}${statChip("アシスト", p.assists)}${statChip("時間(分)", p.minutes)}${statChip("🟨", p.yellowCards)}${statChip("🟥", p.redCards)}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  });
  return html;
}

function renderPlayerModal() {
  const d = STATE.playerModal;
  const isEdit = !!d.id;
  const computed = isEdit ? computePlayers().find((p) => p.id === d.id) : null;
  return `<div class="overlay">
    <div class="panel">
      <div class="panel-head"><h3>${isEdit ? "選手を編集" : "選手を追加"}</h3><button class="icon-btn" data-action="close-player-modal">✕</button></div>
      <div class="panel-body">
        <div class="three-col">
          <label class="field" style="max-width:90px;">背番号<input type="number" data-bind="playerModal.number" value="${esc(d.number)}" placeholder="10"></label>
          <label class="field" style="flex:2;">ポジション<select data-bind="playerModal.position">
            <option value="GK" ${d.position === "GK" ? "selected" : ""}>GK ゴールキーパー</option>
            <option value="DF" ${d.position === "DF" ? "selected" : ""}>DF ディフェンダー</option>
            <option value="MF" ${d.position === "MF" ? "selected" : ""}>MF ミッドフィルダー</option>
            <option value="FW" ${d.position === "FW" ? "selected" : ""}>FW フォワード</option>
          </select></label>
        </div>
        <label class="field">選手名<input type="text" data-bind="playerModal.name" value="${esc(d.name)}" placeholder="例）名波 太郎"></label>
        <label class="field">顔写真URL（任意）<input type="text" data-bind="playerModal.photoUrl" value="${esc(d.photoUrl)}" placeholder="https://..."></label>
        ${isEdit ? `<div>
          <div class="stats-grid" style="background:var(--night);border-radius:8px;padding:10px 12px;">
            ${statChip("出場", computed ? computed.appearances : 0)}${statChip("得点", computed ? computed.goals : 0)}${statChip("アシスト", computed ? computed.assists : 0)}${statChip("時間(分)", computed ? computed.minutes : 0)}${statChip("🟨警告", computed ? computed.yellowCards : 0)}${statChip("🟥退場", computed ? computed.redCards : 0)}
          </div>
          <p style="font-size:11px;color:var(--dim);margin-top:6px;line-height:1.6;">出場・得点・アシスト・出場時間・カードは「フォーメーション記録」で入力した各試合のスタッツから自動集計されます。</p>
        </div>` : ""}
      </div>
      <div class="panel-foot">
        ${isEdit ? `<button class="btn-ghost btn-danger" data-action="delete-player" data-id="${d.id}">🗑 削除</button>` : "<span></span>"}
        <button class="btn-gold" data-action="save-player">保存する</button>
      </div>
    </div>
  </div>`;
}

function renderOpponentsTab() {
  const list = [...STATE.opponents].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  let html = `<div class="row-between">
    <div><h2 class="section">対戦相手一覧</h2><div class="section-sub">${list.length} チーム登録</div></div>
    <button class="btn-gold" data-action="add-opponent">＋ 対戦相手を追加</button>
  </div>`;
  if (list.length === 0) {
    html += `<div class="empty">まだ対戦相手が登録されていません。「対戦相手を追加」からチーム名とエンブレム画像を登録すると、試合記録でリストから選べるようになります。</div>`;
  } else {
    html += `<div class="grid-cards">`;
    list.forEach((o) => {
      html += `<div class="card" data-action="edit-opponent" data-id="${o.id}">
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="width:48px;height:48px;border-radius:10px;background:#131310;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
            ${o.emblem ? `<img src="${o.emblem}" style="width:100%;height:100%;object-fit:contain;">` : moonSVG(18)}
          </div>
          <div style="font-weight:600;font-size:15px;">${esc(o.name)}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  return html;
}

function renderOpponentModal() {
  const d = STATE.opponentModal;
  const isEdit = !!d.id;
  return `<div class="overlay">
    <div class="panel">
      <div class="panel-head"><h3>${isEdit ? "対戦相手を編集" : "対戦相手を追加"}</h3><button class="icon-btn" data-action="close-opponent-modal">✕</button></div>
      <div class="panel-body">
        <label class="field">チーム名<input type="text" data-bind="opponentModal.name" value="${esc(d.name)}" placeholder="例）モンテディオ山形"></label>
        <label class="field">エンブレム画像URL（任意）<input type="text" data-bind="opponentModal.emblem" value="${esc(d.emblem)}" placeholder="https://..."></label>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:64px;height:64px;border-radius:10px;background:var(--night);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
            ${d.emblem ? `<img src="${esc(d.emblem)}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">` : `<span style="font-size:10px;color:var(--dim);">未設定</span>`}
          </div>
          <p style="font-size:11px;color:var(--dim);line-height:1.6;flex:1;">URLを入力するとプレビューが表示されます。クラウド同期の対象になります。</p>
        </div>
      </div>
      <div class="panel-foot">
        ${isEdit ? `<button class="btn-ghost btn-danger" data-action="delete-opponent" data-id="${d.id}">🗑 削除</button>` : "<span></span>"}
        <button class="btn-gold" data-action="save-opponent">保存する</button>
      </div>
    </div>
  </div>`;
}

function renderMatches() {
  const players = computePlayers();
  const recorded = STATE.matches.filter((m) => m.opponent).length;
  let html = `<div class="row-between">
    <div><h2 class="section">試合記録とフォーメーション</h2>
      <div class="section-sub">第1節〜第${SEASON_ROUNDS}節のテンプレート常設 ・ 記録済み ${recorded} 試合</div></div>
    <button class="btn-gold" data-action="new-match">＋ カップ戦などを追加</button>
  </div>`;

  if (!STATE.editingMatch) {
    if (STATE.matches.length === 0) {
      html += `<div class="empty">試合の記録がありません。「カップ戦などを追加」からフォーメーションを組んでみましょう。</div>`;
    } else {
      const sorted = [...STATE.matches].sort((a, b) => {
        const ar = a.round ?? 9999, br = b.round ?? 9999;
        if (ar !== br) return ar - br;
        return (b.date || "").localeCompare(a.date || "");
      });
      sorted.forEach((m) => {
        html += `<div class="card" style="opacity:${m.opponent ? 1 : 0.55}" data-action="open-match" data-id="${m.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="mono" style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span>${m.round ? `第${m.round}節` : "追加"} ・ ${esc(m.date) || "日付未設定"}${m.kickoff ? ` ${esc(m.kickoff)}〜` : ""} ・ ${esc(m.competition)}</span>
                ${homeAwayBadge(m.homeAway)}
              </div>
              <div style="font-weight:700;font-size:17px;margin-top:6px;display:flex;align-items:center;gap:8px;">
                仙台 <span style="color:var(--gold);">${esc(m.scoreFor) || "-"} – ${esc(m.scoreAgainst) || "-"}</span> ${esc(m.opponent) || "対戦相手未設定"}
                ${m.opponentId && getOpponentById(m.opponentId) ? emblemImg(getOpponentById(m.opponentId).emblem, 22) : ""}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="mono" style="font-size:12px;background:#26261e;padding:4px 9px;border-radius:6px;color:var(--gold);">${m.formation}</span>
              <span style="color:#5a5648;">›</span>
            </div>
          </div>
        </div>`;
      });
    }
  } else {
    html += renderMatchEditor(STATE.editingMatch, players);
  }
  return html;
}

function renderMatchEditor(m, players) {
  const formationButtons = Object.keys(FORMATIONS).map((f) =>
    `<button class="${m.formation === f ? "active" : ""}" data-action="pick-formation" data-formation="${f}">${f}</button>`).join("");
  return `<div class="card static">
    <label class="field" style="margin-bottom:10px;">対戦相手をリストから選ぶ（任意）
      <select data-action="pick-opponent">
        <option value="">— リストにない相手／自由入力 —</option>
        ${[...STATE.opponents].sort((a, b) => a.name.localeCompare(b.name, "ja")).map((o) =>
          `<option value="${o.id}" ${m.opponentId === o.id ? "selected" : ""}>${esc(o.name)}</option>`).join("")}
      </select>
    </label>
    <div class="two-col" style="margin-bottom:14px;">
      <label class="field">節（リーグ戦以外は空欄でOK）<input type="number" min="1" max="${SEASON_ROUNDS}" data-bind="editingMatch.round" value="${m.round ?? ""}" placeholder="例）1"></label>
      <label class="field">日付<input type="date" data-bind="editingMatch.date" value="${esc(m.date)}"></label>
      <label class="field">試合時間（キックオフ）<input type="time" data-bind="editingMatch.kickoff" value="${esc(m.kickoff)}"></label>
      <label class="field">大会<select data-bind="editingMatch.competition">${COMPETITIONS.map((c) => `<option ${m.competition === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      <label class="field">対戦相手名
        <div style="display:flex;align-items:center;gap:8px;">
          ${m.opponentId && getOpponentById(m.opponentId) ? emblemImg(getOpponentById(m.opponentId).emblem, 28) : ""}
          <input type="text" data-bind="editingMatch.opponent" value="${esc(m.opponent)}" placeholder="例）モンテディオ山形" style="flex:1;">
        </div>
      </label>
      <label class="field">ホーム／アウェイ
        <div class="ha-toggle">
          <button type="button" class="ha-btn home ${m.homeAway === "H" ? "active" : ""}" data-action="pick-homeaway" data-value="H">🏠 HOME</button>
          <button type="button" class="ha-btn away ${m.homeAway === "A" ? "active" : ""}" data-action="pick-homeaway" data-value="A">✈ AWAY</button>
        </div>
      </label>
      <label class="field">得点（仙台）<input type="number" min="0" data-bind="editingMatch.scoreFor" value="${esc(m.scoreFor)}"></label>
      <label class="field">失点<input type="number" min="0" data-bind="editingMatch.scoreAgainst" value="${esc(m.scoreAgainst)}"></label>
    </div>
    <label class="field" style="margin-bottom:12px;">フォーメーション<div class="formation-pick">${formationButtons}</div></label>
    <div class="pitch-wrap">${pitchSVG(m.formation, m.lineup, players, true)}</div>
    <p style="text-align:center;font-size:12px;color:var(--dim);margin-top:8px;">ポジションをタップして選手を配置</p>
    ${renderMatchRoster(m, players)}
    <label class="field" style="margin-top:10px;">メモ（任意）<textarea data-bind="editingMatch.note" placeholder="得点者、交代など" style="min-height:60px;resize:vertical;">${esc(m.note)}</textarea></label>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
      <button class="btn-ghost" data-action="cancel-edit-match">キャンセル</button>
      <button class="btn-gold" data-action="save-match">保存する</button>
    </div>
  </div>`;
}

function miniStatInput(label, value, bindPath, max) {
  return `<label style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:9px;color:var(--dim);white-space:nowrap;">${label}
    <input type="number" min="0" ${max ? `max="${max}"` : ""} data-bind="${bindPath}" value="${value}" style="width:38px;padding:5px 2px;text-align:center;font-size:12px;">
  </label>`;
}
function statInputGroup(stat, bindPrefix) {
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:7px;padding-top:7px;border-top:1px solid #222219;">
    ${miniStatInput("得点", stat.goals, `${bindPrefix}.goals`)}
    ${miniStatInput("アシスト", stat.assists, `${bindPrefix}.assists`)}
    ${miniStatInput("出場(分)", stat.minutes, `${bindPrefix}.minutes`, 120)}
    ${miniStatInput("🟨警告", stat.yellow, `${bindPrefix}.yellow`, 2)}
    ${miniStatInput("🟥退場", stat.red, `${bindPrefix}.red`, 1)}
  </div>`;
}
const emptyStat = { goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0 };

function renderMatchRoster(m, players) {
  const slots = FORMATIONS[m.formation] || [];
  const starters = slots.filter((s) => m.lineup[s.id])
    .map((s) => ({ slot: s, player: players.find((p) => p.id === m.lineup[s.id]) }))
    .filter((x) => x.player)
    .sort((a, b) => posOrder(a.slot.pos) - posOrder(b.slot.pos) || a.player.number - b.player.number);
  const bench = m.bench && m.bench.length === 9 ? m.bench : Array(9).fill(null);
  const usedIds = new Set([...Object.values(m.lineup), ...bench.filter(Boolean)]);

  let html = `<div style="margin-top:22px;">
    <div style="margin-bottom:8px;"><span class="label-mono">出場選手一覧（GK→DF→MF→FW）</span></div>
    <div style="margin-bottom:22px;">`;
  if (starters.length === 0) html += `<p style="font-size:12px;color:var(--dim);">上のピッチ図で先発イレブンを配置してください</p>`;
  starters.forEach(({ slot, player }) => {
    const s = { ...emptyStat, ...(m.stats[player.id] || {}) };
    html += `<div class="stat-row" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;align-items:center;gap:8px;">
        ${avatarHTML(player, 30)}
        <div style="min-width:0;flex:1;">
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="mono" style="color:var(--gold);font-size:12px;font-weight:700;">${player.number}</span>${tagHTML(slot.pos)}
          </div>
          <div class="name">${esc(player.name)}</div>
        </div>
      </div>
      ${statInputGroup(s, `editingMatch.stats.${player.id}`)}
    </div>`;
  });
  html += `</div><div class="label-mono" style="margin-bottom:8px;">リザーブメンバー（9名）</div><div>`;
  bench.forEach((pid, idx) => {
    const player = players.find((p) => p.id === pid);
    const candidates = players.filter((p) => p.id === pid || !usedIds.has(p.id));
    const options = candidates.slice().sort((a, b) => a.number - b.number)
      .map((p) => `<option value="${p.id}" ${p.id === pid ? "selected" : ""}>${p.number} ${esc(p.name)}（${p.position}）</option>`).join("");
    const s = player ? { ...emptyStat, ...(m.stats[player.id] || {}) } : null;
    html += `<div class="stat-row" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="mono" style="width:16px;font-size:11px;color:var(--dim);flex-shrink:0;">${idx + 1}</span>
        <select style="max-width:190px;" data-action="bench-select" data-index="${idx}">
          <option value="">— 選手を選択 —</option>${options}
        </select>
        ${player ? tagHTML(player.position) : ""}
      </div>
      ${player ? statInputGroup(s, `editingMatch.stats.${player.id}`) : ""}
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

function renderSlotPicker() {
  const slot = STATE.activeSlot;
  const candidates = [...STATE.players].sort((a, b) => (a.position === slot.pos ? -1 : 1) - (b.position === slot.pos ? -1 : 1) || a.number - b.number);
  return `<div class="overlay">
    <div class="panel" style="max-width:380px;max-height:70vh;">
      <div class="panel-head"><h3>${slot.pos} のポジションに配置</h3><button class="icon-btn" data-action="close-slot-picker">✕</button></div>
      <div style="overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:4px;">
        <button class="list-item" style="color:var(--muted);" data-action="pick-slot-player" data-player-id="">— 未設定にする —</button>
        ${candidates.map((p) => `<button class="list-item" data-action="pick-slot-player" data-player-id="${p.id}">
          <span class="mono" style="color:var(--gold);width:26px;display:inline-block;">${p.number}</span>${tagHTML(p.position)}<span style="margin-left:8px;">${esc(p.name)}</span>
        </button>`).join("")}
      </div>
    </div>
  </div>`;
}

function renderViewingModal() {
  const m = STATE.matches.find((x) => x.id === STATE.viewingMatchId);
  if (!m) return "";
  const players = computePlayers();
  return `<div class="overlay">
    <div class="panel" style="max-width:420px;">
      <div class="panel-head">
        <h3 style="display:flex;align-items:center;gap:8px;">
          ${m.opponentId && getOpponentById(m.opponentId) ? emblemImg(getOpponentById(m.opponentId).emblem, 24) : ""}
          ${m.round ? `第${m.round}節　` : ""}${esc(m.date) || "日付未設定"}${m.kickoff ? ` ${esc(m.kickoff)}〜` : ""} vs ${esc(m.opponent) || "対戦相手未設定"}
        </h3>
        <button class="icon-btn" data-action="close-viewing">✕</button>
      </div>
      <div style="padding:16px 20px;">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">${homeAwayBadge(m.homeAway, true)}</div>
        <div class="pitch-wrap" style="max-width:320px;">${pitchSVG(m.formation, m.lineup, players, false)}</div>
        ${m.note ? `<p style="font-size:13px;color:var(--muted);margin-top:12px;white-space:pre-wrap;">${esc(m.note)}</p>` : ""}
        <div style="display:flex;justify-content:space-between;margin-top:16px;">
          <button class="btn-ghost btn-danger" data-action="delete-match" data-id="${m.id}">🗑 この記録を削除</button>
          <button class="btn-ghost" data-action="edit-match-from-view" data-id="${m.id}">✎ 編集</button>
        </div>
      </div>
    </div>
  </div>`;
}

function totalStat(label, value) { return `<div class="total-stat"><div class="v">${value}</div><div class="l">${label}</div></div>`; }
function leaderBoard(title, players, key, unit) {
  const ranked = players.filter((p) => (p[key] || 0) > 0 || players.length <= 5).sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, 5);
  const max = ranked[0] ? (ranked[0][key] || 1) : 1;
  let html = `<div class="card static">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">${moonSVG(16)}<span style="font-weight:700;font-size:15px;">${title}</span></div>`;
  if (ranked.length === 0) html += `<p style="font-size:12px;color:var(--dim);">データがありません</p>`;
  html += `<div style="display:flex;flex-direction:column;gap:10px;">`;
  ranked.forEach((p, i) => {
    html += `<div style="display:flex;align-items:center;gap:10px;">
      <div style="width:20px;text-align:center;">${i === 0 ? crownSVG() : `<span class="mono" style="color:var(--dim);font-size:13px;">${i + 1}</span>`}</div>
      ${avatarHTML(p, 34)}
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</span>
          <span class="mono" style="color:var(--gold);font-weight:700;">${p[key] || 0}<span style="font-size:10px;color:var(--muted);">${unit}</span></span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${((p[key] || 0) / max) * 100}%;background:${i === 0 ? "#F4B400" : "#6FCF97"};"></div></div>
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function homeAwayDot(ha) {
  const isHome = ha === "H";
  return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isHome ? "#F4B400" : "#8a8a76"};flex-shrink:0;"></span>`;
}
function matchesByDate(matches) {
  const map = {};
  matches.forEach((m) => {
    if (!m.date) return;
    (map[m.date] = map[m.date] || []).push(m);
  });
  return map;
}
function renderCalendarTab() {
  const { year, month } = STATE.calendarMonth;
  const map = matchesByDate(STATE.matches);
  const startWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  let html = `<div class="row-between">
    <div><h2 class="section">カレンダー</h2><div class="section-sub">試合の日程をひと目で確認</div></div>
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0;">
    <button class="btn-ghost" data-action="cal-prev">‹ 前月</button>
    <div class="mono" style="font-weight:700;font-size:16px;">${year}年 ${month + 1}月</div>
    <button class="btn-ghost" data-action="cal-next">次月 ›</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px;">
    ${["日", "月", "火", "水", "木", "金", "土"].map((w, i) =>
      `<div style="text-align:center;font-size:11px;font-weight:700;color:${i === 0 ? "#EB5757" : i === 6 ? "#5AA9E6" : "var(--dim)"};">${w}</div>`).join("")}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;

  cells.forEach((d) => {
    if (d === null) { html += `<div></div>`; return; }
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const dayMatches = map[dateStr] || [];
    const m = dayMatches[0];
    const isToday = dateStr === todayStr;
    html += `<div class="card" style="padding:5px 4px;min-height:62px;cursor:${m ? "pointer" : "default"};
      ${isToday ? "border-color:var(--gold);" : ""}" ${m ? `data-action="open-match" data-id="${m.id}"` : ""}>
      <div class="mono" style="font-size:11px;color:${isToday ? "var(--gold)" : "var(--dim)"};font-weight:${isToday ? "700" : "400"};">${d}</div>
      ${m ? `
        <div style="margin-top:3px;display:flex;align-items:center;gap:3px;">
          ${homeAwayDot(m.homeAway)}
          <span style="font-size:9px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(m.opponent || "?")}</span>
        </div>
        ${(m.scoreFor || m.scoreAgainst) ? `<div class="mono" style="font-size:10px;color:var(--gold);margin-top:1px;">${esc(m.scoreFor) || "-"}-${esc(m.scoreAgainst) || "-"}</div>` : ""}
      ` : ""}
    </div>`;
  });
  html += `</div>`;
  return html;
}

/* ---------------- J2 league standings (data/standings.json, fetched by GitHub Actions) ---------------- */
async function loadStandings() {
  STATE.standingsLoading = true; STATE.standingsError = null; render();
  try {
    const res = await fetch(`data/standings.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    STATE.standingsData = await res.json();
  } catch (e) {
    console.error(e);
    STATE.standingsError = "順位表の読み込みに失敗しました。しばらくしてからもう一度お試しください。";
  } finally {
    STATE.standingsLoading = false; render();
  }
}
function formatUpdatedAt(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())} 時点`;
  } catch (e) { return ""; }
}
function renderStandingsTab() {
  const data = STATE.standingsData;
  let html = `<div class="row-between">
    <div><h2 class="section">${data && data.competition ? esc(data.competition) : "Ｊ２順位表"}</h2><div class="section-sub">${data ? (data.season ? esc(data.season) + "　" : "") + formatUpdatedAt(data.updatedAt) : "Ｊリーグ公式記録より自動取得"}</div></div>
    <button class="btn-ghost" data-action="refresh-standings">⟳ 更新</button>
  </div>`;
  if (STATE.standingsLoading && !data) { html += `<div class="empty">読み込み中…</div>`; return html; }
  if (STATE.standingsError && !data) { html += `<div class="empty">${esc(STATE.standingsError)}</div>`; return html; }
  if (!data || !data.teams || !data.teams.length) {
    html += `<div class="empty">順位表データがまだありません。<br>2026-27シーズン開幕（2026年9月頃予定）後、GitHub Actionsによる自動取得が実行されると表示されます。</div>`;
    return html;
  }
  const teams = [...data.teams].sort((a, b) => a.rank - b.rank);
  html += `<div class="card static" style="padding:0;overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="color:var(--muted);">
        <th style="padding:9px 6px;">順位</th>
        <th style="padding:9px 6px;text-align:left;">チーム</th>
        <th style="padding:9px 6px;">試合</th>
        <th style="padding:9px 6px;">勝</th>
        <th style="padding:9px 6px;">分</th>
        <th style="padding:9px 6px;">敗</th>
        <th style="padding:9px 6px;">得点</th>
        <th style="padding:9px 6px;">失点</th>
        <th style="padding:9px 6px;">得失点差</th>
        <th style="padding:9px 6px;color:var(--gold);">勝点</th>
      </tr></thead><tbody>
      ${teams.map((t) => `<tr style="border-top:1px solid var(--border);${t.highlight ? "background:rgba(244,180,0,0.10);" : ""}">
        <td style="padding:8px 6px;text-align:center;font-weight:700;${t.highlight ? "color:var(--gold);" : ""}">${t.rank}</td>
        <td style="padding:8px 6px;font-weight:${t.highlight ? 700 : 600};${t.highlight ? "color:var(--gold);" : ""}white-space:nowrap;">${esc(t.team)}</td>
        <td style="padding:8px 6px;text-align:center;">${t.played}</td>
        <td style="padding:8px 6px;text-align:center;">${t.win}</td>
        <td style="padding:8px 6px;text-align:center;">${t.draw}</td>
        <td style="padding:8px 6px;text-align:center;">${t.lose}</td>
        <td style="padding:8px 6px;text-align:center;">${t.goalsFor}</td>
        <td style="padding:8px 6px;text-align:center;">${t.goalsAgainst}</td>
        <td style="padding:8px 6px;text-align:center;">${t.goalDiff > 0 ? "+" : ""}${t.goalDiff}</td>
        <td style="padding:8px 6px;text-align:center;font-weight:700;color:var(--gold);">${t.points}</td>
      </tr>`).join("")}
      </tbody></table></div>
  <p style="font-size:11px;color:var(--dim);margin-top:10px;line-height:1.6;">出典：Ｊリーグ公式記録（data.j-league.or.jp）。GitHub Actionsが定期的に取得したデータを表示しています。</p>`;
  return html;
}

function renderLeaders() {
  const players = computePlayers();
  const totalApps = players.reduce((s, p) => s + (p.appearances || 0), 0);
  const totalGoals = players.reduce((s, p) => s + (p.goals || 0), 0);
  const totalAssists = players.reduce((s, p) => s + (p.assists || 0), 0);
  return `<h2 class="section" style="display:flex;align-items:center;gap:8px;">${moonSVG(16)} チームスタッツリーダー</h2>
    <div class="section-sub">シーズン累計</div>
    <div class="totals-grid">${totalStat("総出場数", totalApps)}${totalStat("総得点", totalGoals)}${totalStat("総アシスト", totalAssists)}</div>
    <div class="leaders-grid">
      ${leaderBoard("得点ランキング", players, "goals", "点")}
      ${leaderBoard("アシストランキング", players, "assists", "本")}
      ${leaderBoard("出場ランキング", players, "appearances", "試合")}
    </div>`;
}

/* ---------------- root render ---------------- */
function renderSyncModal() {
  const st = STATE.syncStatus || { state: "idle", message: "" };
  const statusColor = st.state === "error" ? "#EB5757" : st.state === "success" ? "#6FCF97" : "var(--muted)";
  const user = currentUser;
  return `<div class="overlay">
    <div class="panel" style="max-width:420px;">
      <div class="panel-head"><h3>☁ クラウド同期設定</h3><button class="icon-btn" data-action="close-sync-modal">✕</button></div>
      <div class="panel-body">
        <p style="font-size:12px;color:var(--muted);line-height:1.7;">
          Googleアカウントでログインすると、PCとスマホの間でデータがリアルタイムに自動同期されます。
        </p>
        ${user ? `
          <div style="display:flex;align-items:center;gap:10px;background:var(--night);border-radius:8px;padding:10px 12px;">
            ${user.photoURL ? `<img src="${esc(user.photoURL)}" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;">` : ""}
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(user.displayName || "")}</div>
              <div style="font-size:11px;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(user.email || "")}</div>
            </div>
            <button class="btn-ghost" data-action="sign-out">ログアウト</button>
          </div>
        ` : `
          <button class="btn-gold" data-action="sign-in" style="width:100%;justify-content:center;">Googleでログイン</button>
        `}
        ${st.message ? `<p style="font-size:12px;color:${statusColor};margin-top:10px;">${esc(st.message)}</p>` : ""}
      </div>
      <div class="panel-foot">
        <span></span>
        <button class="btn-ghost" data-action="close-sync-modal">閉じる</button>
      </div>
    </div>
  </div>`;
}

function render() {
  document.getElementById("nav").innerHTML = navHTML();
  const app = document.getElementById("app");
  let html = "";
  if (STATE.tab === "roster") html = renderRoster();
  else if (STATE.tab === "opponents") html = renderOpponentsTab();
  else if (STATE.tab === "matches") html = renderMatches();
  else if (STATE.tab === "calendar") html = renderCalendarTab();
  else if (STATE.tab === "standings") html = renderStandingsTab();
  else html = renderLeaders();
  app.innerHTML = html;
  if (STATE.playerModal) app.insertAdjacentHTML("beforeend", renderPlayerModal());
  if (STATE.opponentModal) app.insertAdjacentHTML("beforeend", renderOpponentModal());
  if (STATE.syncModal) app.insertAdjacentHTML("beforeend", renderSyncModal());
  if (STATE.editingMatch && STATE.activeSlot) app.insertAdjacentHTML("beforeend", renderSlotPicker());
  if (STATE.viewingMatchId) app.insertAdjacentHTML("beforeend", renderViewingModal());
}

/* ---------------- actions ---------------- */
function handleAction(el) {
  const action = el.dataset.action;
  const id = el.dataset.id;
  switch (action) {
    case "tab":
      STATE.tab = el.dataset.tab; STATE.editingMatch = null; STATE.viewingMatchId = null; STATE.activeSlot = null;
      if (STATE.tab === "standings" && !STATE.standingsData && !STATE.standingsLoading) loadStandings();
      render(); break;
    case "refresh-standings":
      loadStandings(); break;
    case "add-player":
      STATE.playerModal = { id: null, number: "", name: "", position: "MF", photoUrl: "" };
      render(); break;
    case "edit-player": {
      const p = STATE.players.find((x) => x.id === id);
      if (!p) return;
      STATE.playerModal = { id: p.id, number: p.number, name: p.name, position: p.position, photoUrl: p.photoUrl || "" };
      render(); break;
    }
    case "close-player-modal":
      STATE.playerModal = null; render(); break;
    case "save-player": {
      const d = STATE.playerModal;
      if (!d.name || !d.number) { alert("背番号と選手名を入力してください"); return; }
      const payload = { id: d.id || uid(), number: Number(d.number) || 0, name: d.name, position: d.position, photoUrl: d.photoUrl || "" };
      const idx = STATE.players.findIndex((x) => x.id === payload.id);
      if (idx >= 0) STATE.players[idx] = payload; else STATE.players.push(payload);
      STATE.playerModal = null; saveState(); render(); break;
    }
    case "delete-player":
      STATE.players = STATE.players.filter((x) => x.id !== id);
      STATE.playerModal = null; saveState(); render(); break;
    case "new-match":
      STATE.editingMatch = blankMatch(null); render(); break;
    case "open-match":
      STATE.viewingMatchId = id; render(); break;
    case "close-viewing":
      STATE.viewingMatchId = null; render(); break;
    case "edit-match-from-view": {
      const mm = STATE.matches.find((x) => x.id === id);
      if (!mm) return;
      STATE.editingMatch = normalizeMatch(mm); STATE.viewingMatchId = null; render(); break;
    }
    case "delete-match":
      STATE.matches = STATE.matches.filter((x) => x.id !== id);
      STATE.viewingMatchId = null; saveState(); render(); break;
    case "cancel-edit-match":
      STATE.editingMatch = null; STATE.activeSlot = null; render(); break;
    case "save-match": {
      const m = STATE.editingMatch;
      m.round = (m.round === "" || m.round === null || m.round === undefined) ? null : Number(m.round);
      const idx = STATE.matches.findIndex((x) => x.id === m.id);
      if (idx >= 0) STATE.matches[idx] = m; else STATE.matches.push(m);
      STATE.editingMatch = null; STATE.activeSlot = null; saveState(); render(); break;
    }
    case "pick-formation":
      STATE.editingMatch.formation = el.dataset.formation; render(); break;
    case "open-slot": {
      const slotId = el.dataset.slotId;
      const slot = (FORMATIONS[STATE.editingMatch.formation] || []).find((s) => s.id === slotId);
      STATE.activeSlot = slot; render(); break;
    }
    case "close-slot-picker":
      STATE.activeSlot = null; render(); break;
    case "pick-slot-player": {
      const playerId = el.dataset.playerId || null;
      const m = STATE.editingMatch;
      const slotId = STATE.activeSlot.id;
      const prevId = m.lineup[slotId];
      if (playerId) m.lineup[slotId] = playerId; else delete m.lineup[slotId];
      if (prevId && prevId !== playerId) {
        const stillUsed = Object.values(m.lineup).includes(prevId) || (m.bench || []).includes(prevId);
        if (!stillUsed) delete m.stats[prevId];
      }
      if (playerId && !m.stats[playerId]) m.stats[playerId] = { ...emptyStat };
      STATE.activeSlot = null; render(); break;
    }
    case "bench-select": {
      const idx = Number(el.dataset.index);
      const playerId = el.value || null;
      const m = STATE.editingMatch;
      const bench = m.bench && m.bench.length === 9 ? [...m.bench] : Array(9).fill(null);
      const prevId = bench[idx];
      bench[idx] = playerId;
      if (prevId && prevId !== playerId) {
        const stillUsed = Object.values(m.lineup).includes(prevId) || bench.includes(prevId);
        if (!stillUsed) delete m.stats[prevId];
      }
      if (playerId && !m.stats[playerId]) m.stats[playerId] = { ...emptyStat };
      m.bench = bench; render(); break;
    }
    case "add-opponent":
      STATE.opponentModal = { id: null, name: "", emblem: "" };
      render(); break;
    case "edit-opponent": {
      const o = STATE.opponents.find((x) => x.id === id);
      if (!o) return;
      STATE.opponentModal = { id: o.id, name: o.name, emblem: o.emblem || "" };
      render(); break;
    }
    case "close-opponent-modal":
      STATE.opponentModal = null; render(); break;
    case "save-opponent": {
      const d = STATE.opponentModal;
      if (!d.name) { alert("チーム名を入力してください"); return; }
      const payload = { id: d.id || uid(), name: d.name, emblem: d.emblem || "" };
      const idx = STATE.opponents.findIndex((x) => x.id === payload.id);
      if (idx >= 0) STATE.opponents[idx] = payload; else STATE.opponents.push(payload);
      STATE.opponentModal = null; saveState(); render(); break;
    }
    case "delete-opponent":
      STATE.opponents = STATE.opponents.filter((x) => x.id !== id);
      STATE.opponentModal = null; saveState(); render(); break;
    case "cal-prev": {
      let { year, month } = STATE.calendarMonth;
      month -= 1; if (month < 0) { month = 11; year -= 1; }
      STATE.calendarMonth = { year, month }; render(); break;
    }
    case "cal-next": {
      let { year, month } = STATE.calendarMonth;
      month += 1; if (month > 11) { month = 0; year += 1; }
      STATE.calendarMonth = { year, month }; render(); break;
    }
    case "pick-homeaway":
      STATE.editingMatch.homeAway = el.dataset.value; render(); break;
    case "pick-opponent": {
      const oid = el.value || null;
      const m = STATE.editingMatch;
      m.opponentId = oid;
      if (oid) { const o = STATE.opponents.find((x) => x.id === oid); if (o) m.opponent = o.name; }
      render(); break;
    }
    case "open-sync-modal":
      STATE.syncModal = true;
      render(); break;
    case "close-sync-modal":
      STATE.syncModal = null; render(); break;
    case "sign-in":
      signIn(); break;
    case "sign-out":
      signOutUser(); render(); break;
    case "export-data": {
      const payload = JSON.stringify({ players: STATE.players, opponents: STATE.opponents, matches: STATE.matches, updatedAt: STATE.updatedAt, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url; a.download = `vegalta-backup-${stamp}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      break;
    }
    case "import-data":
      document.getElementById("importFile").click();
      break;
  }
}

function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || (!data.players && !data.matches)) throw new Error("形式が正しくありません");
      const ok = confirm("現在のデータを、選択したバックアップファイルの内容で上書きします。よろしいですか？");
      if (!ok) return;
      STATE.players = data.players || [];
      STATE.opponents = data.opponents || [];
      const rawMatches = data.matches && data.matches.length ? data.matches : buildSeasonTemplates();
      STATE.matches = rawMatches.map(normalizeMatch);
      STATE.updatedAt = data.updatedAt || Date.now();
      STATE.tab = "roster"; STATE.editingMatch = null; STATE.viewingMatchId = null; STATE.activeSlot = null; STATE.playerModal = null; STATE.opponentModal = null;
      saveState(); render();
      alert("復元が完了しました。");
    } catch (e) {
      alert("読み込みに失敗しました。正しいバックアップファイル（.json）を選んでください。");
    }
  };
  reader.readAsText(file);
}

/* ---------------- event delegation ---------------- */
document.addEventListener("input", (e) => {
  const bindEl = e.target.closest("[data-bind]");
  if (bindEl) setByPath(STATE, bindEl.dataset.bind, bindEl.value);
});
document.addEventListener("change", (e) => {
  const bindEl = e.target.closest("[data-bind]");
  if (bindEl) { setByPath(STATE, bindEl.dataset.bind, bindEl.value); return; }
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) handleAction(actionEl);
});
document.addEventListener("click", (e) => {
  // selectのクリックは完全に無視（値確定前にhandleActionが走ってDOMごと壊れるのを防ぐ）
  if (e.target.closest("select")) return;
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;
  handleAction(actionEl);
});
document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) handleImportFile(file);
  e.target.value = "";
});

/* ---------------- boot ---------------- */
render();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
