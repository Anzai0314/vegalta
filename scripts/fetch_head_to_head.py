#!/usr/bin/env python3
"""Build Vegalta Sendai league head-to-head data from J.League Data Site."""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path


BASE_URL = "https://data.j-league.or.jp/SFMS01/search"
TEAM_ID = "54"
FIRST_YEAR = 1999
LAST_COMPLETE_YEAR = datetime.now(timezone.utc).year - 1


class MatchTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_body = False
        self.in_row = False
        self.in_cell = False
        self.row: list[dict] = []
        self.cell_text: list[str] = []
        self.cell_links: list[str] = []
        self.rows: list[list[dict]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "tbody":
            self.in_body = True
        elif self.in_body and tag == "tr":
            self.in_row = True
            self.row = []
        elif self.in_row and tag == "td":
            self.in_cell = True
            self.cell_text = []
            self.cell_links = []
        elif self.in_cell and tag == "a" and attrs_dict.get("href"):
            self.cell_links.append(str(attrs_dict["href"]))

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.in_cell:
            text = re.sub(r"\s+", " ", "".join(self.cell_text)).strip()
            self.row.append({"text": text, "links": self.cell_links[:]})
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            if self.row:
                self.rows.append(self.row[:])
            self.in_row = False
        elif tag == "tbody":
            self.in_body = False


def club_slug(cell: dict) -> str:
    for href in cell.get("links", []):
        match = re.search(r"/club/([^/]+)/", href)
        if match:
            return match.group(1)
    return ""


def iso_date(year: int, value: str) -> str:
    match = re.search(r"(\d{2})/(\d{2})/(\d{2})", value)
    if not match:
        return ""
    return f"{year:04d}-{int(match.group(2)):02d}-{int(match.group(3)):02d}"


def fetch_year(year: int) -> list[dict]:
    query = urllib.parse.urlencode([
        ("competition_years", str(year)),
        ("competition_frame_ids", "1"),
        ("competition_frame_ids", "2"),
        ("home_away_select", "0"),
        ("team_ids", TEAM_ID),
        ("tv_relay_station_name", ""),
    ])
    request = urllib.request.Request(
        f"{BASE_URL}?{query}",
        headers={"User-Agent": "Mozilla/5.0 (Vegalta head-to-head archive)"},
    )
    raw = urllib.request.urlopen(request, timeout=40).read()
    html = raw.decode("utf-8", errors="replace")
    parser = MatchTableParser()
    parser.feed(html)

    matches = []
    for row in parser.rows:
        if len(row) < 8 or row[0]["text"] != str(year):
            continue
        score_match = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", row[6]["text"])
        if not score_match:
            continue
        home_slug, away_slug = club_slug(row[5]), club_slug(row[7])
        if "sendai" not in (home_slug, away_slug):
            continue
        is_home = home_slug == "sendai"
        home_score, away_score = map(int, score_match.groups())
        detail_link = next((href for href in row[6].get("links", []) if "SFMS02" in href), "")
        opponent_name = row[7]["text"] if is_home else row[5]["text"]
        opponent_slug = away_slug if is_home else home_slug
        if not opponent_slug:
            opponent_slug = "name-" + re.sub(r"\W+", "", opponent_name, flags=re.UNICODE)
        matches.append({
            "year": year,
            "date": iso_date(year, row[3]["text"]),
            "competition": row[1]["text"].replace(" ", ""),
            "section": row[2]["text"],
            "homeAway": "H" if is_home else "A",
            "opponentId": opponent_slug,
            "opponent": opponent_name,
            "scoreFor": home_score if is_home else away_score,
            "scoreAgainst": away_score if is_home else home_score,
            "detailUrl": urllib.parse.urljoin(BASE_URL, detail_link),
        })
    return matches


def main() -> int:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/head-to-head.json")
    all_matches: list[dict] = []
    by_year: dict[str, int] = {}
    for year in range(FIRST_YEAR, LAST_COMPLETE_YEAR + 1):
        matches = fetch_year(year)
        all_matches.extend(matches)
        by_year[str(year)] = len(matches)
        print(f"{year}: {len(matches)}", file=sys.stderr)

    all_matches.sort(key=lambda item: (item["date"], item["detailUrl"]))
    payload = {
        "team": "ベガルタ仙台",
        "scope": "Jリーグ加盟後のJ1・J2リーグ戦（完了シーズン）",
        "firstYear": FIRST_YEAR,
        "lastCompleteYear": LAST_COMPLETE_YEAR,
        "minimumRankingMatches": 4,
        "source": BASE_URL,
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "countsByYear": by_year,
        "matches": all_matches,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "matches": len(all_matches)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
