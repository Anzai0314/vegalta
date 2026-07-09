#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Googleニュース検索のRSSフィードから「ベガルタ仙台」関連ニュースを取得し、
data/news.json として書き出すスクリプト。GitHub Actions から定期実行される想定。

特定の1サイトに依存せず、様々なニュースサイトの記事を横断的に拾えるように
Googleニュースの検索RSSを利用している。
"""
import json
import sys
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from urllib.parse import quote
import xml.etree.ElementTree as ET

import requests

QUERY = "ベガルタ仙台"
RSS_URL = f"https://news.google.com/rss/search?q={quote(QUERY)}&hl=ja&gl=JP&ceid=JP:ja"
OUTPUT_PATH = "data/news.json"
MAX_ITEMS = 25

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VegaltaTrackerBot/1.0; personal use)"
}


def parse_pubdate(raw):
    if not raw:
        return None
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def main():
    try:
        res = requests.get(RSS_URL, headers=HEADERS, timeout=20)
        res.raise_for_status()
        root = ET.fromstring(res.content)
    except Exception as e:
        print(f"取得に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    items = []
    for item in root.findall(".//item")[:MAX_ITEMS]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_dt = parse_pubdate(item.findtext("pubDate") or "")
        source_el = item.find("source")
        source = source_el.text.strip() if source_el is not None and source_el.text else ""
        # タイトル末尾の " - 提供元名" を除去（sourceを別項目で持っているため重複させない）
        if source and title.endswith(f" - {source}"):
            title = title[: -(len(source) + 3)].strip()
        if not title or not link:
            continue
        items.append({
            "title": title,
            "link": link,
            "source": source,
            "publishedAt": pub_dt.isoformat() if pub_dt else None,
        })

    jst = timezone(timedelta(hours=9))
    payload = {
        "updatedAt": datetime.now(jst).isoformat(),
        "query": QUERY,
        "items": items,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"{len(items)}件のニュースを {OUTPUT_PATH} に保存しました。")


if __name__ == "__main__":
    main()
