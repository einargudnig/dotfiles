#!/usr/bin/env python3
"""Render the late-orders review board from data.json.

    python3 scripts/build_review_artifact.py data.json late-orders-2026-09-15.html

The JSON shape is documented in references/review-artifact.md. This script
validates nothing and ignores keys it doesn't render, so extra fields are
harmless and missing ones degrade rather than crash.

Deliberately emits **no JavaScript**. Artifact code runs in a sandbox that can't
reach MCP tools, so any "place order" control here would be theatre. The
checkboxes in the worklist are plain HTML: they toggle natively and reset on
reload, which is exactly the scratchpad behaviour the page promises.
"""

import html
import json
import sys
from urllib.parse import quote

# Order matters: it's the order the "Needs you first" groups appear in, which is
# roughly most-urgent first.
GROUPS = [
    ("same_day",       "Same day",              "Today's lunch, or a date already gone. Never placed by a run — the kitchen has already cooked and counted. If you've spoken to them and there's room, say so naming the line."),
    ("allergen_clash", "Allergen conflict",     "The dish contains something on the customer's own allergen profile. Only the customer's word clears it, relayed to us — not ours to decide either way."),
    ("service_paused", "Service paused",        "The date falls inside a period this customer switched their service off. Either they forgot to lift it, or they're away and didn't mean this — only they can say."),
    ("other_people",   "Covers more than the sender", "One order goes against one account. The colleague needs their own account, or a guest account — that's your call, not the scan's."),
    ("no_service",     "No service that day",   "This location doesn't get that sitting on that weekday at all. A different reply from 'that dish isn't on the menu'."),
    ("ambiguous",      "Sitting unclear",       "The request is real but underspecified. Name the sitting and it becomes a normal placeable line."),
    ("not_on_menu",    "Nothing matches",       "No dish on that day's menu matches what they asked for. Don't substitute — they need a reply."),
    ("date_warning",   "Date to confirm",       "What the customer wrote and what we resolved don't agree. Still placeable, but worth one look."),
]

PILL_LABELS = {
    "matched":        "ready",
    "same_day":       "same day",
    "allergen_clash": "allergen",
    "service_paused": "paused",
    "other_people":   "other people",
    "no_service":     "no service",
    "ambiguous":      "unclear sitting",
    "not_on_menu":    "not on menu",
}

CSS = """
:root{--ink:#14110f;--mute:#6b625c;--line:#e6e0da;--bg:#faf8f6;--card:#fff;
--amber:#b45309;--amber-bg:#fef3c7;--ok:#166534;--ok-bg:#dcfce7;--hold:#9a3412;--hold-bg:#ffedd5}
*{box-sizing:border-box}
body{margin:0;padding:0 16px 64px;background:var(--bg);color:var(--ink);
font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1040px;margin:0 auto}
header{padding:32px 0 8px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}
.sub{color:var(--mute);font-size:13.5px}
.score{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 8px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;min-width:150px}
.tile .n{font-size:30px;font-weight:650;letter-spacing:-.02em;line-height:1.1}
.tile .l{color:var(--mute);font-size:12.5px;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.tile.small .n{font-size:19px;font-weight:550;color:var(--mute)}
h2{font-size:17px;margin:34px 0 10px;letter-spacing:-.005em}
.worklist{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 18px 16px}
.grp{margin-top:16px}
.grp h3{font-size:14px;margin:0 0 2px}
.grp .blurb{color:var(--mute);font-size:13px;margin:0 0 8px}
.grp ul{list-style:none;margin:0;padding:0}
.grp li{display:flex;gap:9px;align-items:flex-start;padding:4px 0;font-size:14px}
.grp input{margin:4px 0 0}
.note{color:var(--mute);font-size:13px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin:14px 0}
.chead{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:baseline}
.cname{font-weight:600}
.cmeta{color:var(--mute);font-size:13px}
.flag{background:var(--amber-bg);color:var(--amber);border-radius:8px;padding:7px 11px;font-size:13px;margin:10px 0}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);
font-weight:600;padding:0 8px 6px 0;border-bottom:1px solid var(--line)}
td{padding:9px 8px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
.num{color:var(--mute);width:34px;font-variant-numeric:tabular-nums}
.pill{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;white-space:nowrap}
.p-matched{background:var(--ok-bg);color:var(--ok)}
.p-same_day,.p-allergen_clash,.p-service_paused{background:var(--hold-bg);color:var(--hold)}
.p-other_people,.p-no_service,.p-ambiguous,.p-not_on_menu{background:var(--amber-bg);color:var(--amber)}
.rowwarn{color:var(--amber);font-size:12.5px;margin-top:3px}
.req{color:var(--mute);font-size:12.5px;margin-top:3px}
a.btn{display:inline-block;margin-top:12px;background:var(--ink);color:#fff;text-decoration:none;
border-radius:9px;padding:8px 14px;font-size:13.5px}
a{color:inherit}
.foot{color:var(--mute);font-size:12.5px;margin-top:28px}
@media (prefers-color-scheme:dark){
:root{--ink:#f2efec;--mute:#a49b94;--line:#2f2a26;--bg:#141210;--card:#1c1917;
--amber:#fbbf24;--amber-bg:#3a2c0c;--ok:#86efac;--ok-bg:#0f2e1b;--hold:#fdba74;--hold-bg:#3a1f0c}
a.btn{background:#f2efec;color:#141210}}
"""


