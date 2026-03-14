# Operation Queue voor Admin Pagina

## Probleem

Bij meerdere opeenvolgende admin operaties (create/edit/delete) ontstaat een 409 Conflict error ("Data is ondertussen gewijzigd") omdat de SHA van het JSON-bestand verandert na elke commit. De tweede operatie gebruikt een stale SHA.

## Oplossing: Queue-systeem

Alle operaties worden sequentieel verwerkt via een in-memory queue. Elke operatie haalt een verse SHA op voordat deze schrijft. De UI wordt optimistisch bijgewerkt zodat de gebruiker geen vertraging ervaart.

## Architectuur

### Nieuwe module: `src/lib/queue.ts`

`OperationQueue` class:
- `enqueue(operation)` — voegt async operatie toe aan FIFO queue
- Verwerkt operaties sequentieel — volgende start pas als vorige klaar is
- Verse SHA wordt opgehaald vóór elke operatie
- Status callbacks voor UI updates (progress, errors)

### UI-gedrag

**Optimistic updates:**
- Delete: item verdwijnt direct uit de lijst
- Create/edit: item verschijnt/wijzigt direct
- Achtergrondoperatie draait in queue

**Statusbalk:**
- Verschijnt onder deploy banner als queue >0 items bevat
- Toont: "Verwerken: 1 van 3 acties..."
- Bij succes: "Alle acties verwerkt" (auto-hide na paar seconden)

**Foutafhandeling:**
- Queue stopt bij fout, toont welke actie mislukte
- Resterende acties blijven met "Opnieuw proberen" knop
- Optimistic updates van gefaalde + resterende acties worden teruggedraaid (data herladen van GitHub)

### Operatie-flow

```
Gebruiker klikt "Verwijder recept X"
  → Item X verdwijnt uit UI (optimistic)
  → { type: 'delete-recipe', id, label } in queue

Gebruiker klikt "Opslaan nieuw recept Y"
  → Recept Y verschijnt in lijst (optimistic)
  → { type: 'save-recipe', data, label } in queue

Queue verwerkt:
  1. Verse recipes.json + SHA ophalen
  2. Recept X verwijderen, writeFile() met verse SHA
  3. Verse recipes.json + SHA ophalen (nieuwe SHA na commit 1)
  4. Recept Y toevoegen, writeFile() met verse SHA
```

### Scope

- Recipe CRUD en Blog CRUD gaan via de queue
- Image uploads kunnen parallel (onafhankelijke files)
- Deploy polling en token validatie blijven ongewijzigd
