"""Build the native, server-only snapshot seed from the approved brief."""
from pathlib import Path
import re
import json
import html
import urllib.parse

folder = Path(__file__).resolve().parent.parent / "content/tyash-v1"
src = (folder / "brief.txt").read_text(encoding="utf8")
src = src[src.index("MODULE 1 —"):src.index("4. EXPÉRIENCE UTILISATEUR")]
mods, subs, exs = [], [], []
for match in re.finditer(r"^(MODULE|SOUS-MODULE|EXERCICE) ([\d.]+) — (.+)$", src, re.M):
    kind, num, title = match.groups()
    start = match.end()
    endmatch = re.search(r"^(?:MODULE|SOUS-MODULE|EXERCICE) [\d.]+ — ", src[start:], re.M)
    body = src[start:start + endmatch.start()] if endmatch else src[start:]
    body = re.sub(r"^[-=]{3,}\s*$", "", body, flags=re.M).strip()
    if kind == "MODULE":
        objective = re.search(r"Objectif :\s*(.*)", body, re.S).group(1).strip()
        m = {"id": len(mods) + 1, "stableKey": f"template_module_{num}", "position": len(mods) + 1,
             "title": title, "content_html": "<p>" + html.escape(objective) + "</p>", "submodules": [], "is_published": True}
        mods.append(m)
    elif kind == "SOUS-MODULE":
        s = {"id": 100 + len(subs), "stableKey": f"template_submodule_{num}", "module_id": m["id"],
             "position": len(m["submodules"]) + 1, "title": title, "content_html": "", "exercises": []}
        subs.append(s)
        m["submodules"].append(s)
    else:
        exs.append((int(num), title, body, m, s))
assert len(exs) == 43 and len(subs) == 15


def quotes(text):
    return re.findall(r'^"(.*)"\s*$', text, re.M)


def sections(body):
    out, key, acc = [], None, []
    for line in body.splitlines():
        if re.match(r"^[\wÀ-ÿ /’'-]+ :$", line):
            if key is not None:
                out.append((key, "\n".join(acc).strip()))
            key, acc = line[:-2], []
        elif key is not None:
            acc.append(line)
    if key is not None:
        out.append((key, "\n".join(acc).strip()))
    return out


def bullets(text):
    return [v[2:].strip() for v in text.splitlines() if v.startswith("- ")]