def esc(v):
    return html.escape(str(v if v is not None else ""))


def verification_url(email, lines):
    parts = [f"imp={email}"]
    for ln in lines:
        mid = ln.get("menuItemId")
        if ln.get("status") == "matched" and mid:
            parts.append(f"ms={ln.get('date')}:{ln.get('meal')}:{mid}")
    return "https://app.maul.is/verification?" + "&".join(parts)


def menu_url(email, imp_week):
    return f"https://app.maul.is/menus/{imp_week}?imp={quote(email)}"


def build(data):
    customers = data.get("customers", [])

    # Line numbers are derived here, sequentially across the whole page, and are
    # the shared vocabulary with the operator in Step 10.
    n = 0
    for c in customers:
        for ln in c.get("lines", []):
            n += 1
            ln["_n"] = n

    all_lines = [(c, ln) for c in customers for ln in c.get("lines", [])]
    ready = sum(1 for _, ln in all_lines if ln.get("status") == "matched")
    needs = [(c, ln) for c, ln in all_lines
             if ln.get("status") != "matched" or ln.get("dateWarning")]

    o = ['<!doctype html><html lang="en"><head><meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         f'<title>Maul late orders — {esc(data.get("windowLabel",""))}</title>',
         f"<style>{CSS}</style></head><body><div class='wrap'>"]

    o.append("<header><h1>Late orders — review board</h1>")
    o.append(f"<div class='sub'>{esc(data.get('windowLabel',''))} · generated "
             f"{esc(data.get('generatedAt',''))} · menu week {esc(data.get('menuWeek',''))}</div></header>")

    o.append("<div class='score'>")
    o.append(f"<div class='tile'><div class='n'>{ready}</div><div class='l'>ready to place</div></div>")
    o.append(f"<div class='tile'><div class='n'>{len(needs)}</div><div class='l'>need you first</div></div>")
    o.append(f"<div class='tile small'><div class='n'>{len(customers)}</div><div class='l'>customers</div></div>")
    o.append("</div>")

    if needs:
        o.append("<h2>Needs you first</h2><div class='worklist'>")
        for key, title, blurb in GROUPS:
            if key == "date_warning":
                members = [(c, ln) for c, ln in needs
                           if ln.get("dateWarning") and ln.get("status") == "matched"]
            else:
                members = [(c, ln) for c, ln in needs if ln.get("status") == key]
            if not members:
                continue
            o.append(f"<div class='grp'><h3>{esc(title)}</h3><p class='blurb'>{esc(blurb)}</p><ul>")
            for c, ln in members:
                bits = [f"<a href='#line-{ln['_n']}'>#{ln['_n']}</a>",
                        esc(c.get("name")), "·", esc(ln.get("dayLabel")), esc(ln.get("meal"))]
                detail = ln.get("flagReason") or ln.get("pausedRange") or ln.get("dateWarning") or ""
                if detail:
                    bits += ["—", esc(detail)]
                o.append("<li><input type='checkbox'><span>" + " ".join(bits) + "</span></li>")
            o.append("</ul></div>")
        o.append("<p class='note' style='margin-top:18px'>Ticks are a scratchpad — they reset if you "
                 "reload. Nothing on this page places an order.</p></div>")

    o.append("<h2>Customers</h2>")
    for c in customers:
        lines = c.get("lines", [])
        o.append("<div class='card'><div class='chead'>")
        o.append(f"<div><span class='cname'>{esc(c.get('name'))}</span> "
                 f"<span class='cmeta'>{esc(c.get('accountEmail'))}</span></div>")
        o.append(f"<div class='cmeta'>{esc(c.get('company'))} · {esc(c.get('location'))} · "
                 f"{esc(c.get('confidence'))} confidence</div></div>")

        meta = []
        sender = c.get("senderEmail")
        if sender and sender != c.get("accountEmail"):
            meta.append(f"wrote from {esc(sender)}")
        if c.get("receivedAt"):
            meta.append(esc(c["receivedAt"]))
        if c.get("subject"):
            meta.append("“" + esc(c["subject"]) + "”")
        if c.get("translated"):
            scope = c.get("translationScope")
            meta.append("translation posted" + (f" ({esc(scope)})" if scope else ""))
        if meta:
            o.append("<div class='cmeta'>" + " · ".join(meta) + "</div>")

        nt = c.get("notifications") or {}
        if nt.get("email") is False and nt.get("sms") is False:
            o.append("<div class='flag'>⚠ Email <strong>and</strong> SMS notifications off — nothing "
                     "from Maul reaches them. A reply here is the only thing that will.</div>")
        elif nt.get("email") is False or nt.get("sms") is False:
            off = "Email" if nt.get("email") is False else "SMS"
            o.append(f"<div class='flag'>{esc(off)} notifications off.</div>")
        if c.get("note"):
            o.append(f"<div class='note' style='margin-top:8px'>{esc(c['note'])}</div>")

        o.append("<table><tr><th></th><th>Day</th><th>Sitting</th><th>Dish</th>"
                 "<th>Restaurant</th><th>Status</th></tr>")
        for ln in lines:
            st = ln.get("status", "")
            o.append(f"<tr id='line-{ln['_n']}'><td class='num'>{ln['_n']}</td>"
                     f"<td>{esc(ln.get('dayLabel'))}</td><td>{esc(ln.get('meal'))}</td><td>")
            if ln.get("dishIs"):
                o.append(esc(ln["dishIs"]))
                if ln.get("dishEn"):
                    o.append(f" <span class='cmeta'>({esc(ln['dishEn'])})</span>")
            elif ln.get("options"):
                o.append(" <span class='cmeta'>or</span> ".join(
                    esc(op.get("dishIs") or op.get("dishEn")) + f" <span class='cmeta'>({esc(op.get('meal'))})</span>"
                    for op in ln["options"]))
            else:
                o.append("<span class='cmeta'>—</span>")
            if ln.get("requested"):
                o.append(f"<div class='req'>asked for: “{esc(ln['requested'])}”</div>")
            if ln.get("dateWarning"):
                o.append(f"<div class='rowwarn'>⚠ {esc(ln['dateWarning'])}</div>")
            if ln.get("allergens") and st == "allergen_clash":
                o.append(f"<div class='rowwarn'>contains {esc(', '.join(ln['allergens']))} · profile lists "
                         f"{esc(', '.join(c.get('userAllergens') or []))}</div>")
            o.append(f"</td><td>{esc(ln.get('restaurant') or '—')}</td>"
                     f"<td><span class='pill p-{esc(st)}'>{esc(PILL_LABELS.get(st, st))}</span></td></tr>")
        o.append("</table>")

        if any(ln.get("status") == "matched" and ln.get("menuItemId") for ln in lines):
            o.append(f"<a class='btn' href='{esc(verification_url(c.get('accountEmail'), lines))}'>"
                     "Open verification</a>")
        else:
            o.append(f"<a class='btn' href='{esc(menu_url(c.get('accountEmail',''), data.get('impWeek','')))}'>"
                     "Open menu as customer</a>")
        o.append("</div>")

    o.append("<p class='foot'>This page places nothing. It carries no JavaScript: artifact code can't "
             "reach the ordering tools, so approval happens in chat, not here.</p>")
    o.append("</div></body></html>")
    return "".join(o)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: build_review_artifact.py <data.json> <out.html>")
    with open(sys.argv[1], encoding="utf-8") as fh:
        data = json.load(fh)
    with open(sys.argv[2], "w", encoding="utf-8") as fh:
        fh.write(build(data))
    print(f"wrote {sys.argv[2]}")


if __name__ == "__main__":
    main()
