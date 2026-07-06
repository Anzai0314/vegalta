import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Pencil, Crown, Users, CalendarDays, Shield, ChevronRight } from "lucide-react";

/* ---------------------------------------------------------
   ベガルタ仙台 選手・フォーメーション・スタッツ管理
   デザイントークン
   - 夜: #131310 / パネル: #1c1c16
   - 山吹金: #F4B400 / 深い金: #B8860B
   - ピッチ: #163326
   - クリーム文字: #F3EFE3 / ミュート: #9C9686
   - ポジション色: GK #5AA9E6 / DF #6FCF97 / MF #F2C94C / FW #EB5757
   - サイン要素: 伊達政宗兜の「三日月」モチーフ
--------------------------------------------------------- */

const POS_COLOR = { GK: "#5AA9E6", DF: "#6FCF97", MF: "#F2C94C", FW: "#EB5757" };
const POS_LABEL = { GK: "GK", DF: "DF", MF: "MF", FW: "FW" };

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
};

const COMPETITIONS = ["J1リーグ", "J2リーグ", "J3リーグ", "天皇杯", "ルヴァンカップ", "その他"];

const STORAGE_KEY = "vegalta_app_state_v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function CrescentMoon({ size = 18, color = "#F4B400" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M15.5 3C10 3 6 7.5 6 13c0 5 4 9 9.5 9-2-1.8-3.2-4.4-3.2-8.5S13.5 5.3 15.5 3z"
        fill={color}
      />
    </svg>
  );
}

