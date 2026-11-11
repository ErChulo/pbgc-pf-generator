#!/usr/bin/env python3
"""Build the single-file PF Generator.

Injects prompts/pf-scraper-prompt.md into pf-generator.html (the
PROMPT markers) and runs safety checks:

- the embedded prompt names the factor types and says do not guess
- 0 fetch(, 0 <script src, 0 <link, 0 external URLs in the HTML
- no duplicate top-level function/var declarations in the <script>

Usage:
  python3 scripts/build_single_file.py [--version V]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "pf-generator.html"
PROMPT = ROOT / "prompts" / "pf-scraper-prompt.md"


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    version = None
    if "--version" in sys.argv:
        i = sys.argv.index("--version")
        if i + 1 >= len(sys.argv):
            fail("--version needs a value")
        version = sys.argv[i + 1]

    html = HTML.read_text(encoding="utf-8")
    prompt = PROMPT.read_text(encoding="utf-8")

    # 1. Inject the prompt between the PROMPT markers (idempotent).
    start = html.find("/* PROMPT-START */")
    end = html.find("/* PROMPT-END */")
    if start < 0 or end < 0 or end <= start:
        fail("prompt markers not found in pf-generator.html")
    end += len("/* PROMPT-END */")
    replacement = (
        "/* PROMPT-START */\nvar PF_SCRAPER_PROMPT = "
        + json.dumps(prompt)
        + ";\n/* PROMPT-END */"
    )
    html = html[:start] + replacement + html[end:]

    # 2. Prompt content checks.
    for needle in ("ERF", "LRF", "BFCF", "OTHER", "Do not guess", "only** valid JSON"):
        if needle not in prompt:
            fail(f"prompt does not contain: {needle}")
    if "Do not guess" not in prompt:
        fail("prompt must say: Do not guess")
    if "only** valid JSON" not in prompt:
        fail("prompt must say: return only valid JSON")

    # 3. Safety checks on the HTML.
    script_m = re.search(r"<script>([\s\S]*)</script>", html)
    if not script_m:
        fail("no <script> block")
    script = script_m.group(1)
    if "fetch(" in html:
        fail("fetch( found in HTML")
    if "<script src" in html:
        fail("<script src found in HTML")
    if "<link" in html:
        fail("<link found in HTML")
    if "import(" in script:
        fail("import( found in script")
    urls = re.findall(r"https?://[^\s\"'<>]+", html)
    bad = [u for u in urls if "schemas.openxmlformats.org" not in u and "www.w3.org" not in u]
    if bad:
        fail(f"external URLs found: {bad[:3]}")

    # 4. No duplicate top-level function/var declarations.
    names = re.findall(r"^(?:function|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)", script, re.M)
    dupes = sorted({n for n in names if names.count(n) > 1})
    if dupes:
        fail(f"duplicate top-level declarations: {dupes}")

    if version:
        html = re.sub(r"PF Generator v[0-9.]+", f"PF Generator v{version}", html, count=1)
        html = re.sub(r'var PF_VERSION="[0-9.]+";', f'var PF_VERSION="{version}";', html)

    HTML.write_text(html, encoding="utf-8")
    print(f"build ok: prompt {len(prompt)} chars injected, 0 fetch, 0 external URLs")
    print(f"top-level declarations: {len(names)} unique, 0 duplicates")


if __name__ == "__main__":
    main()
