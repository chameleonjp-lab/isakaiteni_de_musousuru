"""Build a single HTML with the scenarios, renderer, styles, and game code."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parent / "docs" / "scenario" / "data"
THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
THREE_SHA = "9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2"

def read(name):
    return (ROOT / name).read_text(encoding="utf-8")

def data_pack():
    datasets = {name: json.loads((DATA / (name + ".json")).read_text(encoding="utf-8"))
                for name in ("main", "rooms", "people", "items", "escape")}
    datasets["threads"] = [json.loads(f.read_text(encoding="utf-8")) for f in sorted((DATA / "threads").glob("T*.json"))]
    assert len(datasets["main"]) == 20 and sum(len(t["events"]) for t in datasets["threads"]) == 300
    value = json.dumps(datasets, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    return "const CASTLE_DATA = " + value + ";"

def library(local):
    if local:
        source = local.read_bytes()
    else:
        with urllib.request.urlopen(THREE_URL, timeout=20) as response:
            source = response.read()
    if hashlib.sha256(source).hexdigest() != THREE_SHA:
        raise RuntimeError("Three.js integrity check failed.")
    return source.decode("utf-8")

def build(output, local, scenes=False, revision=None):
    if revision is not None and not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError("The build revision must be a full Git commit ID.")
    original = read("stages/page.html" if scenes else "page.html")
    modules = ["model.js", *("stages/" + name + ".js" for name in
               ("characters", "items", "environments", "stage1", "stage2", "stage3", "bridge"))]
    modules += ["stages/check.js"] if scenes else ["puzzles.js", "dialogue.js", "walk.js", "residents.js", "view.js", "game.js"]
    code = [library(local), data_pack(), *(read(file) for file in modules)]
    if any("</script" in part.lower() for part in code):
        raise RuntimeError("An unescaped inline script closer was found.")
    html = original.replace("/* CASTLE_CSS */", read("style.css")).replace("/* CASTLE_SCRIPT */", "\n".join(code))
    if revision:
        html = html.replace("</head>", f'<meta name="castle-revision" content="{revision}">\n</head>', 1)
    html = html.replace("</html>", "<!--\n" + read("THREE-LICENSE.txt").strip() + "\n-->\n</html>")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--three", type=Path, help="Use a local copy of the pinned Three.js asset.")
    parser.add_argument("--scenes", action="store_true", help="Build the scene verification page.")
    parser.add_argument("--revision", help="Embed the full Git commit ID in the generated page.")
    options = parser.parse_args()
    build(options.output, options.three, options.scenes, options.revision)
