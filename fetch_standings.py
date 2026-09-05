#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jリーグ公式データサイト（data.j-league.or.jp）から「明治安田Ｊ２リーグ」の
順位表をスクレイピングし、data/standings.json として書き出すスクリプト。
GitHub Actions から定期実行される想定。

2026-27シーズンの「明治安田Ｊ２リーグ」は2026年8月8日に開幕（当初の想定より早かった）。
それ以前に行われていた特別大会「Ｊ２・Ｊ３百年構想リーグ」はすでに終了しており、対象外。

年度をまたぐたびに competitionId を手動更新しなくて済むよう、本来は検索フォームの
プルダウンを毎回スクレイピングして自動検出する仕組みを備えているが、サイトの
プルダウンがJavaScriptで動的に絞り込まれる作りのため、シーズン開幕直後など
タイミングによっては自動検出が失敗することがある。そのため現在は下の
MANUAL_YEAR_ID / MANUAL_COMPETITION_ID に固定値を入れて自動検出をスキップしている。

【手動で値を調べる方法（シーズンが変わったときや自動検出に戻したいとき）】
1. ブラウザで https://data.j-league.or.jp/SFRT01/ を開く
2. 「シーズン」で対象年、「大会」で 明治安田Ｊ２リーグ を選んで検索
3. 表示されたURLの yearId=XXXXX と competitionId=YYYYY を下に貼り付ける
4. 自動検出に戻したい場合は MANUAL_YEAR_ID と MANUAL_COMPETITION_ID を空文字に戻す
"""
import json
import re
import sys
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

# 自動検出をスキップして固定値を使いたい場合はここに文字列を入れる（例: "2026", "727"）。
# 空文字のままなら自動検出を行う。
#
# 2026-27シーズンは実際には2026年8月8日に開幕（当初の想定「9月頃」より早かった）。
# サイトの検索プルダウンがJavaScriptで動的に絞り込まれる作りのため、requestsでの
# 単純なGETでは開幕直後のタイミングで自動検出が「明治安田Ｊ２リーグ」を見つけられず、
# 何も更新されないことがあった。そのため、ユーザーがブラウザで実際に確認した
# yearId=2026 / competitionId=727（2026/27シーズン 明治安田Ｊ２リーグ）を
# 固定値としてここに設定し、自動検出に依存しないようにしている。
# シーズンが変わったら、上の「手動で値を調べる方法」の手順で新しいIDに更新すること。
MANUAL_YEAR_ID = "2026"
MANUAL_YEAR_LABEL = "2026/27"
MANUAL_COMPETITION_ID = "727"
MANUAL_COMPETITION_LABEL = "明治安田Ｊ２リーグ"

TARGET_TEAM_KEYWORD = "仙台"  # アプリ側でハイライトしたいチーム名に含まれる文字列
OUTPUT_PATH = "data/standings.json"
SEARCH_PAGE = "https://data.j-league.or.jp/SFRT01/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VegaltaTrackerBot/1.0; personal use)"
}


def get_soup(url, params=None):
    res = requests.get(url, headers=HEADERS, params=params, timeout=20)
    res.raise_for_status()
    res.encoding = res.apparent_encoding
    return BeautifulSoup(res.text, "html.parser")


def find_select_options(soup, name_hint_texts):
    """option群の中に name_hint_texts の文字列を含む選択肢が複数あるselectを探す"""
    best = None
    best_score = 0
    for sel in soup.find_all("select"):
        opts = [(o.get("value", ""), o.get_text(strip=True)) for o in sel.find_all("option")]
        score = sum(1 for _, label in opts if any(h in label for h in name_hint_texts))
        if score > best_score:
            best_score = score
            best = opts
    return best or []


def pick_year(soup):
    """「特別」「Ｊユース」を除いた最新の年度を選ぶ（プルダウンは新しい年度が先頭にある想定）"""
    options = find_select_options(soup, ["/", "年", "特別"])
    candidates = [
        (v, label) for v, label in options
        if v and "特別" not in label and "ユース" not in label
    ]
    if not candidates:
        return None
    return candidates[0]  # 先頭 = 最新年度のはず


def pick_j2_competition(soup):
    """「Ｊ２リーグ」に一致する大会を選ぶ（Ｊ２・Ｊ３百年構想リーグ等は除外）"""
    options = find_select_options(soup, ["Ｊ１リーグ", "Ｊ２リーグ", "Ｊ３リーグ"])
    for v, label in options:
        if not v:
            continue
        if "Ｊ２リーグ" in label and "百年構想" not in label and "・" not in label:
            return v, label
    return None


def parse_standings(soup):
    table = None
    for t in soup.find_all("table"):
        header_text = t.get_text()
        if "勝点" in header_text and "チーム" in header_text:
            table = t
            break
    if table is None:
        raise RuntimeError("順位表のtableが見つかりませんでした。サイト構造が変わった可能性があります。")

    def to_int(text):
        cleaned = re.sub(r"[^\-0-9]", "", text)
        if cleaned in ("", "-"):
            return 0
        try:
            return int(cleaned)
        except ValueError:
            return 0

    teams = []
    for tr in table.find_all("tr"):
        cells = tr.find_all("td")
        if len(cells) < 10:
            continue
        texts = [c.get_text(strip=True) for c in cells]
        rank_text = re.sub(r"\D", "", texts[1])
        if not rank_text:
            continue
        team_name = texts[2]
        teams.append({
            "rank": int(rank_text),
            "team": team_name,
            "points": to_int(texts[3]),
            "played": to_int(texts[4]),
            "win": to_int(texts[5]),
            "draw": to_int(texts[6]),
            "lose": to_int(texts[7]),
            "goalsFor": to_int(texts[8]),
            "goalsAgainst": to_int(texts[9]),
            "goalDiff": to_int(texts[10]) if len(texts) > 10 else 0,
            "highlight": TARGET_TEAM_KEYWORD in team_name,
        })

    if not teams:
        raise RuntimeError("順位表の行を1件も取得できませんでした。")
    return teams


def resolve_ids():
    if MANUAL_YEAR_ID and MANUAL_COMPETITION_ID:
        print(f"手動指定のIDを使用します: yearId={MANUAL_YEAR_ID}, competitionId={MANUAL_COMPETITION_ID}")
        return MANUAL_YEAR_ID, MANUAL_COMPETITION_ID, MANUAL_YEAR_LABEL, MANUAL_COMPETITION_LABEL

    top_soup = get_soup(SEARCH_PAGE)
    year = pick_year(top_soup)
    if not year:
        raise RuntimeError("年度の選択肢が見つかりませんでした。")
    year_id, year_label = year
    print(f"検出した年度: {year_label} (yearId={year_id})")

    # 年度を指定して大会プルダウンを取得し直す（サイトが年度に応じて大会一覧を絞り込んでいる場合に対応）
    year_soup = get_soup(SEARCH_PAGE, params={"yearId": year_id})
    comp = pick_j2_competition(year_soup) or pick_j2_competition(top_soup)
    if not comp:
        return None  # まだJ2リーグの大会が作成されていない（シーズン開幕前など）
    competition_id, competition_label = comp
    print(f"検出した大会: {competition_label} (competitionId={competition_id})")
    return year_id, competition_id, year_label, competition_label


def main():
    try:
        resolved = resolve_ids()
    except Exception as e:
        print(f"年度・大会IDの検出に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    if resolved is None:
        print("現時点では「明治安田Ｊ２リーグ」の大会が見つかりませんでした。"
              "既存のdata/standings.jsonは変更せず終了します。")
        sys.exit(0)

    year_id, competition_id, year_label, competition_label = resolved
    url = (
        f"{SEARCH_PAGE}?search=search&yearId={year_id}&yearIdLabel={year_label}"
        f"&competitionId={competition_id}&competitionIdLabel={competition_label}"
        "&competitionSectionId=0&competitionSectionIdLabel=最新節&homeAwayFlg=3"
    )

    try:
        soup = get_soup(url)
        teams = parse_standings(soup)
    except Exception as e:
        print(f"取得に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(),
        "season": year_label,
        "competition": competition_label,
        "source": url,
        "teams": teams,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"{len(teams)}チーム分の順位表を {OUTPUT_PATH} に保存しました。")


if __name__ == "__main__":
    main()

