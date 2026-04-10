#!/usr/bin/env python3
"""
Generate SQL to seed site_content for site_dannis_naomi_01
from the dannis-naomi i18n source files (en.json / vi.json).

Run:  python gen_site_content.py
Output: seed_site_content.sql
"""
import json, time, uuid, pathlib

SITE_ID = "site_dannis_naomi_01"
EN_PATH = r"C:\Users\Dannis Seay\dannis-naomi\src\i18n\en.json"
VI_PATH = r"C:\Users\Dannis Seay\dannis-naomi\src\i18n\vi.json"
OUT_PATH = pathlib.Path(__file__).parent / "seed_site_content.sql"

now = int(time.time() * 1000)

def sql_str(s: str) -> str:
    return s.replace("'", "''")

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

en = load(EN_PATH)
vi = load(VI_PATH)

def build_content(data: dict) -> dict[str, dict]:
    """Returns {pageSlug: content_dict} for one language."""
    d = data  # alias

    home = {
        "welcome_title": d["home"]["welcome_title"],
        "welcome_body":  d["home"]["welcome_body"],
    }

    # Full story body — paragraphs joined with \n\n
    story_body = d["story"]["body"]
    story = {"body": story_body}

    # Travel: combine sections into heading + body for the generic content tab
    # Also keep sections array for future structured rendering
    travel_sections = d["travel"].get("sections", [])
    travel_body_parts = []
    for s in travel_sections:
        part = s["heading"] + "\n" + s["body"]
        if s.get("link_label") and s.get("link_url"):
            part += f"\n{s['link_label']}: {s['link_url']}"
        travel_body_parts.append(part)
    travel = {
        "heading": d["travel"]["title"],
        "body": "\n\n".join(travel_body_parts),
        "sections": travel_sections,
    }

    accommodations = {
        "intro":              d["accommodations"]["intro"],
        "hotel_name":         d["accommodations"]["hotel_name"],
        "hotel_description":  d["accommodations"]["hotel_description"],
        "room_block_note":    d["accommodations"]["room_block_note"],
    }

    registry = {
        "intro":            d["registry"]["intro"],
        "item_name":        d["registry"]["item_name"],
        "item_description": d["registry"]["item_description"],
        "cta":              d["registry"]["cta"],
    }

    faq = {
        "intro":     d["faq"]["intro"],
        "questions": [{"q": q["q"], "a": q["a"]} for q in d["faq"]["questions"]],
    }

    schedule = {
        "events": [
            {
                "name":        ev["name"],
                "date":        ev["date"],
                "time":        ev["time"],
                "location":    ev["location"],
                "description": ev["description"],
                "maps_url":    ev.get("maps_url", ""),
                "dress_code":  ev.get("dress_code", ""),
            }
            for ev in d["schedule"]["events"]
        ]
    }

    return {
        "home":           home,
        "story":          story,
        "travel":         travel,
        "accommodations": accommodations,
        "registry":       registry,
        "faq":            faq,
        "schedule":       schedule,
    }

en_content = build_content(en)
vi_content = build_content(vi)

rows = []
for page_slug, content in en_content.items():
    rows.append((page_slug, "en", content))
for page_slug, content in vi_content.items():
    rows.append((page_slug, "vi", content))

lines = [
    "-- ============================================================",
    f"-- site_content seed for {SITE_ID}",
    f"-- Generated {time.strftime('%Y-%m-%d %H:%M:%S')} from dannis-naomi i18n sources",
    "-- ============================================================",
    "",
]

for page_slug, lang, content in rows:
    row_id = str(uuid.uuid4())
    content_json = sql_str(json.dumps(content, ensure_ascii=False))
    lines.append(
        f"INSERT INTO site_content (id, siteId, pageSlug, lang, content, updatedAt)"
        f" VALUES ('{row_id}', '{SITE_ID}', '{page_slug}', '{lang}', '{content_json}', {now})"
        f" ON CONFLICT (siteId, pageSlug, lang) DO UPDATE SET"
        f" content = excluded.content, updatedAt = excluded.updatedAt;"
    )

sql = "\n".join(lines) + "\n"
OUT_PATH.write_text(sql, encoding="utf-8")
print(f"Wrote {len(rows)} rows to {OUT_PATH}")
print()
for page_slug, lang, _ in rows:
    print(f"  {lang}  {page_slug}")
