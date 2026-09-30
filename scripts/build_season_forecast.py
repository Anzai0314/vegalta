#!/usr/bin/env python3
"""J2の順位表・全日程から最終順位確率をモンテカルロ計算する。"""

from __future__ import annotations

import argparse
import json
import math
import random
import re
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

YEAR_ID = "2026"
YEAR_LABEL = "2026/27"
COMPETITION_ID = "727"
COMPETITION_LABEL = "明治安田Ｊ２リーグ"
SIMULATIONS = 20000
SENDai_KEY = "仙台"
TEAM_ALIASES = {
    "札幌": "北海道コンサドーレ札幌", "八戸": "ヴァンラーレ八戸", "仙台": "ベガルタ仙台",
    "秋田": "ブラウブリッツ秋田", "山形": "モンテディオ山形", "いわき": "いわきＦＣ",
    "大宮": "ＲＢ大宮アルディージャ", "新潟": "アルビレックス新潟", "富山": "カターレ富山",
    "甲府": "ヴァンフォーレ甲府", "湘南": "湘南ベルマーレ", "横浜FC": "横浜ＦＣ",
    "藤枝": "藤枝ＭＹＦＣ", "磐田": "ジュビロ磐田", "今治": "ＦＣ今治",
    "徳島": "徳島ヴォルティス", "鳥栖": "サガン鳥栖", "大分": "大分トリニータ",
    "宮崎": "テゲバジャーロ宮崎", "栃木Ｃ": "栃木シティ",
}
STANDINGS_URL = f"https://data.j-league.or.jp/SFRT01/?competitionId={COMPETITION_ID}&competitionSectionId=0&search=search&yearId={YEAR_ID}"
SCHEDULE_URL = "https://data.j-league.or.jp/SFMS01/search?" + urllib.parse.urlencode([
    ("competition_years", YEAR_ID), ("competition_frame_ids", "2"), ("home_away_select", "0")
])


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = self.in_row = self.in_cell = False
        self.cell_tag = ""
        self.text = []
        self.row = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == "table": self.in_table = True
        elif self.in_table and tag == "tr":
            self.in_row, self.row = True, []
        elif self.in_row and tag in ("td", "th"):
            self.in_cell, self.cell_tag, self.text = True, tag, []

    def handle_data(self, data):
        if self.in_cell: self.text.append(data)

    def handle_endtag(self, tag):
        if self.in_cell and tag == self.cell_tag:
            self.row.append(re.sub(r"\s+", " ", "".join(self.text)).strip())
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            if self.row: self.rows.append(self.row[:])
            self.in_row = False
        elif tag == "table": self.in_table = False


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Vegalta season forecast; personal use)"})
    return urllib.request.urlopen(req, timeout=45).read().decode("utf-8", errors="replace")


def parse_tables(html):
    parser = TableParser(); parser.feed(html)
    return parser.rows


def as_int(value):
    found = re.search(r"-?\d+", str(value).replace(",", ""))
    return int(found.group()) if found else 0


def parse_standings(html):
    teams = []
    for row in parse_tables(html):
        # 公式順位表: グラフ / 順位 / チーム / 勝点 / 試合 / 勝 / 分 / 敗 / 得点 / 失点 / 得失点差
        if len(row) < 11 or not re.fullmatch(r"\d+", row[1] if len(row) > 1 else ""):
            continue
        if not re.fullmatch(r"\d+", row[3] if len(row) > 3 else ""):
            continue
        teams.append({
            "rank": as_int(row[1]), "team": row[2], "points": as_int(row[3]), "played": as_int(row[4]),
            "win": as_int(row[5]), "draw": as_int(row[6]), "lose": as_int(row[7]),
            "goalsFor": as_int(row[8]), "goalsAgainst": as_int(row[9]), "goalDiff": as_int(row[10]),
        })
    unique = {t["team"]: t for t in teams}
    if len(unique) != 20: raise RuntimeError(f"順位表は20クラブ必要ですが {len(unique)} クラブでした")
    return list(unique.values())


