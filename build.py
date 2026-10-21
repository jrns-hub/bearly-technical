"""Assemble the inner pages: pages/<name>.html bodies + the shared head and tail -> <name>.html at the site root.
The first line of each body is a comment: <!--title: ... | page: ... | desc: ... -->; an optional <!--extra: ... --> adds scripts.
Run: python build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
head = (ROOT / "_head.txt").read_text(encoding="utf-8")
tail = (ROOT / "_tail.txt").read_text(encoding="utf-8")
for f in sorted((ROOT / "pages").glob("*.html")):
    body = f.read_text(encoding="utf-8")
    meta = dict(kv.split(":", 1) for kv in re.match(r"<!--(.*?)-->", body).group(1).split(" | "))
    meta = {k.strip(): v.strip() for k, v in meta.items()}
    extra = re.search(r"<!--extra:(.*?)-->", body)
    body = re.sub(r"<!--(title|extra):.*?-->\n?", "", body)
    page = head.replace("{title}", meta["title"]).replace("{desc}", meta["desc"]).replace("{page}", meta["page"]) + body + \
        tail.replace("{extra}", ("\n" + extra.group(1).strip()) if extra else "")
    (ROOT / f.name).write_text(page, encoding="utf-8")
    print("built", f.name)