function Avatar({ player, size = 56 }) {
  const color = POS_COLOR[player.position] || "#9C9686";
  const initial = (player.name || "?").trim().charAt(0);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${color}`, background: player.photoUrl ? "#000" : "#0e0e0b",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", position: "relative", boxShadow: `0 0 0 3px rgba(0,0,0,0.4)`,
      }}
    >
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt={player.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: size * 0.38, color }}>
          {initial}
        </span>
      )}
    </div>
  );
}

function PositionTag({ pos }) {
  const color = POS_COLOR[pos];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#131310",
      background: color, borderRadius: 4, padding: "2px 7px", fontFamily: "'JetBrains Mono', monospace",
    }}>
      {POS_LABEL[pos]}
    </span>
  );
}

/* ---------------- Player Form Modal ---------------- */
function PlayerModal({ initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial || {
    number: "", name: "", position: "MF", photoUrl: "", goals: 0, assists: 0, appearances: 0,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, maxWidth: 440 }}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>{initial ? "選手を編集" : "選手を追加"}</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} color="#9C9686" /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="背番号" style={{ width: 90 }}>
              <input style={inputStyle} type="number" value={form.number}
                onChange={(e) => set("number", e.target.value)} placeholder="10" />
            </Field>
            <Field label="ポジション" style={{ flex: 1 }}>
              <select style={inputStyle} value={form.position} onChange={(e) => set("position", e.target.value)}>
                <option value="GK">GK ゴールキーパー</option>
                <option value="DF">DF ディフェンダー</option>
                <option value="MF">MF ミッドフィルダー</option>
                <option value="FW">FW フォワード</option>
              </select>
            </Field>
          </div>
          <Field label="選手名">
            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例）名波 太郎" />
          </Field>
          <Field label="顔写真URL（任意）">
            <input style={inputStyle} value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://..." />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="出場試合数" style={{ flex: 1 }}>
              <input style={inputStyle} type="number" min="0" value={form.appearances}
                onChange={(e) => set("appearances", e.target.value)} />
            </Field>
            <Field label="得点" style={{ flex: 1 }}>
              <input style={inputStyle} type="number" min="0" value={form.goals}
                onChange={(e) => set("goals", e.target.value)} />
            </Field>
            <Field label="アシスト" style={{ flex: 1 }}>
              <input style={inputStyle} type="number" min="0" value={form.assists}
                onChange={(e) => set("assists", e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #2a2a22" }}>
          {initial ? (
            <button onClick={() => onDelete(initial.id)} style={{ ...ghostBtnStyle, color: "#EB5757" }}>
              <Trash2 size={14} /> 削除
            </button>
          ) : <span />}
          <button
            style={goldBtnStyle}
            disabled={!form.name || !form.number}
            onClick={() => onSave({
              ...form,
              id: initial ? initial.id : uid(),
              number: Number(form.number) || 0,
              goals: Number(form.goals) || 0,
              assists: Number(form.assists) || 0,
              appearances: Number(form.appearances) || 0,
            })}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#9C9686", ...style }}>
      {label}
      {children}
    </label>
  );
}

/* ---------------- Roster Tab ---------------- */
function RosterTab({ players, onAdd, onEdit }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const grouped = ["GK", "DF", "MF", "FW"].map((p) => ({
    pos: p, list: players.filter((pl) => pl.position === p).sort((a, b) => a.number - b.number),
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <SectionTitle icon={<Users size={16} color="#F4B400" />} title="選手名鑑" sub={`${players.length} 名登録`} />
        <button style={goldBtnStyle} onClick={() => setAdding(true)}><Plus size={15} /> 選手を追加</button>
      </div>

      {players.length === 0 && (
        <EmptyState text="まだ選手が登録されていません。「選手を追加」から選手名鑑を作りましょう。" />
      )}

      {grouped.map(({ pos, list }) => list.length > 0 && (
        <div key={pos} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: POS_COLOR[pos] }} />
            <span style={{ fontSize: 12, letterSpacing: 2, color: "#9C9686", fontFamily: "'JetBrains Mono', monospace" }}>
              {pos === "GK" ? "GOALKEEPER" : pos === "DF" ? "DEFENDER" : pos === "MF" ? "MIDFIELDER" : "FORWARD"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
            {list.map((pl) => (
              <div key={pl.id} onClick={() => setEditing(pl)} style={cardStyle}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar player={pl} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F4B400", fontWeight: 700, fontSize: 15 }}>
                        {pl.number}
                      </span>
                      <PositionTag pos={pl.position} />
                    </div>
                    <div style={{
                      fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 600, fontSize: 15, color: "#F3EFE3",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {pl.name}
                    </div>
                  </div>
                  <Pencil size={14} color="#5a5648" />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #26261e", paddingTop: 10 }}>
                  <StatChip label="出場" value={pl.appearances} />
                  <StatChip label="得点" value={pl.goals} />
                  <StatChip label="アシスト" value={pl.assists} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(editing || adding) && (
        <PlayerModal
          initial={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSave={(p) => { onAdd(p); setEditing(null); setAdding(false); }}
          onDelete={(id) => { onEdit(id); setEditing(null); }}
        />
      )}
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "#F3EFE3" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9C9686", marginTop: 1 }}>{label}</div>
    </div>
  );
}

/* ---------------- Formation Pitch ---------------- */
function Pitch({ formation, lineup, players, onSlotClick, editable }) {
  const slots = FORMATIONS[formation] || [];
  const findPlayer = (id) => players.find((p) => p.id === id);
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", aspectRatio: "0.72", background: "#163326", borderRadius: 12, border: "1px solid #24462f" }}>
      <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <circle cx="50" cy="50" r="9" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <rect x="27" y="3" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      <rect x="27" y="83" width="46" height="14" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" />
      {slots.map((slot) => {
        const pl = findPlayer(lineup[slot.id]);
        const color = POS_COLOR[slot.pos];
        return (
          <g key={slot.id} onClick={() => editable && onSlotClick(slot)} style={{ cursor: editable ? "pointer" : "default" }}>
            <circle cx={slot.x} cy={slot.y} r={pl ? 6.5 : 5.5}
              fill={pl ? "#131310" : "rgba(255,255,255,0.06)"}
              stroke={color} strokeWidth={pl ? 1 : 0.6}
              strokeDasharray={pl ? "0" : "1.4 1.2"} />
            {pl && (
              <text x={slot.x} y={slot.y + 1.8} textAnchor="middle" fontSize="5" fontWeight="700"
                fontFamily="JetBrains Mono, monospace" fill={color}>{pl.number}</text>
            )}
            <text x={slot.x} y={slot.y + (pl ? 10.5 : 9.5)} textAnchor="middle" fontSize="3.3"
              fontFamily="Zen Kaku Gothic New, sans-serif" fill="#F3EFE3" style={{ opacity: 0.9 }}>
              {pl ? (pl.name.length > 6 ? pl.name.slice(0, 6) + "…" : pl.name) : slot.pos}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SlotPickerModal({ slot, players, onPick, onClose }) {
  const candidates = [...players].sort((a, b) => (a.position === slot.pos ? -1 : 1) - (b.position === slot.pos ? -1 : 1) || a.number - b.number);
  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, maxWidth: 380, maxHeight: "70vh" }}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>{slot.pos} のポジションに配置</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18} color="#9C9686" /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <button style={{ ...listItemStyle, color: "#9C9686" }} onClick={() => onPick(null)}>— 未設定にする —</button>
          {candidates.map((p) => (
            <button key={p.id} style={listItemStyle} onClick={() => onPick(p.id)}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F4B400", width: 26, display: "inline-block" }}>{p.number}</span>
              <PositionTag pos={p.position} />
              <span style={{ marginLeft: 8 }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Matches Tab ---------------- */
function MatchesTab({ players, matches, onSave, onDelete }) {
  const [editing, setEditing] = useState(null); // match object being built/edited, or null
  const [activeSlot, setActiveSlot] = useState(null);
  const [viewing, setViewing] = useState(null);

  const startNew = () => setEditing({
    id: uid(), date: "", opponent: "", competition: COMPETITIONS[0], homeAway: "H",
    scoreFor: "", scoreAgainst: "", formation: "4-4-2", lineup: {}, note: "",
  });

  const setField = (k, v) => setEditing((m) => ({ ...m, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <SectionTitle icon={<CalendarDays size={16} color="#F4B400" />} title="試合記録とフォーメーション" sub={`${matches.length} 試合`} />
        <button style={goldBtnStyle} onClick={startNew}><Plus size={15} /> 試合を記録</button>
      </div>

      {matches.length === 0 && !editing && (
        <EmptyState text="試合の記録がありません。「試合を記録」からフォーメーションを組んでみましょう。" />
      )}

      {!editing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...matches].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((m) => (
            <div key={m.id} style={{ ...cardStyle, cursor: "pointer" }} onClick={() => setViewing(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9C9686", fontFamily: "'JetBrains Mono', monospace" }}>
                    {m.date || "日付未設定"} ・ {m.competition} ・ {m.homeAway === "H" ? "ホーム" : "アウェイ"}
                  </div>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 17, color: "#F3EFE3", marginTop: 2 }}>
                    仙台 <span style={{ color: "#F4B400" }}>{m.scoreFor || "-"} – {m.scoreAgainst || "-"}</span> {m.opponent || "対戦相手未設定"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, background: "#26261e", padding: "4px 9px", borderRadius: 6, color: "#F4B400", fontFamily: "'JetBrains Mono', monospace" }}>
                    {m.formation}
                  </span>
                  <ChevronRight size={16} color="#5a5648" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{ ...cardStyle, cursor: "default" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Field label="日付">
              <input type="date" style={inputStyle} value={editing.date} onChange={(e) => setField("date", e.target.value)} />
            </Field>
            <Field label="大会">
              <select style={inputStyle} value={editing.competition} onChange={(e) => setField("competition", e.target.value)}>
                {COMPETITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="対戦相手">
              <input style={inputStyle} value={editing.opponent} onChange={(e) => setField("opponent", e.target.value)} placeholder="例）モンテディオ山形" />
            </Field>
            <Field label="ホーム／アウェイ">
              <select style={inputStyle} value={editing.homeAway} onChange={(e) => setField("homeAway", e.target.value)}>
                <option value="H">ホーム</option>
                <option value="A">アウェイ</option>
              </select>
            </Field>
            <Field label="得点（仙台）">
              <input type="number" min="0" style={inputStyle} value={editing.scoreFor} onChange={(e) => setField("scoreFor", e.target.value)} />
            </Field>
            <Field label="失点">
              <input type="number" min="0" style={inputStyle} value={editing.scoreAgainst} onChange={(e) => setField("scoreAgainst", e.target.value)} />
            </Field>
          </div>

          <Field label="フォーメーション" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(FORMATIONS).map((f) => (
                <button key={f}
                  onClick={() => setField("formation", f)}
                  style={{
                    ...ghostBtnStyle,
                    borderColor: editing.formation === f ? "#F4B400" : "#2a2a22",
                    color: editing.formation === f ? "#F4B400" : "#9C9686",
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ maxWidth: 340, margin: "0 auto" }}>
            <Pitch formation={editing.formation} lineup={editing.lineup} players={players} editable
              onSlotClick={(slot) => setActiveSlot(slot)} />
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "#5a5648", marginTop: 8 }}>ポジションをタップして選手を配置</p>

          <Field label="メモ（任意）" style={{ marginTop: 10 }}>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={editing.note}
              onChange={(e) => setField("note", e.target.value)} placeholder="得点者、交代など" />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button style={ghostBtnStyle} onClick={() => setEditing(null)}>キャンセル</button>
            <button style={goldBtnStyle} onClick={() => { onSave(editing); setEditing(null); }}>
              保存する
            </button>
          </div>
        </div>
      )}

      {activeSlot && (
        <SlotPickerModal
          slot={activeSlot}
          players={players}
          onClose={() => setActiveSlot(null)}
          onPick={(playerId) => {
            setEditing((m) => {
              const lineup = { ...m.lineup };
              if (playerId) lineup[activeSlot.id] = playerId; else delete lineup[activeSlot.id];
              return { ...m, lineup };
            });
            setActiveSlot(null);
          }}
        />
      )}

      {viewing && (
        <div style={overlayStyle} onClick={() => setViewing(null)}>
          <div style={{ ...panelStyle, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={panelHeaderStyle}>
              <h3 style={panelTitleStyle}>{viewing.date} vs {viewing.opponent}</h3>
              <button onClick={() => setViewing(null)} style={iconBtnStyle}><X size={18} color="#9C9686" /></button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ maxWidth: 320, margin: "0 auto" }}>
                <Pitch formation={viewing.formation} lineup={viewing.lineup} players={players} editable={false} onSlotClick={() => {}} />
              </div>
              {viewing.note && <p style={{ fontSize: 13, color: "#9C9686", marginTop: 12, whiteSpace: "pre-wrap" }}>{viewing.note}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <button style={{ ...ghostBtnStyle, color: "#EB5757" }} onClick={() => { onDelete(viewing.id); setViewing(null); }}>
                  <Trash2 size={14} /> この記録を削除
                </button>
                <button style={ghostBtnStyle} onClick={() => { setEditing(viewing); setViewing(null); }}>
                  <Pencil size={14} /> 編集
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Leaders Tab ---------------- */
function LeaderBoard({ title, players, statKey, unit }) {
  const ranked = [...players].filter((p) => (p[statKey] || 0) > 0 || players.length <= 5)
    .sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0)).slice(0, 5);
  const max = ranked[0] ? ranked[0][statKey] || 1 : 1;
  return (
    <div style={{ ...cardStyle, cursor: "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <CrescentMoon size={16} />
        <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 15, color: "#F3EFE3" }}>{title}</span>
      </div>
      {ranked.length === 0 && <p style={{ fontSize: 12, color: "#5a5648" }}>データがありません</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ranked.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 20, textAlign: "center", position: "relative" }}>
              {i === 0 ? <Crown size={16} color="#F4B400" /> : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5a5648", fontSize: 13 }}>{i + 1}</span>
              )}
            </div>
            <Avatar player={p} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#F3EFE3", fontWeight: 600 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F4B400", fontWeight: 700 }}>
                  {p[statKey] || 0}<span style={{ fontSize: 10, color: "#9C9686" }}>{unit}</span>
                </span>
              </div>
              <div style={{ height: 4, background: "#26261e", borderRadius: 2, marginTop: 4 }}>
                <div style={{
                  height: "100%", width: `${((p[statKey] || 0) / max) * 100}%`, borderRadius: 2,
                  background: i === 0 ? "#F4B400" : "#6FCF97",
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadersTab({ players }) {
  const totalApps = players.reduce((s, p) => s + (p.appearances || 0), 0);
  const totalGoals = players.reduce((s, p) => s + (p.goals || 0), 0);
  const totalAssists = players.reduce((s, p) => s + (p.assists || 0), 0);
  return (
    <div>
      <SectionTitle icon={<CrescentMoon size={16} />} title="チームスタッツリーダー" sub="シーズン累計" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "16px 0 22px" }}>
        <TotalStat label="総出場数" value={totalApps} />
        <TotalStat label="総得点" value={totalGoals} />
        <TotalStat label="総アシスト" value={totalAssists} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <LeaderBoard title="得点ランキング" players={players} statKey="goals" unit="点" />
        <LeaderBoard title="アシストランキング" players={players} statKey="assists" unit="本" />
        <LeaderBoard title="出場ランキング" players={players} statKey="appearances" unit="試合" />
      </div>
    </div>
  );
}

function TotalStat({ label, value }) {
  return (
    <div style={{ ...cardStyle, textAlign: "center", cursor: "default" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: "#F4B400" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9C9686", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */
function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon}
      <div>
        <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 17, color: "#F3EFE3" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#5a5648" }}>{sub}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      border: "1.5px dashed #2a2a22", borderRadius: 12, padding: "40px 20px", textAlign: "center", color: "#5a5648",
    }}>
      <CrescentMoon size={26} />
      <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(6,6,4,0.72)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
};
const panelStyle = {
  background: "#1c1c16", border: "1px solid #2e2e24", borderRadius: 14, width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column",
};
const panelHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 20px", borderBottom: "1px solid #2a2a22",
};
const panelTitleStyle = { fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, fontWeight: 700, color: "#F3EFE3", margin: 0 };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" };
const inputStyle = {
  background: "#131310", border: "1px solid #2e2e24", borderRadius: 8, padding: "9px 11px",
  color: "#F3EFE3", fontSize: 14, outline: "none", fontFamily: "'Noto Sans JP', sans-serif", width: "100%", boxSizing: "border-box",
};
const goldBtnStyle = {
  background: "linear-gradient(180deg, #F7C233, #D89A00)", border: "none", borderRadius: 8, padding: "9px 15px",
  color: "#131310", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  fontFamily: "'Zen Kaku Gothic New', sans-serif",
};
const ghostBtnStyle = {
  background: "transparent", border: "1px solid #2a2a22", borderRadius: 8, padding: "8px 13px",
  color: "#9C9686", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  fontFamily: "'Zen Kaku Gothic New', sans-serif",
};
const cardStyle = {
  background: "#1c1c16", border: "1px solid #26261e", borderRadius: 12, padding: 14, cursor: "pointer",
};
const listItemStyle = {
  background: "transparent", border: "none", borderRadius: 8, padding: "10px 12px", textAlign: "left",
  color: "#F3EFE3", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center",
  fontFamily: "'Noto Sans JP', sans-serif",
};

/* ---------------- Root ---------------- */
export default function App() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("roster");
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setPlayers(data.players || []);
          setMatches(data.matches || []);
        }
      } catch (e) {
        // no existing data yet — start fresh
      } finally {
        loadedRef.current = true;
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ players, matches }), false);
      } catch (e) {
        setErr("保存に失敗しました。もう一度お試しください。");
      }
    })();
  }, [players, matches]);

  const upsertPlayer = (p) => setPlayers((prev) => {
    const exists = prev.some((x) => x.id === p.id);
    return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
  });
  const deletePlayer = (id) => setPlayers((prev) => prev.filter((x) => x.id !== id));

  const upsertMatch = (m) => setMatches((prev) => {
    const exists = prev.some((x) => x.id === m.id);
    return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
  });
  const deleteMatch = (id) => setMatches((prev) => prev.filter((x) => x.id !== id));

  const tabs = [
    { id: "roster", label: "選手名鑑", icon: <Users size={15} /> },
    { id: "matches", label: "フォーメーション記録", icon: <CalendarDays size={15} /> },
    { id: "leaders", label: "スタッツリーダー", icon: <CrescentMoon size={15} /> },
  ];

  return (
    <div style={{
      background: "#131310", minHeight: "100%", padding: "20px 16px 40px",
      fontFamily: "'Noto Sans JP', sans-serif", color: "#F3EFE3",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #F4B400 !important; }
        button:focus-visible { outline: 2px solid #F4B400; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "linear-gradient(160deg,#1c1c16,#131310)",
            border: "1px solid #2e2e24", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={20} color="#F4B400" />
          </div>
          <div>
            <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 900, fontSize: 19, letterSpacing: 1 }}>
              VEGALTA <span style={{ color: "#F4B400" }}>仙台</span>
            </div>
            <div style={{ fontSize: 11, color: "#5a5648", letterSpacing: 1 }}>PLAYER &amp; FORMATION TRACKER</div>
          </div>
        </header>

        <nav style={{ display: "flex", gap: 6, marginBottom: 22, borderBottom: "1px solid #24241c", paddingBottom: 2 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", fontSize: 13, fontWeight: 700, fontFamily: "'Zen Kaku Gothic New', sans-serif",
              color: tab === t.id ? "#F4B400" : "#5a5648",
              borderBottom: tab === t.id ? "2px solid #F4B400" : "2px solid transparent", marginBottom: -2,
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {err && <p style={{ color: "#EB5757", fontSize: 12, marginBottom: 12 }}>{err}</p>}
        {!loaded ? (
          <p style={{ color: "#5a5648", fontSize: 13 }}>読み込み中…</p>
        ) : (
          <>
            {tab === "roster" && <RosterTab players={players} onAdd={upsertPlayer} onEdit={deletePlayer} />}
            {tab === "matches" && <MatchesTab players={players} matches={matches} onSave={upsertMatch} onDelete={deleteMatch} />}
            {tab === "leaders" && <LeadersTab players={players} />}
          </>
        )}
      </div>
    </div>
  );
}