def parse_schedule(html):
    matches = []
    for row in parse_tables(html):
        if len(row) < 8 or row[0] != YEAR_LABEL or "Ｊ２" not in row[1]: continue
        section = re.search(r"第(\d+)節", row[2])
        if not section: continue
        score = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", row[6])
        matches.append({
            "round": int(section.group(1)), "date": row[3], "home": TEAM_ALIASES.get(row[5], row[5]), "away": TEAM_ALIASES.get(row[7], row[7]),
            "homeGoals": int(score.group(1)) if score else None,
            "awayGoals": int(score.group(2)) if score else None,
            "played": bool(score),
        })
    keyed = {(m["round"], m["home"], m["away"]): m for m in matches}
    if len(keyed) != 380: raise RuntimeError(f"リーグ全日程は380試合必要ですが {len(keyed)} 試合でした")
    return sorted(keyed.values(), key=lambda m: (m["round"], m["home"]))


def poisson(rng, lam):
    limit, product, count = math.exp(-lam), 1.0, 0
    while product > limit:
        count += 1; product *= rng.random()
    return count - 1


def load_h2h(path):
    if not path.exists(): return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    grouped = defaultdict(list)
    for match in raw.get("matches", []): grouped[match.get("opponent", "")].append(match)
    result = {}
    for name, rows in grouped.items():
        n = len(rows)
        if not n: continue
        points = sum(3 if r["scoreFor"] > r["scoreAgainst"] else 1 if r["scoreFor"] == r["scoreAgainst"] else 0 for r in rows)
        # 平均勝点1.35を中立とし、試合数で縮小。得点期待値への影響は最大±5%。
        raw_adj = max(-0.05, min(0.05, (points / n - 1.35) * 0.06))
        result[name] = raw_adj * min(1.0, n / 10)
    return result


def strengths(teams, matches):
    played = [m for m in matches if m["played"]]
    league_goals = sum(m["homeGoals"] + m["awayGoals"] for m in played)
    base = league_goals / max(1, len(played) * 2)
    form = defaultdict(list)
    for m in played:
        form[m["home"]].append((m["round"], 3 if m["homeGoals"] > m["awayGoals"] else 1 if m["homeGoals"] == m["awayGoals"] else 0))
        form[m["away"]].append((m["round"], 3 if m["awayGoals"] > m["homeGoals"] else 1 if m["homeGoals"] == m["awayGoals"] else 0))
    values = {}
    for t in teams:
        p = t["played"]
        shrink = 8
        attack = (t["goalsFor"] + base * shrink) / max(1, p + shrink) / max(base, .1)
        defense = (t["goalsAgainst"] + base * shrink) / max(1, p + shrink) / max(base, .1)
        recent = sorted(form[t["team"]], reverse=True)[:5]
        recent_ppg = sum(x[1] for x in recent) / max(1, len(recent))
        momentum = max(.94, min(1.06, 1 + (recent_ppg - 1.35) * .035))
        values[t["team"]] = {"attack": attack * momentum, "defense": defense / momentum, "recentPpg": round(recent_ppg, 2)}
    return values, base


