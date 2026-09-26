---
name: verwerk-blogs
description: Verwerk de blogs die Shyla aanlevert (opgeslagen mails als .eml, of Word-documenten + plaatjes in inbox/) tot blogposts in src/data/blog.json, ingepland op opeenvolgende maandagen. Gebruik bij "verwerk de inbox", "nieuwe blogs van Shyla", "/verwerk-blogs".
---

# Blogs van Shyla verwerken

Shyla mailt Word-documenten met plaatjes. Jeffrey zet de mail (.eml) of de losse bijlagen
in `inbox/` (niet in git).
Jij maakt er blogposts van die elke week op maandag vanzelf live gaan: de workflow
`.github/workflows/weekly-deploy.yml` deployt maandag 07:00, en `src/utils/blog.ts`
bouwt blogs met een datum in de toekomst niet mee.

## 1. Inventariseren

- Zoek met `find inbox -not -path 'inbox/verwerkt/*'` naar alles wat nog niet verwerkt is,
  ook in submappen: Jeffrey zet nieuwe mails soms in een bestaande map. Leeg? Meld het en stop.
- Pak elke `.eml` uit naar een eigen map naast de mail:
  `python3 scripts/eml-extract.py "<mail.eml>" "inbox/<naam-zonder-extensie>"`
  Daarin komen de bijlagen, ingesloten plaatjes en `mail.txt`. `.msg` wordt niet
  ondersteund: vraag dan om de mail als `.eml` of om de losse bijlagen.
- Lees `mail.txt` en `notities.txt` als die er zijn. Aanwijzingen van Shyla daarin
  (volgorde, welk plaatje bij welke blog, "maak de links klikbaar") gaan voor.
  Vraagt ze iets (bijv. "hoeveel artikelen heb je nog?"), neem dat mee in je samenvatting.
  Logo's en handtekening-plaatjes uit de mail negeer je.
- Zet elk `.docx` om met:
  `node scripts/docx-to-text.mjs "<bestand>" /tmp/verwerk-blogs/<naam> > /tmp/verwerk-blogs/<naam>.md`
  Het tweede argument pakt afbeeldingen uit die in het document zelf zitten. Lees de
  hele tekst; let op meerdere versies in één document (zie stap 3).
- Controleer in blog.json of een blog niet al bestaat (titel of onderwerp).
- Bekijk elk plaatje (Read-tool; verklein grote plaatjes eerst met
  `sips --resampleWidth 900 ... --out /tmp/...`) en koppel het aan de juiste blog.
  Een map per mail is een sterke aanwijzing dat alles daarin bij elkaar hoort.
- `.doc` en `.pages` kun je omzetten met `textutil -convert docx`; andere formaten: vraag
  Jeffrey om een .docx.
- Twijfel over welk plaatje bij welke blog hoort, of een blog zonder plaatje? Vraag het,
  voordat je iets schrijft. Stel alle vragen in één keer.

## 2. Volgorde, datums en ids

`node scripts/blog-slots.mjs <aantal>` geeft het volgende id en de eerstvolgende vrije
maandagen. De volgorde is de verzenddatum van de mails (oudste eerst; binnen een mail de
volgorde van de bijlagen), tenzij Shyla of Jeffrey iets anders aangeeft.
Staan er nog **niet gepubliceerde** blogs uit een nieuwere mail ingepland, schuif die dan
naar achteren zodat de volgorde klopt, en meld dat. Gepubliceerde blogs verschuif je nooit.

## 3. Blogpost maken

Voeg per blog een object toe aan het eind van `src/data/blog.json`, met de velden uit
`BlogPost` in `src/data/types.ts`. Schrijf blog.json weg met 2 spaties inspringing en een
newline aan het eind (`JSON.stringify(data, null, 2)` / `json.dumps(..., indent=2, ensure_ascii=False)`),
dan verandert de rest van het bestand niet.

- **Tekst 1 op 1 van Shyla.** Niets herschrijven, inkorten, aanvullen of "verbeteren".
  Alleen evidente tikfouten mag je verbeteren; noem ze in je samenvatting.
- **title:** de titel uit het document (eerste regel). Gewone tekens, geen entities
  (`"Is 7.700 kcal écht gelijk aan 1 kilo vet?"`).
- **slug:** van de titel, kleine letters, zonder leestekens en accenten, woorden met `-`.
  Bij een lange titel mag je de slug inkorten. Moet uniek zijn in blog.json.
- **content:** maak de HTML met
  `node scripts/blog-html.mjs /tmp/verwerk-blogs/<naam>.md`
  Dat slaat de titel over en zet koppen, lijstjes, vet, schuin, links, aanhalingstekens en
  speciale tekens (als HTML-entities) om zoals de bestaande blogs. Loop daarna na:
  - `twijfel:`-meldingen op stderr: losse regels die mogelijk een kop zijn zonder vette
    opmaak (bijv. "Waar komt die 7.700 kcal vandaan?"). Echte koppen maak je `<h2>`;
    gewone korte zinnen ("Herkenbaar?") laat je staan.
  - Subkoppen die onder een `<h2>` vallen maak je `<h3>` (bijv. de redenen onder
    "Waarom ben je dan ineens zoveel zwaarder?", of "30 tot 35% lichaamsvet").
  - Alleen `<p>`, `<h2>`, `<h3>`, `<ul>`/`<li>`, `<strong>`, `<em>`, `<br />`, `<a>` en `<img>`.
  - Controleer dat er geen `*`, `[` of `](` meer in staat.
  - HTML-entities (`&eacute;`) horen alleen in `content`; `title`, `shortDescription` en
    `keywords` zijn platte tekst met gewone tekens.
