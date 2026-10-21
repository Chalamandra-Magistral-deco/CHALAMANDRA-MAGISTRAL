"""Dependency-free integrity checks for the static Chalamandra site."""

from __future__ import annotations

import re
import subprocess
import json
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "prepare-vercel-output.mjs"


class HTMLInventory(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, dict[str, str | None]]] = []
        self.unsafe_blank_links: list[str] = []
        self.inline_scripts: list[tuple[str, str]] = []
        self._script_attrs: dict[str, str | None] | None = None
        self._script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attributes = dict(attrs)
        if attributes.get("id"):
            self.ids.append(str(attributes["id"]))

        for attribute in ("href", "src"):
            value = attributes.get(attribute)
            if value:
                self.references.append((str(value), attributes))

        if tag.lower() == "a" and str(attributes.get("target") or "").lower() == "_blank":
            rel = {
                token.lower()
                for token in str(attributes.get("rel") or "").split()
            }
            if not ({"noopener", "noreferrer"} & rel):
                self.unsafe_blank_links.append(str(attributes.get("href") or ""))

        if tag.lower() == "script":
            self._script_attrs = attributes
            self._script_parts = []

    def handle_data(self, data: str) -> None:
        if self._script_attrs is not None:
            self._script_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "script" or self._script_attrs is None:
            return
        attributes = self._script_attrs
        script_type = str(attributes.get("type") or "").lower()
        source = "".join(self._script_parts)
        if (
            not attributes.get("src")
            and script_type not in ("application/ld+json", "application/json", "importmap")
            and source.strip()
        ):
            self.inline_scripts.append((script_type, source))
        self._script_attrs = None
        self._script_parts = []


def read_page(path: Path) -> tuple[str, HTMLInventory]:
    text = path.read_text(encoding="utf-8")
    parser = HTMLInventory()
    parser.feed(text)
    parser.close()
    return text, parser


def built_pages() -> list[str]:
    text = BUILD_SCRIPT.read_text(encoding="utf-8")
    match = re.search(r"const pages\s*=\s*\[(.*?)\];", text, re.DOTALL)
    if not match:
        raise AssertionError("Could not find the page manifest in prepare-vercel-output.mjs")
    return re.findall(r'"([^"]+\.html)"', match.group(1))


