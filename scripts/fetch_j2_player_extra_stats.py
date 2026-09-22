#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Jリーグ公式 J STATS からベガルタ仙台の追加選手指標を取得する。"""
import json
import os
import re
from datetime import datetime, timedelta, timezone

import requests

SEASON = "2026-27"
TEAM_CODE = "sendai"
OUTPUT_PATH = "data/j2-player-extra-stats.json"
BASE_URL = "https://www.jleague.jp/j2/stats/player/{season}/{metric}/search-list/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; VegaltaTrackerBot/1.0; personal use)"}

METRICS = {
    "air_battle_win_count": "aerialDuelsWon",
    "air_battle_win_rate": "aerialDuelWinRate",
    "duels_won": "duelsWon",
    "intercept_count": "interceptions",
    "chance_create": "chancesCreated",
}

# Next.jsのRSCペイロード内にあるランキング行。クラブコードで仙台だけに限定する。
ROW_PATTERN = re.compile(
    r'\\"club\\":\{\\"code\\":\\"(?P<club>[^\"]+)\\"'
    r'[\s\S]{0,900}?\\"position\\":\\"(?P<position>[^\"]*)\\"'
    r'[\s\S]{0,300}?\\"playerName\\":\\"(?P<name>[^\"]+)\\"'
    r'[\s\S]{0,500}?\\"points\\":(?P<points>[0-9.]+)'
)


def number_from_position(value):
    match = re.search(r"(\d+)\s*$", value or "")
    return int(match.group(1)) if match else None


def fetch_metric(metric):
    url = BASE_URL.format(season=SEASON, metric=metric)
    response = requests.get(
        url,
        headers=HEADERS,
        timeout=30,
        verify=os.getenv("JLEAGUE_INSECURE") != "1",
    )
    response.raise_for_status()
    rows = []
    seen = set()
    for match in ROW_PATTERN.finditer(response.text):
        if match.group("club") != TEAM_CODE:
            continue
        number = number_from_position(match.group("position"))
        key = (number, match.group("name"))
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "number": number,
            "name": match.group("name"),
            "value": float(match.group("points")),
        })
    if not rows:
        raise RuntimeError(f"{metric}: 仙台のランキングデータを取得できませんでした")
    return rows, url


def main():
    players = {}
    sources = {}
    for metric, key in METRICS.items():
        rows, url = fetch_metric(metric)
        sources[key] = url
        for row in rows:
            identity = str(row["number"]) if row["number"] is not None else row["name"]
            entry = players.setdefault(identity, {
                "number": row["number"],
                "name": row["name"],
                "aerialDuelsWon": 0,
                "aerialDuelWinRate": 0,
                "duelsWon": 0,
                "interceptions": 0,
                "chancesCreated": 0,
            })
            entry[key] = row["value"]

    for entry in players.values():
        for key in METRICS.values():
            value = entry[key]
            entry[key] = int(value) if float(value).is_integer() else value

    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(),
        "season": SEASON,
        "team": "ベガルタ仙台",
        "source": "Jリーグ公式 J STATS",
        "sourceUrls": sources,
        "players": sorted(players.values(), key=lambda item: (item["number"] is None, item["number"] or 999)),
    }
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"{len(payload['players'])}人分を {OUTPUT_PATH} に保存しました")


if __name__ == "__main__":
    main()