next_id = 1000
for number, title, body, m, s in exs:
    parts = sections(body)

    def field(name):
        return next((v for k, v in parts if k == name), "")

    intro = "\n\n".join(quotes(field("Introduction")))
    rows = []

    def add(question, type="open", options=None, help="", optional=False, placeholder=""):
        global next_id
        row = {"id": next_id, "stableKey": f"template_question_{next_id}", "module_id": m["id"], "submodule_id": s["id"],
               "position": sum(len(x["exercises"]) for x in m["submodules"]) + len(rows) + 1,
               "type": type, "question": question, "options": options or [], "explanation": help,
               "answer_placeholder": placeholder, "exercise_group_id": f"template_exercise_{number:02}"}
        next_id += 1
        if optional:
            row["completion"] = {"required": False}
        rows.append(row)
        return row

    def spectrum(left, right):
        config = {"leftLabel": left, "rightLabel": right, "leftEmoji": "", "rightEmoji": "", "defaultValue": 50,
                  "helperText": "Deplace le curseur pour situer ta marque.", "enableJustification": True,
                  "requireJustification": False, "enableEdgeEffect": True, "edgeEffectType": "confetti",
                  "edgeThreshold": 10, "leftEdgeMessage": "", "rightEdgeMessage": ""}
        add(left + " ←→ " + right, "spectrum", ["__spectrum_config__:" + urllib.parse.quote(
            json.dumps(config, ensure_ascii=False, separators=(",", ":")), safe="~()*!.'")])

    if number in (7, 37):
        for left, right in re.findall(r"^(.+?) ←→ (.+)$", body, re.M):
            spectrum(left, right)
        if number == 37:
            for row in rows:
                row["explanation"] = "Ces choix sont des préférences et non des décisions de réalisation définitives."
            add("Le son", "multiple", bullets(field("Choix")), help="Ces choix sont des préférences et non des décisions de réalisation définitives.")
    elif number == 18:
        for label in bullets(body.split("Prévoir :")[0]):
            add(label, "single", ["Pas du tout", "Un peu", "Plutôt", "Tout à fait", "Je ne sais pas", "Non concerné"])
    elif number == 22:
        spectrum("Complètement", "Pas du tout")
        rows[0]["question"] = quotes(field("Question"))[0]
        add(quotes(field("Question complémentaire"))[0])
    elif number == 36:
        add(quotes(field("Question"))[0], "group_open", ["__group_open_layout__:1", "__group_open__:Référence / lien 1",
            "__group_open__:Référence / lien 2", "__group_open__:Référence / lien 3"], optional=True)
        add(quotes(field("Question complémentaire"))[0], help="\n\n".join(quotes(field("Aide"))), optional=True)
        add("Je préfère laisser Ty Ash me proposer une direction.", "multiple", ["Je préfère laisser Ty Ash me proposer une direction."], optional=True)
    elif number == 33:
        add(title, "multiple", bullets(field("Choix")))
    elif number == 6:
        add(intro, "multiple", bullets(field("Choix")))
        add(quotes(field("Question complémentaire"))[0])
        intro = ""
    else:
        choice_values = bullets(field("Choix")) or bullets(field("Choix proposés")) or bullets(field("Inspirations"))
        for key, value in parts:
            if key in ("Question", "Question principale", "Deuxième question", "Question complémentaire", "Questions",
                       "Questions complémentaires", "Question facultative", "Question complémentaire facultative",
                       "Questions facultatives", "Questions / informations à récupérer", "Question finale"):
                for text in quotes(value) or bullets(value):
                    is_main = not rows
                    typ = "single" if number in (19, 27) and is_main else "multiple" if choice_values and is_main else "open"
                    if number in (16, 34) and (text.startswith("Avez-vous") or text.startswith("Utilisez-vous") or text in (
                        "Doit-elle vivre seule ?", "Faire partie d'une campagne ?", "D'une série ?", "Existe-t-il déjà d'autres contenus auxquels la relier ?")):
                        typ = "single"
                    options = choice_values if is_main and choice_values else ["Oui", "Non", "Je ne sais pas"] if typ == "single" else []
                    placeholder = "Je ne sais pas" if number == 23 else "Je ne sais pas / À définir ensemble / Non concerné" if number == 41 else ""
                    add(text, typ, options, optional="facultativ" in key, placeholder=placeholder)
            elif key == "Aide" and rows:
                rows[-1]["explanation"] = "\n\n".join(quotes(value))
            elif key in ("Exemples", "Aide / exemples") and rows:
                rows[-1]["explanation"] += "\n\n" + "\n".join(quotes(value))
    assert rows, (number, body)
    # Existing rich help stores the editable exercise title and introduction.
    heading = "<h3>" + html.escape(title) + "</h3>"
    if intro:
        heading += "".join("<p>" + html.escape(p) + "</p>" for p in intro.split("\n\n"))
    first = rows[0]
    first["explanation"] = heading + ("".join("<p>" + html.escape(p) + "</p>" for p in first["explanation"].strip().split("\n\n")) if first["explanation"].strip() else "")
    s["exercises"].extend(rows)

mods[3]["submodules"][1]["content_html"] = "<p>Maintenant, voyons comment la personnalité de ta marque pourrait prendre vie à l'écran.</p>"
(folder / "pathway.json").write_text(json.dumps(mods, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
print(json.dumps({"modules": len(mods), "submodules": len(subs), "exerciseGroups": len(exs),
                  "questionRows": sum(len(s["exercises"]) for s in subs)}))