- **Bronnen** als klikbare link in de tekst: `(<a href="..." target="_blank" rel="noopener">Bron</a>)`.
  Staan ze in Word als losse URL's, maak er dan zo'n link van.
- **Plaatjes in de tekst** (in de HTML als `<!-- AFBEELDING -->`): gebruik het meegestuurde
  origineel (betere kwaliteit dan de versie uit het .docx), zet het in `public/images/blog/`
  en vervang de placeholder door
  `<p><a href="images/blog/x.png" target="_blank" rel="noopener"><img src="images/blog/x.png" alt="..." loading="lazy" /></a></p>`.
  Paden beginnen met `images/` zonder `/`; de blogpagina zet de base ervoor.
- **Meerdere versies in één document:** kies de versie die Shyla aanwijst (in de mail of een
  kopje in het document) en noem je keuze in de samenvatting. Kopjes als "Artikel met
  linkjes" en een handtekening als "Fit.FoodbyShyla" horen niet in de blog.
- **shortDescription:** 1 à 2 zinnen (ongeveer 200-260 tekens) die de lezer uitnodigen,
  in Shyla's toon. Gewone tekens, **geen** HTML-entities: deze tekst wordt overal als platte
  tekst getoond (blogkaart, meta description, admin, llms.txt), dus `&euml;` zou letterlijk
  op de site verschijnen. Dit en de keywords zijn de enige teksten die je zelf schrijft.
- **category:** `Voeding`, `Educatie` of `Lifestyle`. Kennis en uitleg = Educatie;
  producten en eten = Voeding; gewoontes, gedrag, mindset = Lifestyle.
- **readTime:** woorden in de tekst gedeeld door 150, afgerond, als `"6 min"`.
- **keywords:** 4-6 zoektermen waarop iemand deze blog zou vinden.
- **date:** uit stap 2. Geen `dateModified`.
- **image:** `images/blog/<korte-naam>.png` (of .jpg/.webp als het zo is aangeleverd).
  Kopieer de banner naar `public/images/blog/` met die naam. Breder dan 2000px?
  Verklein met `sips --resampleWidth 1800 <bron> --out <doel>`.

## 4. Uitsnede van het plaatje

Blogcards tonen het plaatje in 4:3, de detailpagina in 16:10. Bekijk de banner:
- Banner met tekst links: voeg de bestandsnaam toe aan de bestaande regel met
  `object-position: left center` in `src/styles/global.css` (zowel `.recipe-photo`
  als `.recipe-detail-hero`), zoals bij `glycemische-index`.
- Tekst of onderwerp in het midden, of een foto: niets doen.
- Banner breder dan ongeveer 2:1 (bijv. 2048x768): op de detailpagina (16:10) valt dan te veel
  weg. Voeg een regel toe onder "Extra brede banners" in global.css met de echte verhouding:
  `.recipe-detail-hero:has(img[src*="<bestandsnaam>"]) { aspect-ratio: <breedte> / <hoogte>; }`
  In het blogoverzicht worden banners altijd helemaal getoond (`.recipe-photo--blog`).
- Infographic met tekst tot de randen: zie de regel eronder in global.css.

## 5. Controleren

- `npm run build` moet slagen, en de nieuwe blogs mogen er niet in staan (tenzij hun datum
  vandaag of eerder is). `SHOW_SCHEDULED=1 npm run build` moet ze wel bevatten.
- `npm test`.
- Controleer dat er geen `&...;` in `title`, `shortDescription` of `keywords` staat.
- Bekijk ze in de browser met `SHOW_SCHEDULED=1 npm run dev` (in het browserpaneel via
  launch-config `shyla-blog-preview`): blogoverzicht (banner-uitsnede) en elke blog.
  De site heeft fade-in-animaties; een screenshot na scrollen kan leeg zijn. Controleer de
  opbouw dan met `fetch` + `DOMParser` op `.blog-detail-content`.

## 6. Afronden

- Verplaats alleen wat je echt verwerkt hebt (de `.eml` en de bijbehorende uitgepakte map, of
  de losse bijlagen) naar `inbox/verwerkt/<datum-van-vandaag>/`. Kijk vlak daarvoor nog eens
  met `find` of er tussendoor iets nieuws in de inbox of die mappen is gezet; laat dat staan.
- Geef een overzicht: per blog titel, datum waarop hij live gaat, categorie, plaatje,
  gemaakte keuzes (koppen, versies, verschoven datums) en eventuele tikfouten.
  Vermeld ook hoeveel blogs er nog ingepland staan en tot welke datum dat genoeg is.
- Commit en push **niet** zelf; vraag het. Commitbericht in de stijl van eerdere blogcommits
  (`feat: vier nieuwe blogs klaargezet`), met per blog id en datum.
  Na een push naar `main` gaan ze op hun maandag vanzelf live; niets meer handmatig deployen.
