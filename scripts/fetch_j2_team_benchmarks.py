#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Football LABのJ2チーム集計から仙台・J2平均・リーグ順位を作成する。"""
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

SEASON_YEAR = "2026"
TEAM_ID = "send"
OUTPUT_PATH = "data/j2-team-benchmarks.json"
BASE_URL = "https://www.football-lab.jp/summary/team_ranking/j2"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; VegaltaTrackerBot/1.0; personal use)"}

METRIC_DEFS = {
    "attacks": ("攻撃回数", "回", "high"),
    "shots": ("シュート", "本", "high"),
    "chanceCreationRate": ("チャンス構築率", "%", "high"),
    "goals": ("得点", "点", "high"),
    "shotSuccessRate": ("シュート成功率", "%", "high"),
    "attacksAgainst": ("被攻撃回数", "回", "low"),
    "shotsAgainst": ("被シュート", "本", "low"),
    "chanceCreationRateAgainst": ("被チャンス構築率", "%", "low"),
    "goalsAgainst": ("被ゴール", "点", "low"),
    "opponentShotSuccessRate": ("被シュート成功率", "%", "low"),
    "expectedGoals": ("ゴール期待値", "", "high"),
    "expectedGoalsAgainst": ("被ゴール期待値", "", "low"),
}


def fetch_soup(data_key):
    response = requests.get(
        BASE_URL,
        params={"data": data_key, "year": SEASON_YEAR},
        headers=HEADERS,
        timeout=30,
        verify=os.getenv("FOOTBALL_LAB_INSECURE") != "1",
    )
    response.raise_for_status()
    return BeautifulSoup(response.content, "html.parser"), response.url


def team_id_from_row(row):
    anchor = row.find("a", href=True)
    if not anchor:
        return None
    path = urlparse(anchor["href"]).path.strip("/")
    return path.split("/")[0] if path else None


def numeric(text):
    cleaned = re.sub(r"[^0-9.\-]", "", text or "")
    if cleaned in ("", "-", "."):
        raise ValueError(f"数値に変換できません: {text!r}")
    return float(cleaned)


def parse_table(table, value_indexes):
    result = {}
    for row in table.find_all("tr"):
        team_id = team_id_from_row(row)
        if not team_id:
            continue
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all(["th", "td"])]
        try:
            result[team_id] = [numeric(cells[index]) for index in value_indexes]
        except (IndexError, ValueError):
            continue
    return result


def metric_payload(key, values_by_team):
    label, unit, better = METRIC_DEFS[key]
    if len(values_by_team) != 20 or TEAM_ID not in values_by_team:
        raise RuntimeError(f"{label}: 20クラブ分を取得できませんでした（{len(values_by_team)}件）")
    values = list(values_by_team.values())
    sendai_value = values_by_team[TEAM_ID]
    if better == "low":
        rank = 1 + sum(1 for value in values if value < sendai_value)
    else:
        rank = 1 + sum(1 for value in values if value > sendai_value)
    average = sum(values) / len(values)
    return {
        "label": label,
        "unit": unit,
        "better": better,
        "sendai": round(sendai_value, 3),
        "leagueAverage": round(average, 3),
        "difference": round(sendai_value - average, 3),
        "rank": rank,
        "teamCount": len(values),
        "teams": [
            {"teamId": team_id, "value": round(value, 3)}
            for team_id, value in sorted(values_by_team.items())
        ],
    }


def main():
    chance_soup, chance_url = fetch_soup("chance")
    chance_tables = [table for table in chance_soup.find_all("table") if len(parse_table(table, [2])) == 20]
    if len(chance_tables) < 2:
        raise RuntimeError("チャンス構築率の攻撃・守備テーブルを取得できませんでした")
    attack = parse_table(chance_tables[0], [2, 4, 6, 8, 10])
    defense = parse_table(chance_tables[-1], [2, 4, 6, 8, 10])

    expected_soup, expected_url = fetch_soup("expected")
    expected_tables = [table for table in expected_soup.find_all("table") if len(parse_table(table, [2])) == 20]
    if len(expected_tables) != 2:
        raise RuntimeError("ゴール期待値の攻撃・守備テーブルを取得できませんでした")
    expected_for = parse_table(expected_tables[0], [2])
    expected_against = parse_table(expected_tables[1], [2])

    raw_metrics = {
        "attacks": {team: row[0] for team, row in attack.items()},
        "shots": {team: row[1] for team, row in attack.items()},
        "chanceCreationRate": {team: row[2] for team, row in attack.items()},
        "goals": {team: row[3] for team, row in attack.items()},
        "shotSuccessRate": {team: row[4] for team, row in attack.items()},
        "attacksAgainst": {team: row[0] for team, row in defense.items()},
        "shotsAgainst": {team: row[1] for team, row in defense.items()},
        "chanceCreationRateAgainst": {team: row[2] for team, row in defense.items()},
        "goalsAgainst": {team: row[3] for team, row in defense.items()},
        "opponentShotSuccessRate": {team: row[4] for team, row in defense.items()},
        "expectedGoals": {team: row[0] for team, row in expected_for.items()},
        "expectedGoalsAgainst": {team: row[0] for team, row in expected_against.items()},
    }

    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(),
        "season": "2026/27",
        "competition": "J2",
        "sourceUpdatedAt": "Football LAB掲載時点",
        "sources": [chance_url, expected_url],
        "metrics": {key: metric_payload(key, values) for key, values in raw_metrics.items()},
    }
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    temporary = OUTPUT_PATH + ".tmp"
    with open(temporary, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
    os.replace(temporary, OUTPUT_PATH)
    print(f"{len(payload['metrics'])}指標を {OUTPUT_PATH} に保存しました")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"取得に失敗しました。既存JSONは変更しません: {error}", file=sys.stderr)
        sys.exit(1)