class SiteIntegrityTests(unittest.TestCase):
    def test_deployment_page_manifest_points_to_existing_pages(self) -> None:
        pages = built_pages()
        self.assertTrue(pages, "The build must declare at least one HTML page")
        self.assertEqual(len(pages), len(set(pages)), "Duplicate page entry in build manifest")
        for page in pages:
            with self.subTest(page=page):
                self.assertTrue((ROOT / page).is_file(), f"Missing deployed page: {page}")

    def test_local_paths_and_fragments_resolve(self) -> None:
        html_pages = sorted(ROOT.glob("*.html"))
        inventories = {page.name: read_page(page)[1] for page in html_pages}
        ids_by_page = {name: set(inv.ids) for name, inv in inventories.items()}
        problems: list[str] = []

        for page in html_pages:
            for reference, _attrs in inventories[page.name].references:
                parsed = urlsplit(reference)
                if parsed.scheme or parsed.netloc or not reference:
                    continue

                path_text = unquote(parsed.path)
                if path_text in ("", "/"):
                    target = ROOT / (page.name if not path_text else "index.html")
                elif path_text.startswith("/"):
                    target = ROOT / path_text.lstrip("/")
                else:
                    target = (page.parent / path_text).resolve()

                if not target.exists() or not target.is_file():
                    problems.append(f"{page.name}: missing local target {reference}")
                    continue

                if parsed.fragment and target.suffix.lower() == ".html":
                    target_name = target.name
                    if target_name not in ids_by_page:
                        _text, target_inventory = read_page(target)
                        ids_by_page[target_name] = set(target_inventory.ids)
                    if unquote(parsed.fragment) not in ids_by_page[target_name]:
                        problems.append(f"{page.name}: missing fragment {reference}")

        self.assertEqual(problems, [], "\n".join(problems))

    def test_no_duplicate_ids_in_html(self) -> None:
        duplicates: list[str] = []
        for page in sorted(ROOT.glob("*.html")):
            _text, inventory = read_page(page)
            seen: set[str] = set()
            repeated: set[str] = set()
            for value in inventory.ids:
                if value in seen:
                    repeated.add(value)
                seen.add(value)
            duplicates.extend(f"{page.name}: duplicate id {value}" for value in sorted(repeated))
        self.assertEqual(duplicates, [], "\n".join(duplicates))

    def test_external_links_opened_in_new_tabs_have_safe_rel(self) -> None:
        unsafe: list[str] = []
        for page in sorted(ROOT.glob("*.html")):
            _text, inventory = read_page(page)
            unsafe.extend(f"{page.name}: {href}" for href in inventory.unsafe_blank_links)
        self.assertEqual(unsafe, [], "\n".join(unsafe))

    def test_tailwind_scans_every_deployed_page(self) -> None:
        text = (ROOT / "assets" / "tailwind.input.css").read_text(encoding="utf-8")
        registered = set(re.findall(r'@source\s+"\.\./([^"]+\.html)"\s*;', text))
        missing = sorted(set(built_pages()) - registered)
        self.assertEqual(missing, [], f"Build pages missing from Tailwind source registry: {missing}")

    def test_inline_javascript_is_syntax_valid(self) -> None:
        failures: list[str] = []
        for page in sorted(ROOT.glob("*.html")):
            _text, inventory = read_page(page)
            for index, (script_type, source) in enumerate(inventory.inline_scripts, 1):
                suffix = ".mjs" if script_type == "module" else ".js"
                with tempfile.NamedTemporaryFile(
                    mode="w", suffix=suffix, encoding="utf-8", delete=False
                ) as stream:
                    stream.write(source)
                    temp_path = Path(stream.name)
                try:
                    result = subprocess.run(
                        ["node", "--check", str(temp_path)],
                        capture_output=True,
                        text=True,
                        check=False,
                    )
                    if result.returncode:
                        details = result.stderr.strip().splitlines()
                        failures.append(
                            f"{page.name} inline script {index}: "
                            + (details[-1] if details else "Node syntax check failed")
                        )
                finally:
                    temp_path.unlink(missing_ok=True)
        self.assertEqual(failures, [], "\\n".join(failures))

    def test_csp_is_configured_once_as_a_global_enforced_header(self) -> None:
        config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        csp_headers = [
            header
            for rule in config.get("headers", [])
            for header in rule.get("headers", [])
            if header.get("key", "").lower() in (
                "content-security-policy", "content-security-policy-report-only"
            )
        ]
        self.assertEqual(len(csp_headers), 1, "Expected a single global CSP header")
        self.assertEqual(csp_headers[0]["key"].lower(), "content-security-policy")
        self.assertIn("object-src 'none'", csp_headers[0]["value"])
        for page in sorted(ROOT.glob("*.html")):
            source = page.read_text(encoding="utf-8")
            self.assertNotRegex(
                source,
                r"(?i)<meta[^>]+http-equiv\s*=\s*['\"]Content-Security-Policy",
                f"{page.name} must not define a page-specific CSP",
            )

    def test_consent_default_has_one_source_of_truth(self) -> None:
        homepage = (ROOT / "index.html").read_text(encoding="utf-8")
        consent = (ROOT / "assets" / "decox-consent.js").read_text(encoding="utf-8")
        self.assertNotIn("DecoX Consent Mode V2 - default denied", homepage)
        self.assertEqual(
            consent.count('window.gtag("consent", "default"'),
            1,
            "Expected a single default-consent declaration in the consent module",
        )


if __name__ == "__main__":
    unittest.main()
