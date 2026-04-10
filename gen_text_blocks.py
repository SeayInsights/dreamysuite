#!/usr/bin/env python3
"""Generate SQL to fix text block configs, countdown double-encoding, and unpublish site."""
import json, time

now = int(time.time() * 1000)

def sql_str(s: str) -> str:
    """Escape a Python string for SQL single-quoted literals."""
    return s.replace("'", "''")

def cfg(obj: dict) -> str:
    return sql_str(json.dumps(obj, ensure_ascii=False))

updates = [
    # Fix 1: fix double-encoded countdown config — was stringified JSON, needs plain JSON object
    (
        "blk_dn_h3",
        cfg({"countdownDate": "2027-01-17T18:00"}),
    ),
    # Fix 2: text blocks — add heading + body fields
    (
        "blk_dn_h5",
        cfg({
            "contentKey": "home-welcome",
            "heading": "You're Invited",
            "body": "We want you to know how excited we are to have you with us! To make your arrival as smooth as possible, please take a moment to RSVP by August 1, 2026. Your response will greatly help us in preparing for your visit.",
        }),
    ),
    (
        "blk_dn_s4",
        cfg({
            "contentKey": "story",
            "heading": "Story",
            "body": (
                "Dannis Seay and Naomi Nguyen's story began at Toast & Berry, unfolding like a scene from a romantic comedy. "
                "Naomi arrived at the wrong location, leaving Dannis waiting for an entire hour. "
                "Yet, when she finally arrived, he couldn't take his eyes off her. "
                "Naomi was immediately charmed by his warm smile, kind eyes, and effortless conversation, along with his gentlemanly manners.\n\n"
                "Through it all, it's the everyday moments that inspire the most: "
                "Dannis caring for Naomi and their pets, Naomi's kindness, and their shared laughter. "
                "Together, they've built a life founded on love, curiosity, and adventure."
            ),
        }),
    ),
    (
        "blk_dn_rg4",
        cfg({
            "contentKey": "registry",
            "heading": "Registry",
            "body": "Your presence is enough of a present to us! But for those of you who are stubborn, we've put together a wish-list to help you out.",
        }),
    ),
    (
        "blk_dn_t4",
        cfg({
            "contentKey": "travel",
            "heading": "Travel",
            "body": "A Vietnam eVisa is required for most international visitors. Apply for a single-entry eVisa before your trip at the official Vietnam government portal. Fly into Tan Son Nhat International Airport (SGN) in Ho Chi Minh City.",
        }),
    ),
    (
        "blk_dn_a4",
        cfg({
            "contentKey": "accommodations",
            "heading": "Where to Stay",
            "body": "We are thrilled to share our wedding day with all of you! We understand that traveling can be a significant commitment, so we are pleased to offer everyone a complimentary stay at the resort on the night of the wedding. If you're coming from a distance, we recommend arriving a day early to relax and settle in before the festivities begin.",
        }),
    ),
]

lines = []
for block_id, config_val in updates:
    lines.append(
        f"UPDATE block SET config = '{config_val}', updatedAt = {now} WHERE id = '{block_id}';"
    )

# Fix 3: unpublish the site (status -> draft)
lines.append(
    f"UPDATE site SET status = 'draft', updatedAt = {now} WHERE id = 'site_dannis_naomi_01';"
)

sql = "\n".join(lines)
out = "C:/Users/Dannis Seay/studio/pagebloom/fix_text_blocks.sql"
with open(out, "w", encoding="utf-8") as f:
    f.write(sql)
print(f"Wrote {len(lines)} statements to fix_text_blocks.sql")
print()
print(sql)
