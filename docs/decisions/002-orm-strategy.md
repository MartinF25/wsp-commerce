# ADR-002: ORM-Strategie für den PostgreSQL Commerce Core

**Status:** Accepted  
**Datum:** 2026-04-19  
**Bereich:** apps/commerce — PostgreSQL-Datenzugriff

---

## Kontext

Der Commerce Core verwaltet alle transaktionalen Daten des Projekts:

- Produktkatalog: `products`, `product_variants`, `categories`, `product_images`
- Commerce-Flow: `carts`, `checkout_sessions`, `orders`, `order_items`
- Zahlungen: `payments`, `payment_events`

Das Schema ist relational mit FK-Beziehungen, Enum-Status-Machines (`pending_payment → paid → processing → shipped → delivered`) und JSONB-Feldern (`attributes` auf `product_variants`). Die Datenintegrität ist geschäftskritisch — fehlerhafte Preisberechnungen, doppelte Orders oder verlorene Payment-Events sind nicht tolerierbar.

Ziel der ORM-Entscheidung ist ein wartbares, typsicheres Datenzugriffsschicht mit guter Migration-Tooling-Unterstützung für ein kleines bis mittleres Entwicklungsteam.

---

## Entscheidung

**Prisma ORM** für den gesamten PostgreSQL-Datenzugriff in `apps/commerce`.

Kein Kysely, kein raw SQL als Primärlösung, kein Drizzle.

---

## Begründung

**1. Migration-Tooling ist das wichtigste Kriterium — Prisma gewinnt hier deutlich.**

`prisma migrate dev` erzeugt SQL-Migrationsdateien aus dem Schema-Diff, versioniert sie automatisch und tracked den Deployment-Status. `prisma migrate deploy` ist idempotent und CI-sicher. Kysely hat kein eigenes Migration-Tooling (erfordert externe Tools wie `db-migrate` oder manuelles SQL). Drizzle Kit ist neuerer und weniger erprobter. Für ein Schema mit ~10 Tabellen und laufender Weiterentwicklung ist dieses Tooling entscheidend.

**2. Typsicherheit ohne manuelle Typdefinitionen.**

`prisma generate` erzeugt den Prisma Client direkt aus dem Schema. Jede Tabelle, jedes Feld, jede Relation ist sofort typisiert — ohne separate Interface-Definitionen. Bei Kysely müssen Tabellentypen manuell gepflegt oder per Codegen-Tool generiert werden. Für ein Schema das sich in Phase 2 schnell entwickelt, reduziert dies die Reibung erheblich.

**3. Das Domain-Modell ist direkt auf Prisma-Schema-DSL abbildbar.**

- `product_variants.attributes` → `Json` type (Prisma unterstützt JSONB nativ)
- `price_cents` → `Int` (Integer, kein Float — Prisma erzwingt den korrekten Typ)
- Status-Machines → `enum` in Prisma Schema → PostgreSQL-native `ENUM`
- FK-Relationen → Prisma `@relation` mit referentieller Integrität
- `uuid` PKs → `@default(uuid())` in Prisma

**4. Prisma ist das dominierende TypeScript-ORM im Next.js/Node-Ökosystem.**

Dokumentation, Community, Tooling (Prisma Studio für lokale Dateneinsicht) und Integrations-Ressourcen sind im Vergleich umfangreicher. Das reduziert den Onboarding-Aufwand für neue Entwickler.

**5. n8n und Stripe greifen nie direkt auf die Datenbank zu.**

n8n kommuniziert ausschließlich über REST-Webhooks mit dem Commerce API (ADR-001). Stripe sendet Events an `POST /webhooks/stripe`. Kein externer Partner hat direkten DB-Zugriff — damit ist das ORM ausschließlich eine interne Implementierungsdetail-Entscheidung ohne externe Abhängigkeiten.

---

## Konsequenzen

**Bewusst in Kauf genommene Nachteile:**

- **N+1-Risiko bei verschachtelten Includes** — Prisma lädt Relations über separate Queries. Bei Produktlisten mit Varianten und Kategorien ist explizites `include` notwendig. Mitigiert durch sorgfältige Query-Gestaltung pro Endpunkt.
- **Prisma Client Bundle-Size** — der generierte Client ist größer als Kysely oder raw SQL. Kein Problem für einen Node.js-Server, irrelevant für den Storefront (Client nutzt REST, kein Prisma).
- **Prisma-spezifisches Schema-DSL** — kein Standard-SQL. Beim Verlassen von Prisma müssten Schema-Definitionen neu geschrieben werden. Das Risiko ist akzeptierbar, da Prisma weiterentwickelt wird und eine starke Community hat.
- **Keine stored procedures über Prisma** — komplexe DB-seitige Logik (z.B. atomare Stock-Decrements) erfordert `$queryRaw` oder `$executeRaw`. Das ist bekannt und wird pro Fall entschieden.

---

## Migrations-Strategie

```
apps/commerce/
  prisma/
    schema.prisma       ← einzige Schemawahrheit
    migrations/         ← generierte SQL-Dateien, committed
```

- **Lokal:** `prisma migrate dev` — generiert Migration aus Schema-Diff, führt sie aus
- **CI/CD:** `prisma migrate deploy` — führt ausstehende Migrationen idempotent aus
- **Neue Felder:** Schema in `schema.prisma` ändern → `migrate dev` → Commit
- **Breaking Changes:** Additive Migrationen bevorzugen; destructive Migrationen (Column Drop, Rename) explizit dokumentieren

---

## Abgrenzung zur Firebase/Firestore-Schicht

| Daten | System | Zugriffsschicht |
|---|---|---|
| Products, Orders, Payments | PostgreSQL | Prisma Client |
| Leads, Projektanfragen | Firestore | Firebase Admin SDK |
| User Sessions, Auth-Tokens | Firebase Auth | Firebase Admin SDK |
| Datei-Uploads (Anfragen) | Firebase Storage | Firebase Admin SDK |

Firestore und PostgreSQL haben keine gemeinsamen Schreibvorgänge. Es gibt keine Cross-System-Transaktionen. Die Systeme sind vollständig getrennt — Prisma hat keinen Zugriff auf Firestore-Daten, Firebase Admin SDK keinen Zugriff auf PostgreSQL.

---

## Verworfene Alternativen

**Kysely** — typsicherer Query-Builder ohne eigenes Migration-Tooling. Für ein Projekt das primär CRUD-nahe Commerce-Operationen braucht, überwiegt der Aufwand für externes Migrations-Tooling den Vorteil der SQL-Nähe nicht.

**Drizzle ORM** — vielversprechend, aber jüngeres Ökosystem, weniger erprobtes Migration-Tooling für komplexere Schemas. Kann für ein Greenfield-Projekt in 12–18 Monaten die bessere Wahl sein, heute ist Prisma reifer.

**Raw SQL** — maximale Kontrolle, kein Codegen, kein Type Safety ohne Boilerplate. Für ein kleines Team mit einem sich entwickelnden Schema nicht wirtschaftlich.

---

## Betroffene Folgedokumente

- `.claude/skills/postgres-commerce-core/SKILL.md` — "Prisma ORM or raw SQL" wird auf "Prisma" konkretisiert
- `apps/commerce/prisma/schema.prisma` — wird in Phase 2 angelegt
- `docs/product-model.md` — Schema-Entscheidungen (JSONB, Enums) sind Prisma-kompatibel, kein Anpassungsbedarf