def simulate(teams, matches, h2h, count, forced_next=None, seed=20260930):
    rng = random.Random(seed)
    names = [t["team"] for t in teams]
    initial = {t["team"]: [t["points"], t["goalDiff"], t["goalsFor"]] for t in teams}
    remaining = [m for m in matches if not m["played"]]
    model, base = strengths(teams, matches)
    position_counts = {n: [0] * len(names) for n in names}
    points_sum = defaultdict(float)
    next_match = next((m for m in remaining if SENDai_KEY in m["home"] or SENDai_KEY in m["away"]), None)
    for _ in range(count):
        table = {n: initial[n][:] for n in names}
        for m in remaining:
            home, away = m["home"], m["away"]
            if forced_next and next_match and m is next_match:
                if forced_next == "W": hg, ag = ((1, 0) if SENDai_KEY in home else (0, 1))
                elif forced_next == "D": hg, ag = (1, 1)
                else: hg, ag = ((0, 1) if SENDai_KEY in home else (1, 0))
            else:
                home_h2h = 0
                if SENDai_KEY in home: home_h2h = h2h.get(away, 0)
                elif SENDai_KEY in away: home_h2h = -h2h.get(home, 0)
                lh = max(.20, min(3.6, base * 1.10 * model[home]["attack"] * model[away]["defense"] * (1 + home_h2h)))
                la = max(.20, min(3.6, base * .90 * model[away]["attack"] * model[home]["defense"] * (1 - home_h2h)))
                hg, ag = poisson(rng, lh), poisson(rng, la)
            table[home][1] += hg - ag; table[away][1] += ag - hg
            table[home][2] += hg; table[away][2] += ag
            if hg > ag: table[home][0] += 3
            elif hg < ag: table[away][0] += 3
            else: table[home][0] += 1; table[away][0] += 1
        order = sorted(names, key=lambda n: (table[n][0], table[n][1], table[n][2], rng.random()), reverse=True)
        for pos, name in enumerate(order): position_counts[name][pos] += 1
        for name in names: points_sum[name] += table[name][0]
    rows = []
    for name in names:
        probs = [round(v * 100 / count, 1) for v in position_counts[name]]
        expected = sum((i + 1) * position_counts[name][i] for i in range(len(names))) / count
        rows.append({
            "team": name, "currentRank": next(t["rank"] for t in teams if t["team"] == name),
            "expectedRank": round(expected, 1), "expectedPoints": round(points_sum[name] / count, 1),
            "positionProbabilities": probs, "top2Probability": round(sum(probs[:2]), 1),
            "playoffProbability": round(sum(probs[2:6]), 1), "top6Probability": round(sum(probs[:6]), 1),
            "relegationProbability": round(sum(probs[-3:]), 1), "recentPpg": model[name]["recentPpg"],
        })
    rows.sort(key=lambda x: x["expectedRank"])
    return rows, next_match, base


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--standings-html"); ap.add_argument("--schedule-html")
    ap.add_argument("--output", default="data/season-forecast.json")
    ap.add_argument("--simulations", type=int, default=SIMULATIONS)
    args = ap.parse_args()
    standings_html = Path(args.standings_html).read_text(encoding="utf-8") if args.standings_html else fetch_text(STANDINGS_URL)
    schedule_html = Path(args.schedule_html).read_text(encoding="utf-8") if args.schedule_html else fetch_text(SCHEDULE_URL)
    teams, matches = parse_standings(standings_html), parse_schedule(schedule_html)
    h2h = load_h2h(Path(__file__).resolve().parents[1] / "data" / "head-to-head.json")
    rows, next_match, base = simulate(teams, matches, h2h, args.simulations)
    scenarios = {}
    for idx, result in enumerate(("W", "D", "L")):
        scenario_rows, _, _ = simulate(teams, matches, h2h, max(12000, args.simulations // 3), result, 20260931 + idx)
        sendai = next(r for r in scenario_rows if SENDai_KEY in r["team"])
        scenarios[result] = {k: sendai[k] for k in ("expectedRank", "expectedPoints", "top2Probability", "top6Probability")}
    sendai = next(r for r in rows if SENDai_KEY in r["team"])
    difficulty = []
    model, _ = strengths(teams, matches)
    for m in matches:
        if not m["played"] and (SENDai_KEY in m["home"] or SENDai_KEY in m["away"]):
            opponent = m["away"] if SENDai_KEY in m["home"] else m["home"]
            difficulty.append({"round": m["round"], "opponent": opponent, "venue": "HOME" if SENDai_KEY in m["home"] else "AWAY", "strength": round(model[opponent]["attack"] / max(.2, model[opponent]["defense"]) * 100)})
    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(), "season": YEAR_LABEL, "competition": COMPETITION_LABEL,
        "simulations": args.simulations, "modelVersion": 1, "source": {"standings": STANDINGS_URL, "schedule": SCHEDULE_URL},
        "method": "Poisson Monte Carlo with current attack/defence, recent form, home advantage and lightly weighted Sendai head-to-head",
        "playedMatches": sum(1 for m in matches if m["played"]), "remainingMatches": sum(1 for m in matches if not m["played"]),
        "leagueGoalsPerTeamMatch": round(base, 3), "teams": rows, "sendai": sendai,
        "nextMatch": next_match, "nextMatchScenarios": scenarios, "sendaiRemainingSchedule": difficulty,
    }
    out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(out), "teams": len(rows), "simulations": args.simulations, "nextMatch": next_match}, ensure_ascii=False))


if __name__ == "__main__": main()
