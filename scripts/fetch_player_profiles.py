#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ベガルタ仙台公式サイトの選手個別ページ（https://www.vegalta.co.jp/team/top-NN.html）から、
「経歴（所属歴）」など事実ベースの情報だけを取得し、data/player-profiles.json に保存するスクリプト。

著作権に配慮し、公式サイトが書いた紹介文（プロフィール文章）そのものは一切保存・表示しない。
取得するのは「◯◯ユース→◯◯大→…」のような経歴の並び（事実の列挙）と、公式ページへのリンクのみ。

【選手一覧の渡し方】
このスクリプトはあなたのFirebaseには直接アクセスしない（秘密鍵の追加登録が不要なように）。
代わりに、アプリの「⬇ バックアップ」ボタンでエクスポートしたJSONファイルを
data/roster-export.json としてリポジトリに置いてください。
選手の背番号を元に、公式サイトの個別ページURL（team/top-背番号.html）を組み立てて取得する。

roster-export.json が無い場合はエラーで終了する。
"""
import json
import glob
import os
import re
import sys
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

ROSTER_PATH = "data/roster-export.json"
OUTPUT_PATH = "data/player-profiles.json"
BASE_URL = "https://www.vegalta.co.jp/team/top-{:02d}.html"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VegaltaTrackerBot/1.0; personal use)"
}

CAREER_PATTERN = re.compile(r"([^\s→]{2,}(?:\s*→\s*[^\s→]{2,}){1,})")
BIRTH_PATTERN = re.compile(r"(19\d{2}|20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日(?:生まれ)?")
HEIGHT_PATTERN = re.compile(r"(?<!\d)(1\d{2}|2\d{2})\s*cm", re.IGNORECASE)


def load_roster():
    try:
        with open(ROSTER_PATH, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        candidates = sorted(glob.glob("data/vegalta-backup-*.json"))
        if not candidates:
            print(f"{ROSTER_PATH} もバックアップJSONも見つかりません。", file=sys.stderr)
            sys.exit(1)
        loaded = []
        for path in candidates:
            with open(path, encoding="utf-8") as f:
                candidate = json.load(f)
            completed = sum(1 for match in candidate.get("matches", []) if match.get("opponent") and match.get("scoreFor") not in ("", None))
            loaded.append((completed, candidate.get("updatedAt") or 0, path, candidate))
        _, _, selected_path, data = max(loaded, key=lambda item: (item[0], item[1]))
        print(f"{ROSTER_PATH} の代わりに {selected_path} を使用します。")
    return data.get("players") or []


def fetch_profile(number):
    url = BASE_URL.format(int(number))
    try:
        res = requests.get(url, headers=HEADERS, timeout=20, verify=os.getenv("VEGALTA_INSECURE") != "1")
        if res.status_code == 404:
            return {}, url
        res.raise_for_status()
    except Exception as e:
        print(f"背番号{number}（{url}）の取得に失敗: {e}", file=sys.stderr)
        return {}, url

    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    match = CAREER_PATTERN.search(text)
    career_path = match.group(1).strip() if match else None
    birth = BIRTH_PATTERN.search(text)
    height = HEIGHT_PATTERN.search(text)
    profile = {}
    if career_path:
        profile["careerPath"] = career_path
    if birth:
        profile["birthDate"] = f"{int(birth.group(1)):04d}-{int(birth.group(2)):02d}-{int(birth.group(3)):02d}"
    if height:
        profile["heightCm"] = int(height.group(1))
    return profile, url


def main():
    players = load_roster()
    if not players:
        print("選手データが空でした。roster-export.jsonの中身を確認してください。")
        sys.exit(0)

    profiles = {}
    for p in players:
        number = p.get("number")
        if not number:
            continue
        fetched, url = fetch_profile(number)
        entry = {"officialUrl": url, **fetched}
        profiles[str(number)] = entry
        found = "取得できました" if fetched else "プロフィール項目は見つかりませんでした（リンクのみ保存）"
        print(f"背番号{number} {p.get('name', '')}: {found}")

    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(),
        "profiles": profiles,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"{len(profiles)}人分のプロフィール情報を {OUTPUT_PATH} に保存しました。")


if __name__ == "__main__":
    main()
