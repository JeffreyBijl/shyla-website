#!/usr/bin/env python3
"""Pak een opgeslagen e-mail (.eml) uit: bijlagen, ingesloten plaatjes en de mailtekst.

Gebruik: python3 scripts/eml-extract.py <mail.eml> <doelmap>

In de doelmap komen alle bijlagen en ingesloten afbeeldingen (ook uit doorgestuurde
mails) plus mail.txt met afzender, datum, onderwerp en de tekst van de mail.
Alleen de standaardbibliotheek, zodat er niets geinstalleerd hoeft te worden.
"""

import html
import re
import sys
from email import policy
from email.parser import BytesParser
from pathlib import Path


def html_to_text(markup: str) -> str:
    markup = re.sub(r"(?is)<(script|style|head)\b.*?</\1>", "", markup)
    markup = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</li>|</h\d>", "\n", markup)
    text = html.unescape(re.sub(r"<[^>]+>", "", markup))
    return re.sub(r"\n\s*\n\s*\n+", "\n\n", text).strip()


def unique_path(folder: Path, name: str) -> Path:
    name = re.sub(r'[/\\:*?"<>|]', "_", name).strip() or "bijlage"
    path = folder / name
    counter = 2
    while path.exists():
        path = folder / f"{Path(name).stem}-{counter}{Path(name).suffix}"
        counter += 1
    return path


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("Gebruik: python3 scripts/eml-extract.py <mail.eml> <doelmap>")

    source, target = Path(sys.argv[1]), Path(sys.argv[2])
    with source.open("rb") as f:
        message = BytesParser(policy=policy.default).parse(f)
    target.mkdir(parents=True, exist_ok=True)

    plain, rich, saved = [], [], []
    for part in message.walk():
        if part.is_multipart() or part.get_content_type() == "message/rfc822":
            continue
        filename = part.get_filename()
        maintype = part.get_content_maintype()
        is_attachment = part.get_content_disposition() == "attachment" or filename

        if is_attachment or maintype == "image":
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            if not filename:
                extension = part.get_content_subtype().replace("jpeg", "jpg")
                filename = f"ingesloten-afbeelding-{len(saved) + 1}.{extension}"
            path = unique_path(target, filename)
            path.write_bytes(payload)
            saved.append(path.name)
        elif part.get_content_type() == "text/plain":
            plain.append(part.get_content())
        elif part.get_content_type() == "text/html":
            rich.append(html_to_text(part.get_content()))

    body = "\n\n".join(plain).strip() or "\n\n".join(rich).strip()
    header = "\n".join(
        f"{label}: {message.get(key, '')}"
        for label, key in (("Van", "From"), ("Datum", "Date"), ("Onderwerp", "Subject"))
    )
    (target / "mail.txt").write_text(f"{header}\n\n{body}\n", encoding="utf-8")

    print(f"{source.name} -> {target}")
    print(f"  mail.txt ({len(body)} tekens tekst)")
    for name in saved:
        print(f"  {name}")


if __name__ == "__main__":
    main()
