# WSP Commerce OS – Architecture Vision & Product Blueprint
### Phase 2 · Dokument-Version 1.0 · Juni 2026

---

> *"Wir bauen keinen Shop. Wir bauen das Betriebssystem für Commerce."*

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement – Warum WSP Commerce OS existiert](#2-problem-statement)
3. [Zielgruppen](#3-zielgruppen)
4. [Philosophie & Design-Prinzipien](#4-philosophie--design-prinzipien)
5. [Differenzierung](#5-differenzierung)
6. [Langfristige Vision](#6-langfristige-vision)
7. [Plattform-Architektur – Überblick](#7-plattform-architektur--überblick)
8. [Core Layer](#8-core-layer)
9. [Product DNA – Das Herzstück](#9-product-dna--das-herzstück)
10. [Commerce Engines](#10-commerce-engines)
11. [Intelligence Layer](#11-intelligence-layer)
12. [Creative Layer](#12-creative-layer)
13. [Content Layer](#13-content-layer)
14. [Automation Layer](#14-automation-layer)
15. [Integration Layer](#15-integration-layer)
16. [Platform Layer](#16-platform-layer)
17. [AI-First Architektur](#17-ai-first-architektur)
18. [Zukünftige Engines & Module](#18-zukünftige-engines--module)
19. [Roadmap nach Plattform-Reife](#19-roadmap-nach-plattform-reife)
20. [Innovation Lab](#20-innovation-lab)
21. [Architektur-Entscheidungen (ADRs)](#21-architektur-entscheidungen-adrs)

---

## 1. Executive Summary

WSP Commerce OS ist eine **AI-native Commerce-Plattform**, die den vollständigen Lebenszyklus eines Produktes verwaltet — von der Produktidee über Entwicklung, Content, SEO, Marketing, Verkauf und Analyse bis hin zur kontinuierlichen KI-gestützten Optimierung.

Die Plattform ist kein Webshop-System. Sie ist ein **Commerce-Betriebssystem** — eine Infrastruktur, auf der Commerce-Anwendungen betrieben, automatisiert und durch KI-Agenten gesteuert werden können.

Das Fundament ist die **Product DNA**: ein universelles Datenmodell, das als einzige Wahrheitsquelle für alle Produktrepräsentationen dient — physische Produkte, digitale Güter, Print-Produkte, Marketplace-Listings, SEO-Seiten, Social Posts, Videos und KI-generierter Content.

Alle Plattformmodule greifen auf die Product DNA zu und leiten daraus ihre jeweiligen Outputs ab. Intelligenz ist kein Feature — sie ist eine erste Klasse der Architektur.

---

## 2. Problem Statement

### Das Kernproblem bestehender Commerce-Systeme

Klassische Webshop-Systeme wie Shopify, Shopware oder WooCommerce sind **produkt-verwaltende Systeme**. Sie speichern Produkte, verarbeiten Bestellungen und zeigen Seiten an. Das war ausreichend für die Commerce-Welt von 2010.

Die Commerce-Welt von 2026 stellt andere Anforderungen:

**Problem 1 – Kanalexplosion ohne Konsistenz**
Ein Produkt muss heute auf dutzenden Kanälen präsent sein: Shop, Amazon, eBay, Kleinanzeigen, Instagram, TikTok, Pinterest, Google Shopping, Printmedien. Jeder Kanal verlangt andere Formate, andere Texte, andere Bilder, andere Preisstrategien. Manuelle Pflege ist nicht skalierbar. Bestehende Systeme haben keine Antwort auf dieses Problem.

**Problem 2 – Content als Bottleneck**
Produkttexte, SEO-Inhalte, Social Posts, Marketplace-Listings — all das kostet Zeit und Geld. Gleichzeitig ist es der wichtigste Wettbewerbsvorteil. Systeme, die KI nicht als ersten Bürger behandeln, zwingen Händler dazu, manuelle Content-Arbeit als Daueraufgabe zu betreiben.

**Problem 3 – Blind gegenüber Marktintelligenz**
Händler wissen nicht in Echtzeit, was Wettbewerber tun, welche Produkte gerade gefragt sind, wo Preisopportunitäten liegen. Klassische Systeme bieten keinen Intelligence-Layer — bestenfalls einfache Analytics.

**Problem 4 – Statische Produktdaten**
Ein Produkt ist in bestehenden Systemen eine Tabelle mit Feldern. Kein System denkt in *semantischen Produkteinheiten* — in dem, was ein Produkt *bedeutet*, *leistet* und *kommuniziert*. Die Product DNA löst genau das.

**Problem 5 – Automation als Nachgedanke**
Workflows, Automatisierungen und Integrationen werden über externe Tools (Zapier, n8n, make) gebaut, die nicht tief in das Commerce-System integriert sind. Das erzeugt Brüche, Latenz und Komplexität.

**Problem 6 – KI als Feature statt als Fundament**
Bestehende Systeme integrieren KI als Plugin. "KI-Produktbeschreibungen generieren" ist ein Button. Das ist nicht AI-native — das ist AI-superficial. Eine AI-native Plattform denkt in Agenten, Werkzeugen, Kontexten und autonomen Prozessen.

### Die Antwort von WSP Commerce OS

WSP Commerce OS behandelt diese sechs Probleme als Designanforderungen, nicht als Erweiterungen. Die Plattform ist von Grund auf für:

- **Multi-Channel als Default** — nicht als Integration
- **AI als Architekturelement** — nicht als Plugin
- **Intelligence als kontinuierlichen Prozess** — nicht als Report
- **Content als automatisierten Workflow** — nicht als manuelle Arbeit
- **Product DNA als semantische Wahrheitsquelle** — nicht als Datenbank-Tabelle
- **Automation als Plattform-Kern** — nicht als externes Tool

---

## 3. Zielgruppen

### Primäre Zielgruppe: Der digitale Händler mit Wachstumsambitionen

Charakteristik:
- 100–10.000 SKUs
- Verkauf auf 2–5 Kanälen
- Wachstumsdruck: mehr Kanäle, mehr Content, mehr Automation
- Kein Enterprise-Budget für SAP oder Salesforce Commerce
- Technisch versiert, aber kein Engineering-Team

Bedarf:
- Systemkonsistenz über alle Kanäle
- Automatisierung der Content-Erstellung
- Marktintelligenz ohne BI-Team
- Skalierung ohne Personalkosten

### Sekundäre Zielgruppe: Der Nischen-Händler mit KI-Hebel

Charakteristik:
- 50–500 SKUs, oft kuratiertes Sortiment
- Tiefes Produktwissen, wenig technische Ressourcen
- Sucht Wettbewerbsvorteil durch besseren Content und schnelleres Reagieren

Bedarf:
- Produktentwicklung aus Marktdaten (Market Intelligence → Product DNA)
- Automatisierte Listings und SEO
- Preisoptimierung in Echtzeit

### Tertiäre Zielgruppe: Der Commerce-Entwickler / Agentur

Charakteristik:
- Baut Commerce-Lösungen für Kunden
- Sucht eine Platform, kein Produkt
- Wertlegt auf API-First, Plugin-System, SDK

Bedarf:
- Erweiterbare Architektur
- Developer API und SDK
- White-Label-Fähigkeit

### Zukünftige Zielgruppe: Der AI-Commerce-Operator

Charakteristik:
- Betreibt weitgehend autonome Commerce-Setups
- Agenten übernehmen Sourcing, Listing, Pricing, Fulfillment
- Mensch als Supervisor, nicht als Operator

Bedarf:
- Vollständiger Agent Runtime
- Human-in-the-Loop Workflows
- Audit-Logs und Kontrollmechanismen

---

## 4. Philosophie & Design-Prinzipien

### 4.1 Product DNA First

Jede Aktion in der Plattform beginnt oder endet bei der Product DNA. Kein Modul pflegt eigene Produktdaten — alle beziehen sich auf die DNA. Das ist das fundamentale Prinzip der Architektur.

### 4.2 Intelligence Before Action

Bevor die Plattform eine Entscheidung trifft (Preis anpassen, Listing erstellen, Kampagne starten), konsultiert sie den Intelligence Layer. Commerce ohne Kontext ist Blindflug.

### 4.3 Event-Driven by Default

Alle Module kommunizieren über den Event Bus. Direkte Kopplungen existieren nur im Core Layer. Das erlaubt Erweiterbarkeit ohne Umbau bestehender Systeme.

### 4.4 Human-in-the-Loop, Not Human-in-the-Way

Die Plattform maximiert Autonomie — aber Entscheidungen mit hohem Stakes (Preisänderungen >20%, neue Produktveröffentlichungen, Marketingbudgets) durchlaufen immer einen menschlichen Freigabeprozess. Die KI schlägt vor, der Mensch entscheidet.

### 4.5 Composability über Monolith

Jede Engine ist in sich geschlossen und kann unabhängig verwendet werden. Ein Händler kann die SEO Engine nutzen, ohne die Creative Engine zu aktivieren. Die Plattform ist eine Suite von Engines, nicht ein Funktionsblock.

### 4.6 Explainability als Pflicht

Jede KI-Entscheidung muss erklärbar sein. Warum wurde dieser Preis vorgeschlagen? Warum wurde dieses Produkt als Opportunity eingestuft? Das gilt für Interne Prozesse und für den Endnutzer.

### 4.7 API-First, UI Second

Alle Funktionen sind zuerst über die API verfügbar. Die Admin-UI ist ein Konsument der API — kein privilegierter Zugang. Das ermöglicht vollständige Automatisierung.

---

## 5. Differenzierung

### 5.1 vs. Shopify

| Dimension | Shopify | WSP Commerce OS |
|---|---|---|
| Architektur | Hosted Monolith | Modular, self-hosted / cloud |
| AI | App-Store-Plugins | First-class Architekturelement |
| Product Model | Einfache Produkt-Tabelle | Product DNA (semantisch) |
| Intelligence | Drittanbieter-Apps | Eingebetteter Intelligence Layer |
| Multi-Channel | Channels-Feature | Architecturally multi-channel |
| Erweiterbarkeit | App Store (geschlossen) | Plugin System + SDK (offen) |
| Preisgestaltung | % des Umsatzes | Plattform-Lizenz |
| Content | Manuell oder App | Automatisiert via DNA + AI |
| Zielgruppe | Masse (Consumer bis Mid-Market) | Mid-Market mit Intelligence-Bedarf |

**Kernunterschied:** Shopify verkauft einen Shop. WSP Commerce OS verkauft ein Commerce-Betriebssystem.

### 5.2 vs. Shopware

| Dimension | Shopware | WSP Commerce OS |
|---|---|---|
| Architektur | PHP Monolith (6.x headless) | TypeScript, modulare Engines |
| AI | CopilotOne (oberflächlich) | AI Runtime als Kern |
| Content | Shopping Experiences (CMS) | Content Layer via Product DNA |
| Intelligence | Keine | Intelligence Layer als Pflicht |
| Developer Experience | PHP Ecosystem | TypeScript, moderne Toolchain |
| Learning Curve | Hoch (Shopware-spezifisch) | Standard Next.js + REST/GraphQL |

### 5.3 vs. WooCommerce / PrestaShop

Diese Systeme sind fundamentale Ausschlüsse: WordPress-Dependency, monolithische Architektur, keine AI-Readiness, keine Intelligence-Schicht. WSP Commerce OS teilt mit ihnen keinen Architekturansatz.

### 5.4 Unser einzigartiger Positionierungsraum

WSP Commerce OS besetzt den Raum zwischen "einfachem Shop-System" und "Enterprise Commerce Suite" — und ist dabei das einzige System, das:

1. **Product DNA** als universelles semantisches Modell nutzt
2. **Intelligence** als Architekturschicht behandelt, nicht als Feature
3. **AI Agents** als first-class Runtime-Konzept implementiert
4. **Multi-Channel** als Default, nicht als Add-on denkt
5. Vollständig auf **TypeScript/Next.js** aufgebaut und damit im modernen Web-Ecosystem heimisch ist

---

## 6. Langfristige Vision

### Vision 2026–2028: Autonomous Commerce Platform

Ein Händler konfiguriert sein Produktportfolio, seine Ziele und seine Qualitätsschwellen. Die Plattform übernimmt danach autonom:

- Neue Marktopportunitäten identifizieren (Marketplace Intelligence)
- Product DNA aus Rohdaten generieren (AI Product Development)
- Content auf allen Kanälen veröffentlichen (Content Engine)
- Preise in Echtzeit optimieren (Pricing Intelligence)
- Kampagnen starten und optimieren (Marketing Engine)
- Bestellungen abwickeln (Commerce Engines)
- Performance analysieren und Strategie anpassen (Analytics + AI Agents)

Der Mensch ist Supervisor. Die KI ist Operator.

### Vision 2028–2031: Commerce Intelligence Network

Mehrere WSP Commerce OS Instanzen bilden ein Netzwerk, das anonymisierte Intelligence-Daten teilt:

- Globale Trendfrüherkennung
- Kollektive Preisdaten
- Geteilte Supplier-Intelligence

Vergleichbar mit dem Netzwerk-Effekt von Cloudflare — jede neue Instanz macht das Netzwerk intelligenter.

### Vision 2031+: Commerce Operating System as a Service

WSP Commerce OS wird zum Fundament, auf dem Dritte eigene Commerce-Anwendungen bauen. Vergleichbar mit AWS für Cloud-Infrastruktur oder Salesforce für CRM — aber für das gesamte Commerce-Universum.

---

## 7. Plattform-Architektur – Überblick

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PLATFORM LAYER                              │
│               API · Auth · Permissions · SDK · Plugin System         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                         AUTOMATION LAYER                             │
│         Workflow Engine · Event Bus · Scheduler · AI Agent Runtime   │
└──────┬─────────────┬──────────────┬───────────────┬─────────────────┘
       │             │              │               │
┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐ ┌──────▼──────────────┐
│ INTELLIGENCE│ │ CREATIVE │ │  CONTENT   │ │    INTEGRATION      │
│    LAYER    │ │  LAYER   │ │   LAYER    │ │       LAYER         │
│             │ │          │ │            │ │                     │
│Revenue Intel│ │Design    │ │Listing     │ │Supplier Adapter     │
│Market Intel │ │AI Image  │ │Factory     │ │Marketplace Adapter  │
│Trend Intel  │ │Mockup    │ │SEO Engine  │ │Payment Adapter      │
│Pricing Intel│ │Video     │ │Blog Engine │ │Shipping Adapter     │
│Recommend.   │ │Asset Mgmt│ │Social      │ │AI Provider Adapter  │
│Analytics    │ │          │ │UGC Factory │ │                     │
└──────┬──────┘ └────┬─────┘ └─────┬──────┘ └──────┬──────────────┘
       │             │              │               │
┌──────▼─────────────▼──────────────▼───────────────▼─────────────────┐
│                        COMMERCE ENGINES                               │
│   Physical · Print · Digital · Marketplace · Subscription · B2B      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                          CORE LAYER                                   │
│                  ┌─────────────────────────┐                          │
│                  │       PRODUCT DNA        │  ← Zentrale Wahrheit    │
│                  └──────────┬──────────────┘                          │
│                             │                                         │
│   Catalog · Customers · Orders · Pricing · Inventory · Variants       │
└──────────────────────────────────────────────────────────────────────┘
```

### Architekturelles Grundprinzip: Layered Event Architecture

Alle Layer kommunizieren bidirektional über den **Event Bus** im Automation Layer. Direktaufrufe zwischen Engines sind verboten — ausgenommen der Core Layer, der direkt abgefragt wird. Das erzeugt:

- **Loose Coupling**: Engines kennen sich nicht gegenseitig
- **Observability**: Alle Events sind inspizierbar und auditierbar
- **Composability**: Neue Engines können an beliebige Events hören
- **Resilience**: Ausfall einer Engine blockiert keine andere

---

## 8. Core Layer

Der Core Layer ist das unveränderliche Fundament. Er verändert sich selten und wird nie durch externe Events überschrieben.

### 8.1 Product DNA

→ Vollständige Spezifikation in Abschnitt 9.

### 8.2 Catalog

**Zweck:** Verwaltung aller Produkte, Varianten, Kategorien und Taxonomien.

**Verantwortlichkeiten:**
- Produkt-CRUD auf Basis der Product DNA
- Varianten-Management (Größen, Farben, Konfigurationen)
- Kategorie- und Tag-Taxonomie
- Produkt-Relationen (Ähnlich, Bundle, Kompatibel, Zubehör)
- Versionierung von Produktständen
- Publikationsstatus pro Kanal

**Eingaben:** Product DNA Updates, Admin-Aktionen, AI-Agent-Outputs

**Ausgaben:** Produkt-Events (ProductCreated, ProductUpdated, ProductPublished), Produkt-API-Responses

**Abhängigkeiten:** Product DNA (Kern), Pricing (Preisanbindung), Inventory (Verfügbarkeit)

**Schnittstellen:**
- `GET /api/catalog/products` — Produktliste mit Filterung
- `GET /api/catalog/products/:id` — Einzelprodukt mit DNA
- `POST /api/catalog/products` — Neues Produkt aus DNA
- Events: `catalog.product.*`, `catalog.category.*`

**Erweiterbarkeit:** Custom Attribute Schema per Kategorie; Plugin-Hooks für Pre/Post CRUD.

---

### 8.3 Customers

**Zweck:** Kundenstammdaten, Segmentierung und Kundenhistorie.

**Verantwortlichkeiten:**
- Kundenprofil (Kontakt, Adressen, Präferenzen)
- Bestellhistorie und Customer Lifetime Value (CLV)
- Segmentierung (manuell + AI-gestützt)
- Consent-Management (DSGVO)
- Anonymisierung und Datenlöschung

**Eingaben:** Registrierungen, Bestellungen, Verhaltensdaten, CRM-Importe

**Ausgaben:** Kunden-Events, Segmente, CLV-Berechnungen

**Abhängigkeiten:** Orders (Bestellhistorie), Intelligence Layer (Segmentierungs-AI)

**Schnittstellen:**
- `GET /api/customers/:id` — Kundenprofil
- `GET /api/customers/:id/timeline` — Vollständige Kundenhistorie
- Events: `customer.created`, `customer.segment.changed`, `customer.clv.updated`

---

### 8.4 Orders

**Zweck:** Vollständiger Bestelllebenszyklus vom Warenkorb bis zur Abwicklung.

**Verantwortlichkeiten:**
- Warenkorb-Management
- Checkout-Flow (multi-step, headless)
- Bestellstatus-Verwaltung
- Rechnungserstellung
- Rückgaben und Erstattungen
- Order-Events für alle Downstream-Module

**Eingaben:** Kunden-Aktionen, Zahlungsbestätigungen, Fulfillment-Updates

**Ausgaben:** Order-Events (OrderPlaced, OrderShipped, OrderRefunded), Fulfillment-Anfragen

**Abhängigkeiten:** Customers, Pricing, Inventory, Payment Adapter, Shipping Adapter

**Schnittstellen:**
- `POST /api/orders` — Bestellung anlegen
- `PATCH /api/orders/:id/status` — Status-Update
- Events: `order.placed`, `order.paid`, `order.shipped`, `order.completed`, `order.refunded`

---

### 8.5 Pricing

**Zweck:** Verwaltung aller Preisdimensionen und Pricing-Strategien.

**Verantwortlichkeiten:**
- Basispreise pro Produkt / Variante
- Preisstaffeln (Mengenrabatte, Kundensegment)
- Zeitbasierte Aktionspreise
- Kanal-spezifische Preise (Shop ≠ Marketplace ≠ B2B)
- Margenkalkulation und Mindestmargen
- Wechselkurs-Management

**Eingaben:** Admin-Konfiguration, Pricing-Intelligence-Empfehlungen, Regeln

**Ausgaben:** Effective Price pro Kontext, Pricing-Events

**Abhängigkeiten:** Intelligence Layer → Pricing Intelligence, Customer Segments

**Schnittstellen:**
- `GET /api/pricing/:productId?channel=shop&customerId=...` — Effektiver Preis
- `POST /api/pricing/rules` — Neue Preisregel
- Events: `pricing.updated`, `pricing.rule.triggered`

**Erweiterbarkeit:** Custom Pricing Strategies als Plugin; AI Pricing Strategy als Intelligence-Output.

---

### 8.6 Inventory

**Zweck:** Bestands- und Lagerverwaltung über alle Fulfillment-Quellen.

**Verantwortlichkeiten:**
- Bestandsmengen pro SKU und Lager
- Reservierungen (Warenkorb, offene Bestellungen)
- Low-Stock-Alerts
- Multi-Warehouse-Support
- Dropshipping-Integration (Supplier Adapter)
- Bestandsprognose (Intelligence)

**Eingaben:** Bestellungen (Reservierungen), Lieferanten-Updates, physische Inventuren

**Ausgaben:** Inventory-Events, Verfügbarkeitsstatuses für alle Kanäle

**Abhängigkeiten:** Orders (Reservierungen), Supplier Adapter (Dropshipping), Intelligence (Prognose)

**Schnittstellen:**
- `GET /api/inventory/:sku` — Aktueller Bestand
- `POST /api/inventory/:sku/reserve` — Bestand reservieren
- Events: `inventory.low`, `inventory.out`, `inventory.replenishment.needed`

---

## 9. Product DNA – Das Herzstück

Die Product DNA ist das semantische Kernobjekt der gesamten Plattform. Sie ist nicht eine Datenbank-Tabelle — sie ist ein **lebendiges Dokument** über ein Produkt.

### 9.1 Was ist Product DNA?

Product DNA beschreibt ein Produkt in seiner vollständigen Tiefe:

- **Was es ist** (Identität, Kategorie, Taxonomie)
- **Was es leistet** (Funktionen, Vorteile, Einsatzbereiche)
- **Für wen es ist** (Zielgruppen, Use Cases, Personas)
- **Was es kosten soll** (Preisbasis, Marge, Positionierung)
- **Wie es aussieht** (Bildkonzept, Designrichtung, Stil)
- **Was darüber gesagt werden soll** (Tonalität, Keywords, Messaging)
- **Wo es erscheinen soll** (Kanäle, Marktplätze, Formate)
- **Was es mit anderen Produkten teilt** (Relationen, Kompatibilitäten)
- **Was es von Wettbewerbern unterscheidet** (Differenzierung, USPs)

### 9.2 DNA-Struktur

```
ProductDNA {
  // ─── Identität ───────────────────────────────────
  id:             UUID
  version:        Semver          // 1.3.2 – jede Änderung versioniert
  status:         draft | review | approved | deprecated

  // ─── Klassifikation ──────────────────────────────
  category:       CategoryRef     // Hierarchische Kategorie
  subcategory:    CategoryRef?
  tags:           Tag[]
  attributes:     AttributeMap    // Schema-freie technische Daten

  // ─── Semantische Beschreibung ─────────────────────
  identity {
    name:         LocalizedString
    shortName:    LocalizedString  // Für SEO-Slugs, Social
    description:  LocalizedString  // Mastertext – Quelle für alle Ableitungen
    shortDescription: LocalizedString
    bulletPoints: LocalizedString[] // Kernargumente
    technicalData: TechDataItem[]
    useCases:     UseCase[]        // Wer nutzt es wie?
    targetAudiences: Audience[]
  }

  // ─── Markenpositionierung ─────────────────────────
  positioning {
    valueProposition: LocalizedString
    differentiators:  string[]     // USPs gegenüber Wettbewerb
    toneOfVoice:      ToneProfile  // sachlich | emotional | premium | etc.
    pricePositioning: "budget" | "mid" | "premium" | "luxury"
    competitors:      CompetitorRef[]
  }

  // ─── Physische Eigenschaften ─────────────────────
  physical? {
    weight_g:     number?
    dimensions_mm: { l: number; w: number; h: number }?
    material:     string?
    shippingClass: "small_parcel" | "bulky" | "freight" | "digital"
    hazardous:    boolean
    originCountry: ISO3166?
    hs_code:      string?           // Zolltarifnummer
  }

  // ─── Digitale Eigenschaften ──────────────────────
  digital? {
    format:       "pdf" | "video" | "software" | "license" | "course"
    deliveryMethod: "download" | "stream" | "api_key" | "email"
    licenseType:  "single" | "multi" | "subscription" | "commercial"
    drmProtected: boolean
  }

  // ─── Pricing Foundation ──────────────────────────
  pricing {
    costBasis_cents:   number?     // EK in Cent
    targetMarginPct:   number      // Ziel-Marge %
    minimumPriceCents: number?     // Absolutes Minimum
    pricePoint:        number?     // Aktueller Listenpreis
    pricingStrategy:   "cost_plus" | "market_based" | "value_based" | "dynamic"
    channelOverrides:  ChannelPriceMap  // pro Kanal abweichend
  }

  // ─── SEO & Content-Strategie ─────────────────────
  seo {
    primaryKeyword:   string
    secondaryKeywords: string[]
    searchIntent:     "informational" | "commercial" | "transactional"
    metaTitle:        LocalizedString
    metaDescription:  LocalizedString
    schemaType:       "Product" | "SoftwareApplication" | "Course" | ...
    seoScore:         number?      // Computed – nicht manuell
  }

  // ─── Creative Direction ───────────────────────────
  creative {
    imageStyle:     "product_shot" | "lifestyle" | "infographic" | "mixed"
    backgroundType: "white" | "contextual" | "brand"
    colorPalette:   HexColor[]
    brandAssets:    AssetRef[]     // Logos, Watermarks
    videoRequired:  boolean
    imagePrompts:   string[]       // AI Image Prompts – direkt aus DNA ableitbar
  }

  // ─── Channel-Konfiguration ───────────────────────
  channels {
    shop:         ChannelConfig
    amazon:       MarketplaceConfig?
    ebay:         MarketplaceConfig?
    kleinanzeigen: MarketplaceConfig?
    google_shopping: GoogleConfig?
    print:        PrintConfig?
    digital_download: DigitalConfig?
  }

  // ─── Relationen ──────────────────────────────────
  relations {
    accessories:    ProductRef[]   // Passendes Zubehör
    replacements:   ProductRef[]   // Ersatzprodukte
    bundles:        BundleRef[]    // In welchen Bundles enthalten?
    compatibleWith: ProductRef[]   // Technisch kompatibel
    upgradeTo:      ProductRef[]   // Upsell
  }

  // ─── AI Context ──────────────────────────────────
  aiContext {
    trainingHints:  string[]       // Was KI beachten soll
    negativeHints:  string[]       // Was KI vermeiden soll
    customPromptOverrides: Record<string, string>  // Pro-Modul Override
    lastAIReview:   Timestamp?
    aiSuggestions:  AISuggestion[] // Offene KI-Empfehlungen
  }

  // ─── Metadata ────────────────────────────────────
  createdAt:    Timestamp
  updatedAt:    Timestamp
  createdBy:    UserRef | AgentRef
  changelog:    ChangelogEntry[]
}
```

### 9.3 Wie Module aus der DNA ableiten

```
                         ┌──────────────────┐
                         │   Product DNA    │
                         └────────┬─────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
   ┌──────▼──────┐        ┌───────▼───────┐      ┌────────▼────────┐
   │  SEO Engine │        │ Listing       │      │  AI Image       │
   │             │        │ Factory       │      │  Factory        │
   │ metaTitle   │        │               │      │                 │
   │ slug        │        │ eBay Listing  │      │ identity.name   │
   │ schema.org  │  ←DNA  │ Amazon ASIN   │ ←DNA │ creative.prompts│
   │ content     │        │ KA Anzeige    │      │ creative.style  │
   └─────────────┘        └───────────────┘      └─────────────────┘

   ┌──────────────┐       ┌───────────────┐      ┌─────────────────┐
   │ Social       │       │ Print Engine  │      │ Video Factory   │
   │ Content      │       │               │      │                 │
   │ Factory      │       │ Katalogseite  │      │ Product Video   │
   │              │ ←DNA  │ Flyer         │ ←DNA │ Social Clip     │
   │ Instagram    │       │ Etiketten     │      │ Tutorial Vorlage│
   │ TikTok Copy  │       │               │      │                 │
   └──────────────┘       └───────────────┘      └─────────────────┘
```

### 9.4 DNA Lifecycle

```
Idea → Draft DNA → Review → Approved → Published → Optimizing → Deprecated
         ↑              ↓
    AI Enrichment    Human Approval
    (Marketplace Intel, Trend Intel)
```

**AI-gestützte DNA-Entstehung:**
Der Market Intelligence Agent entdeckt eine Opportunity → schlägt DNA-Felder vor → Human reviewt → DNA wird approved → Content Engine startet automatisch.

---

## 10. Commerce Engines

### 10.1 Physical Commerce Engine

**Zweck:** Abwicklung des klassischen Warenhandels mit physischen Produkten.

**Verantwortlichkeiten:**
- Shop-Frontend (Headless, API-driven)
- Produktseiten aus DNA + Catalog
- Checkout und Zahlungsabwicklung
- Fulfillment-Anforderungen an Shipping Adapter
- Returns Management
- Tracking und Lieferstatus

**Eingaben:**
- Product DNA (Produktdaten)
- Inventory (Verfügbarkeit)
- Pricing (Effektiver Preis)
- Customer (Kontextdaten)

**Ausgaben:**
- Shop-API-Responses (headless)
- Order Events → Orders Core
- Fulfillment Requests → Shipping Adapter

**Schnittstellen:**
- `GET /api/shop/products` — Produktliste (gefiltert, paginiert)
- `GET /api/shop/products/:slug` — Produktdetailseite
- `POST /api/shop/cart` — Warenkorb
- `POST /api/shop/checkout` — Checkout initiieren

**Erweiterbarkeit:** Custom Checkout Steps, Custom Payment Flows via Payment Adapter.

---

### 10.2 Print Commerce Engine

**Zweck:** Print-on-Demand und physische Druckprodukte aus der Product DNA.

**Verantwortlichkeiten:**
- Druckprodukt-Konfiguration aus DNA Creative Direction
- Verbindung zu POD-Anbietern (Printful, Printify, lokale Druckereien)
- Templating für Print-Assets (Katalog, Flyer, Etiketten, Verpackungen)
- Qualitätsprüfung von Druckdateien
- Produktionsauftrags-Management

**Eingaben:**
- Product DNA (Creative Direction, Positionierung)
- Design Assets aus Creative Layer
- Bestellungen aus Orders Core

**Ausgaben:**
- Druckaufträge an Supplier
- Print-Assets für Marketing
- Print-spezifische Fulfillment Events

**Abhängigkeiten:** Creative Layer (Mockup Factory, Design Studio), Supplier Adapter

**Erweiterbarkeit:** Neue POD-Anbieter via Supplier Adapter Plugin.

---

### 10.3 Digital Commerce Engine

**Zweck:** Verwaltung und Verkauf digitaler Produkte.

**Verantwortlichkeiten:**
- Digitale Produkt-Delivery (Downloads, Streams, API-Keys)
- License Management (Einzel, Multi, Subscription)
- DRM-Integration (optional)
- Digitaler Fulfillment-Workflow (sofort nach Zahlung)
- Zugangsverwaltung für kuratierten Content

**Eingaben:**
- Product DNA (Digital Properties)
- Orders Core (Kaufbestätigung)
- Customer (Zugangsberechtigungen)

**Ausgaben:**
- Download-Links (zeitbeschränkt, signiert)
- License Keys
- Access Tokens für geschützte Inhalte

**Schnittstellen:**
- `GET /api/digital/licenses/:customerId` — Alle Lizenzen eines Kunden
- `POST /api/digital/fulfill/:orderId` — Digitale Lieferung anstoßen
- Events: `digital.license.granted`, `digital.download.started`

---

### 10.4 Marketplace Commerce Engine

**Zweck:** Bidirektionale Integration mit externen Marktplätzen.

**Verantwortlichkeiten:**
- Listing-Synchronisation (Anlegen, Aktualisieren, Deaktivieren)
- Preis-Synchronisation pro Kanal
- Bestands-Synchronisation (Inventory ↔ Marktplatz)
- Bestell-Import von Marktplätzen → Orders Core
- Performance-Tracking pro Kanal
- Marketplace-spezifische Richtlinien einhalten

**Eingaben:**
- Product DNA (Kanal-spezifische Konfiguration)
- Listing Factory Output (Texte, Bilder)
- Pricing Engine (Kanal-Preise)
- Inventory (Verfügbarkeit)

**Ausgaben:**
- Marketplace-Listings (eBay, Amazon, Kleinanzeigen, etc.)
- Kanal-Performance-Events
- Importierte Bestellungen → Orders Core

**Abhängigkeiten:** Marketplace Adapter, Listing Factory, Pricing Engine

**Schnittstellen:**
- `POST /api/marketplace/listings/sync` — Listings synchronisieren
- `GET /api/marketplace/listings/:channel` — Aktive Listings pro Kanal
- Events: `marketplace.listing.published`, `marketplace.order.received`

---

## 11. Intelligence Layer

Der Intelligence Layer ist die analytische und prognostische Schicht der Plattform. Er beobachtet kontinuierlich — intern und extern — und leitet daraus Empfehlungen und automatische Aktionen ab.

### 11.1 Revenue Intelligence

**Zweck:** Vollständiges Bild der Einnahmenentwicklung mit Kausalanalyse.

**Verantwortlichkeiten:**
- Revenue-Dashboard (real-time, historisch)
- Umsatz-Attribution pro Kanal, Produkt, Kampagne
- Margin-Analyse pro Produkt und Kategorie
- Cohort-Analyse (Wiederkäufer, CLV-Entwicklung)
- Anomalie-Erkennung (plötzlicher Umsatzrückgang)
- Revenue-Forecasting (30/60/90 Tage)

**Eingaben:**
- Orders Events
- Pricing Events
- Marketing-Performance-Daten
- Historische Daten

**Ausgaben:**
- Revenue Reports
- Anomalie-Alerts
- Forecast-Daten für andere Engines
- Events: `revenue.anomaly.detected`, `revenue.forecast.updated`

**AI-Komponenten:**
- Anomalie-Detektion via statistisches Modell + LLM-Erklärung
- Forecasting via Time-Series-Modell
- Kausalanalyse: "Warum ist der Umsatz gestiegen?" — natürlichsprachliche Antworten

---

### 11.2 Marketplace Intelligence

**Zweck:** Kontinuierliche Beobachtung des Sekundärmarktes auf Opportunitäten.

**Verantwortlichkeiten:**
- Kleinanzeigen/eBay Listing-Scraping (täglich)
- Scoring von Listings (Deal Score, Risikoabschätzung)
- Opportunity Detection (günstige Ankäufe, Weiterverkaufspotenzial)
- Competitor Pricing Tracking
- Market Liquidity Assessment (wie schnell verkaufen sich Produkte?)
- Daily Report mit priorisierten Opportunitäten

**Eingaben:**
- Externe Marktplatz-Daten (Scraper, RSS, APIs)
- Market Reference Prices (Neupreise als Anker)
- Product DNA (welche Kategorien sind relevant?)

**Ausgaben:**
- Scorierte Listings in der Datenbank
- Daily Opportunity Report
- Product Draft Vorschläge aus gefundenen Listings
- Events: `intelligence.opportunity.found`, `intelligence.price.alert`

**AI-Komponenten:**
- Deal Analyzer (GPT-4.1) — Deal Score, Risk, SEO-Potential
- Knowledge Extractor — Strukturierte Daten aus Freitext
- Product Draft Generator — DNA-Entwurf aus Listing

**Aktuelle Implementierung:** ✅ Vollständig in Phase 1 umgesetzt (marketDealAnalyzer, marketOpportunityAgent, marketKnowledgeExtractor)

---

### 11.3 Trend Intelligence

**Zweck:** Frühzeitige Erkennung von Markttrends, bevor sie Mainstream werden.

**Verantwortlichkeiten:**
- Google Trends Monitoring (API-basiert)
- Social Media Signal Aggregation
- Suchanfragen-Trend-Analyse
- Keyword-Volumen-Entwicklung
- Trend-to-Product Empfehlungen

**Eingaben:**
- Google Trends API
- Social Media APIs (optional)
- SEO-Keyword-Daten
- Interner Suchbegriff-Log

**Ausgaben:**
- Trend Reports
- Keyword-Empfehlungen für SEO Engine
- Product DNA Anreicherungsvorschläge
- Events: `trend.spike.detected`, `trend.keyword.rising`

---

### 11.4 Pricing Intelligence

**Zweck:** Datenbasierte Preisempfehlungen und dynamische Preisanpassung.

**Verantwortlichkeiten:**
- Wettbewerber-Preismonitoring (Marktplätze + Shop-Scraping)
- Margin-Optimierungsvorschläge
- Preiselastizitäts-Modellierung
- Automatische Preisregeln (Floor, Ceiling, Competitive)
- A/B-Testing von Preispunkten

**Eingaben:**
- Market Reference Prices
- Competitor Pricing Data
- Eigene Verkaufsdaten (Conversion Rate pro Preis)
- Product DNA Pricing Section

**Ausgaben:**
- Preisempfehlungen (mit Begründung)
- Automatische Pricing-Trigger → Pricing Core
- Events: `pricing.recommendation.ready`, `pricing.auto_adjust.triggered`

**Freigabeprozess:** Automatische Anpassungen nur innerhalb definierter Bounds. Außerhalb → Human Approval Required.

---

### 11.5 Recommendation Engine

**Zweck:** Kontextuelle Produktempfehlungen für Kunden und interne Prozesse.

**Verantwortlichkeiten:**
- Cross-Sell Empfehlungen (Passend zu diesem Produkt)
- Upsell Empfehlungen (Überleg das Premium-Modell)
- Personalisierte Startseite / Kategorienseite
- E-Mail-Empfehlungen (post-purchase, abandoned cart)
- Interne Bundle-Empfehlungen (welche Produkte kombinieren sich gut?)

**Modelle:**
- Collaborative Filtering (Kunden mit ähnlichem Verhalten)
- Content-Based Filtering (ähnliche Product DNA Attribute)
- Hybrid (kombiniert + LLM für Kontextbegründung)

**Eingaben:**
- Kunden-Verhaltensdaten (Clicks, Views, Käufe)
- Product DNA (Attribute, Relationen)
- Orders History

**Ausgaben:**
- Ranked Product Lists pro Kontext
- Bundle-Vorschläge
- Events: `recommendation.ready`

---

### 11.6 Analytics Engine

**Zweck:** Plattform-weite Analyse-Infrastruktur und Reporting.

**Verantwortlichkeiten:**
- Event-Ingestion von allen Plattform-Events
- KPI-Dashboard (Sessions, Conversion, AOV, CLV, Margin)
- Custom Report Builder
- Funnel-Analyse
- Attribution-Modellierung
- Export (CSV, API, Webhook)

**Eingaben:** Alle Plattform-Events via Event Bus

**Ausgaben:** Reports, Dashboards, Alerts, API-Responses

**Architektur-Hinweis:** Die Analytics Engine ist ein Read-Heavy System. Für Produktionsvolumen empfiehlt sich eine separate Read-Datenbank (TimescaleDB oder ClickHouse) neben der operativen PostgreSQL.

---

## 12. Creative Layer

Der Creative Layer ist die Medienproduktion der Plattform. Er empfängt Aufgaben aus der Product DNA und anderen Engines und produziert visuelle Assets.

### 12.1 AI Image Factory

**Zweck:** Automatisierte Bildgenerierung aus Product DNA.

**Verantwortlichkeiten:**
- Produktbild-Generierung (Freisteller, Lifestyle, Infografik)
- Brand-konsistente Style-Anwendung
- Batch-Generierung für ganze Kategorien
- Qualitäts-Scoring generierter Bilder
- Human Review Queue für Bilder

**Eingaben:**
- Product DNA (creative.imagePrompts, creative.style)
- Brand Guidelines (Farbpalette, Stil)
- Reference Images

**Ausgaben:**
- Generierte Bilder in verschiedenen Formaten/Größen
- Asset-Referenzen → Asset Management
- Events: `creative.image.generated`, `creative.image.approved`

**AI Provider:** Abstrahiert via AI Provider Adapter → austauschbar (DALL-E 3, Midjourney API, Stable Diffusion, Flux)

---

### 12.2 Mockup Factory

**Zweck:** Produktmockups auf realistischen Trägermedien.

**Verantwortlichkeiten:**
- T-Shirts, Tassen, Verpackungen, Poster (Print Commerce)
- Gerätescreens für digitale Produkte
- Ambiente-Mockups (Wohnzimmer, Büro, Outdoor)
- Batch-Mockup für ganze Produktlinien

**Eingaben:**
- Design Assets aus AI Image Factory oder Design Studio
- Mockup-Templates (per Kategorie vordefiniert)
- Product DNA (Kanal-Anforderungen)

**Ausgaben:**
- Mockup-Bilder → Asset Management
- Events: `creative.mockup.ready`

---

### 12.3 Design Studio

**Zweck:** Manuelle und KI-unterstützte Design-Erstellung.

**Verantwortlichkeiten:**
- Vorlagen-basiertes Design (Drag & Drop)
- Brand Kit Management (Farben, Schriften, Logos)
- Template-Bibliothek (Social, Print, Banner)
- AI-Assist für Layout und Text-Platzierung
- Export in alle relevanten Formate

**Schnittstellen:** Browser-basiertes Design-Tool (ähnlich Canva, aber in-Platform)

---

### 12.4 Video Factory

**Zweck:** Automatisierte Videoproduktion aus Product DNA.

**Verantwortlichkeiten:**
- Produktvideos aus Bildern + Musik + Text
- Slideshow-Videos für Social Media
- TikTok / Reels Format-Optimierung
- AI Voiceover (Text-to-Speech aus DNA-Beschreibung)
- Unboxing-Video Templates

**Eingaben:**
- Product DNA (Beschreibungen, USPs)
- Assets aus AI Image Factory
- Brand Guidelines

**Ausgaben:**
- Video-Dateien (MP4, verschiedene Auflösungen)
- Events: `creative.video.ready`

---

### 12.5 Asset Management

**Zweck:** Zentrales Repository aller Medien-Assets.

**Verantwortlichkeiten:**
- Asset-Speicher (strukturiert nach Produkt, Kanal, Format)
- Tagging und Kategorisierung
- Format-Konvertierung (WebP, AVIF, JPG, PNG)
- CDN-Integration
- Asset-Versionierung
- Verwendungsnachweis pro Asset

**Schnittstellen:**
- `GET /api/assets?productId=...&channel=shop&format=webp`
- `POST /api/assets/upload`
- Events: `asset.uploaded`, `asset.published`

---

## 13. Content Layer

Der Content Layer produziert alle textuellen Inhalte der Plattform — automatisiert, kanalspezifisch und SEO-optimiert.

### 13.1 Listing Factory

**Zweck:** Automatische Erstellung von Produktlistings für alle Kanäle aus der DNA.

**Verantwortlichkeiten:**
- Shop-Produkttexte (Kurz, Lang, Bullets)
- Marketplace Listings (eBay, Amazon, Kleinanzeigen — kanalspezifisch)
- Google Shopping Feed
- Drucktexte (Katalog, Flyer)
- Lokalisierung in andere Sprachen (via Translation Engine)
- A/B-Test-Varianten von Listings

**Eingaben:**
- Product DNA (identity, seo, positioning, channels)
- Market Reference Prices (Kontext für Preisframing)
- Channel Rules (eBay-Richtlinien, Amazon-Policies)

**Ausgaben:**
- Strukturierte Listing-Objekte pro Kanal
- Events: `content.listing.ready`

**AI-Komponenten:** LLM-Generierung mit Channel-spezifischen Prompts; Template-Overrides per Kategorie.

---

### 13.2 SEO Engine

**Zweck:** Vollständige technische und inhaltliche SEO-Optimierung.

**Verantwortlichkeiten:**
- Meta-Tags und Open Graph pro Seite aus DNA
- Structured Data (schema.org/Product, BreadcrumbList, FAQPage)
- Sitemaps (dynamisch, aktuell)
- Canonical URL Management
- Internal Linking Empfehlungen
- SEO-Scoring pro Produktseite
- Keyword-Gap-Analyse

**Eingaben:**
- Product DNA (seo section)
- Trend Intelligence (steigende Keywords)
- Analytics (welche Seiten ranken nicht?)

**Ausgaben:**
- Rendered Meta Tags (SSR via Next.js)
- Sitemap XML
- SEO-Score-Reports
- Events: `seo.score.updated`, `seo.issue.detected`

---

### 13.3 Blog Engine

**Zweck:** SEO-Content und redaktionelle Inhalte automatisiert und manuell erstellen.

**Verantwortlichkeiten:**
- Blog-Post-Erstellung (manuell + AI-assisted)
- AI-generierte Ratgeber-Artikel aus DNA und Trend-Daten
- Interne Verlinkung mit Shop-Produkten
- Kategorisierung und Tag-Verwaltung
- RSS-Feed
- Social-Sharing-Integration

**Aktuelle Implementierung:** ✅ Basis implementiert (Blog Posts, Kategorien, Tags)

---

### 13.4 Social Content Factory

**Zweck:** Kanalspezifische Social-Media-Inhalte aus Product DNA.

**Verantwortlichkeiten:**
- Instagram-Posts (Bild + Caption + Hashtags)
- TikTok-Script-Vorlagen
- Pinterest-Pins
- LinkedIn-Posts (B2B-Fokus)
- Tweet/X-Posts
- Automatischer Content-Kalender

**Eingaben:**
- Product DNA (Positionierung, Tonalität, USPs)
- Creative Assets (Bilder, Videos)
- Trend Intelligence (aktuelle Hashtags)

**Ausgaben:**
- Post-Objekte pro Plattform
- Content-Kalender-Einträge
- Events: `content.social.ready`

---

### 13.5 UGC Factory

**Zweck:** Management und Kuration von nutzergenerierten Inhalten.

**Verantwortlichkeiten:**
- UGC-Sammlung (Social Mentions, Review-Scraping)
- AI-gestützte Qualitätsbewertung
- Rechte-Management (Reposts mit Genehmigung)
- UGC-Integration in Produktseiten (Social Proof)
- Review-Anfragen nach Kauf

---

### 13.6 Translation Engine

**Zweck:** Mehrsprachigkeit aller Inhalte ohne manuelle Übersetzungsarbeit.

**Verantwortlichkeiten:**
- DNA-Inhalte in Zielsprachen übersetzen
- Shop-UI-Texte lokalisieren
- SEO-Optimierung in Zielsprache (nicht nur wörtliche Übersetzung)
- Qualitätsprüfung (kein direktes Maschinenübersetzungs-Feeling)
- Terminologie-Glossar pro Sprachpaar

**Eingaben:** LocalizedString-Felder aus allen Modulen

**Ausgaben:** Übersetzte LocalizedString-Felder

**AI Provider:** DeepL API (primär) + LLM-Post-Processing für Tonalität

---

## 14. Automation Layer

### 14.1 Workflow Engine

**Zweck:** Visuelle und programmierbare Automatisierungsflows ohne Coding.

**Verantwortlichkeiten:**
- Trigger-basierte Workflows (Event → Condition → Action)
- Workflow-Designer (Node-basierter Editor, ähnlich n8n)
- Vordefinierte Templates (Produkt freischalten, Preis anpassen, Listing aktualisieren)
- Fehlerbehandlung und Retry-Logik
- Execution Logs

**Konzept:** Die Workflow Engine ist der "No-Code Arm" der Plattform — sie gibt Nicht-Entwicklern die Möglichkeit, Automationen ohne Code zu bauen. Unter der Haube verwenden sie denselben Event Bus wie alle anderen Module.

**Trigger-Typen:**
- **Event Trigger:** `order.placed`, `inventory.low`, `trend.spike.detected`
- **Schedule Trigger:** Täglich 06:00, Wöchentlich Montag
- **Webhook Trigger:** Externes System → Plattform
- **Manual Trigger:** Button im Admin

---

### 14.2 Event Bus

**Zweck:** Rückgrat der plattforminternen Kommunikation.

**Design-Prinzipien:**
- Alle Events sind benannt, typisiert und versioniert (z.B. `order.placed.v2`)
- Events sind immutable — sie werden nie modifiziert
- Events werden mindestens 90 Tage aufbewahrt (Audit, Replay)
- At-least-once Delivery (Consumer bestätigen Verarbeitung)

**Event-Namenskonvention:** `{domain}.{entity}.{action}[.v{version}]`

Beispiele:
- `order.placed.v1`
- `catalog.product.published.v1`
- `intelligence.opportunity.found.v2`
- `pricing.recommendation.ready.v1`

**Implementierungsoptionen:**
- **Phase 1–2:** In-Process Event Bus (leichtgewichtig, kein externe Infrastruktur)
- **Phase 3+:** Redis Streams oder PostgreSQL LISTEN/NOTIFY
- **Enterprise:** AWS EventBridge / Google Pub/Sub

---

### 14.3 Scheduler

**Zweck:** Zeitgesteuerte Ausführung von Plattformaufgaben.

**Verantwortlichkeiten:**
- Cron-Jobs für wiederkehrende Aufgaben
- Delayed Jobs (in 10 Minuten ausführen)
- Retry-Queues (fehlgeschlagene Jobs wiederholen)
- Job-Monitoring und Alerting

**Typische geplante Aufgaben:**
| Job | Zeitplan | Zweck |
|---|---|---|
| Marketplace Scout | täglich 06:00 | Neue Listings scrapen |
| Pricing Check | täglich 09:00 | Preise vs. Wettbewerb |
| Daily Report | täglich 12:00 | Opportunity Report |
| Inventory Sync | alle 2 Stunden | Bestands-Abgleich |
| SEO Audit | wöchentlich | Ranking-Änderungen |
| Analytics Roll-Up | täglich 01:00 | Aggregierte KPIs |

---

### 14.4 AI Agent Runtime

**Zweck:** Laufzeitumgebung für autonome KI-Agenten.

→ Vollständige Spezifikation in Abschnitt 17.

---

### 14.5 Notifications

**Zweck:** Zuverlässige Benachrichtigungen an Menschen und externe Systeme.

**Kanäle:** E-Mail, Slack, Telegram, Push (PWA), Webhook

**Typen:**
- Systemalarme (Inventory leer, Fehler in Agent)
- Approval Requests (Human-in-the-Loop)
- Performance Alerts (Umsatz-Anomalie)
- Daily Digest (Zusammenfassung)

---

## 15. Integration Layer

### 15.1 Supplier Adapter

**Zweck:** Abstraktion aller Lieferanten-Integrationen hinter einer einheitlichen Schnittstelle.

**Implementierte Adapter:**
- Dropshipping-Lieferanten (API-basiert)
- Print-on-Demand (Printful, Printify)
- Großhändler (EDI oder API)

**Interface:**
```typescript
interface SupplierAdapter {
  getProducts(query: ProductQuery): Promise<SupplierProduct[]>
  getInventory(sku: string): Promise<StockLevel>
  placeOrder(order: SupplierOrder): Promise<SupplierOrderConfirmation>
  trackShipment(orderId: string): Promise<ShipmentStatus>
}
```

---

### 15.2 Marketplace Adapter

**Zweck:** Abstraktion aller Marktplatz-Integrationen.

**Implementierte Adapter:**
- eBay (offizielle API)
- Amazon SP-API
- Kleinanzeigen (RSS / Scraping für Market Intel)
- Google Shopping (Merchant Center API)

**Interface:**
```typescript
interface MarketplaceAdapter {
  publishListing(listing: ListingPayload): Promise<MarketplaceListing>
  updateListing(id: string, delta: Partial<ListingPayload>): Promise<void>
  deleteListing(id: string): Promise<void>
  getOrders(since: Date): Promise<MarketplaceOrder[]>
  getPerformance(listingId: string): Promise<ListingPerformance>
}
```

---

### 15.3 Payment Adapter

**Interface:**
```typescript
interface PaymentAdapter {
  createIntent(amount: Money, customer: Customer): Promise<PaymentIntent>
  confirmPayment(intentId: string): Promise<PaymentConfirmation>
  refund(paymentId: string, amount: Money): Promise<RefundConfirmation>
  getStatus(paymentId: string): Promise<PaymentStatus>
}
```

**Implementierte Adapter:** Stripe, PayPal, Klarna, SEPA

---

### 15.4 Shipping Adapter

**Interface:**
```typescript
interface ShippingAdapter {
  getRates(shipment: ShipmentRequest): Promise<ShippingRate[]>
  createLabel(shipment: ShipmentRequest, rate: ShippingRate): Promise<ShippingLabel>
  trackShipment(trackingNumber: string): Promise<TrackingInfo>
  voidLabel(labelId: string): Promise<void>
}
```

**Implementierte Adapter:** DHL, DPD, Hermes, UPS, sendcloud (Meta-Adapter)

---

### 15.5 AI Provider Adapter

**Zweck:** Abstraktion aller KI-Provider hinter einer einheitlichen Schnittstelle. Keine Engine kennt direkt OpenAI oder Anthropic — nur den Adapter.

**Interface:**
```typescript
interface AIProviderAdapter {
  complete(prompt: Prompt, options: CompletionOptions): Promise<Completion>
  generateImage(prompt: string, options: ImageOptions): Promise<ImageResult>
  embed(text: string): Promise<number[]>
  transcribe(audio: Buffer): Promise<string>
}
```

**Implementierte Provider:** OpenAI (GPT-4.1, GPT-4o), Anthropic (Claude), Google (Gemini), lokale Modelle (Ollama)

**Routing:** Der Adapter entscheidet anhand von Task-Typ, Kosten und Verfügbarkeit, welcher Provider verwendet wird.

---

## 16. Platform Layer

### 16.1 API

**Design:** REST-primär mit OpenAPI-Spec. GraphQL als optionale Query-Schicht für komplexe Datenabrufe.

**Prinzipien:**
- Alle Endpoints versioniert (`/api/v1/`, `/api/v2/`)
- JSON:API-ähnliche Response-Struktur
- Pagination überall
- Idempotency Keys für kritische Operationen

---

### 16.2 Authentication

**Prinzipien:**
- JWT (kurzlebig, 15 min) + Refresh Token (rotierend)
- API Keys für Server-to-Server (nie im Browser)
- Scoped API Keys (readonly, write, admin)
- PKCE Flow für öffentliche Clients

---

### 16.3 Permissions

**Model:** RBAC (Role-Based Access Control) + ABAC (Attribute-Based) für fine-grained Kontrolle.

**Standard-Rollen:**
- `admin` — Vollzugriff
- `manager` — CRUD alle Module, kein System-Konfiguration
- `editor` — Content und Produkte
- `analyst` — Read-only auf alle Analytics
- `agent` — Eingeschränkter Zugriff für AI Agents (gesondert modelliert)

---

### 16.4 Plugin System

**Zweck:** Dritte und eigene Erweiterungen ohne Fork der Plattform.

**Plugin-Typen:**
- **Adapter Plugin:** Neue Marketplace, Payment, Shipping, AI Provider
- **Engine Plugin:** Komplett neue Engine mit eigenem Datenbankschema
- **Hook Plugin:** Pre/Post Hooks auf Core-Operationen
- **UI Plugin:** Neue Admin-Seiten und Widgets

**Plugin Manifest:**
```json
{
  "id": "wsp-plugin-ebay-advanced",
  "name": "eBay Advanced Sync",
  "version": "2.1.0",
  "hooks": ["catalog.product.published"],
  "permissions": ["marketplace.read", "marketplace.write"],
  "adapter": "MarketplaceAdapter"
}
```

---

### 16.5 SDK

**TypeScript SDK** für alle Plattform-Interaktionen:

```typescript
import { WSPCommerce } from '@wsp-commerce/sdk'

const client = new WSPCommerce({ apiKey: '...' })

// Product DNA lesen
const dna = await client.catalog.getProductDNA('product-uuid')

// Listing Factory triggern
await client.content.generateListings(dna.id, ['shop', 'ebay'])

// Auf Events reagieren
client.events.on('intelligence.opportunity.found', async (event) => {
  await client.catalog.createDraftFromOpportunity(event.listingId)
})
```

---

### 16.6 Developer API

**Scope:** Öffentliche API für Partner und Drittanbieter-Entwickler.

**Portal-Features:**
- Interaktive API-Dokumentation (Swagger UI)
- API-Key Management
- Sandbox-Environment
- Webhook-Testing Tool
- Rate Limit Dashboard

---

## 17. AI-First Architektur

### 17.1 AI Agent Layer

Agenten sind autonome Akteure innerhalb der Plattform. Sie haben Zugriff auf Tools, können Entscheidungen treffen und Aktionen auslösen — innerhalb definierter Berechtigungen und Freigabeprozesse.

**Agent-Typen:**

| Agent | Zweck | Autonomie |
|---|---|---|
| Market Scout Agent | Marktplatz scannen, Opportunitäten finden | Hoch (liest nur) |
| Deal Analyzer Agent | Listings bewerten, Score vergeben | Hoch |
| Product Draft Agent | DNA-Entwurf aus Listing generieren | Mittel (Draft, kein Publish) |
| Content Agent | Listings und SEO-Texte generieren | Mittel (Draft → Review) |
| Pricing Agent | Preisempfehlungen berechnen | Niedrig (nur Empfehlung) |
| Fulfillment Agent | Bestellungen abwickeln | Hoch (nach Approval-Schranken) |
| Analytics Agent | Anomalien erkennen, Berichte erstellen | Hoch |

---

### 17.2 Agent-Kommunikation

Agenten kommunizieren über den **Event Bus**, nicht direkt miteinander. Das verhindert Abhängigkeitsketten und erlaubt parallele Ausführung.

**Ausnahme:** Ein Agent kann einen anderen Agent direkt über den **Agent Orchestrator** aufrufen, wenn ein Multi-Step-Workflow koordiniert werden muss (z.B. "Finde Opportunity → Analysiere → Erstelle Draft").

```
Orchestrator
    │
    ├── Market Scout Agent  (findet Listing)
    │       │ emits: intelligence.opportunity.found
    │
    ├── Deal Analyzer Agent  (bewertet Listing)
    │       │ emits: intelligence.analysis.complete
    │
    └── Product Draft Agent  (erstellt DNA-Entwurf)
            │ emits: catalog.draft.created
            → Human Review Required
```

---

### 17.3 Tool System

Agenten greifen auf die Plattform nicht direkt über Code zu — sie nutzen **Tools** (analog zu MCP/Function Calling).

**Tool-Kategorien:**

**Read Tools (immer erlaubt):**
- `catalog.search` — Produkte suchen
- `intelligence.getMarketData` — Marktdaten abrufen
- `analytics.query` — Metriken abfragen
- `inventory.getLevel` — Bestand prüfen

**Write Tools (mit Scope-Berechtigung):**
- `catalog.createDraft` — Produktentwurf anlegen
- `content.generateListing` — Listing generieren
- `pricing.proposeChange` — Preisänderung vorschlagen (nicht ausführen)
- `order.updateStatus` — Bestellstatus ändern

**Human-Gated Tools (immer Approval required):**
- `catalog.publishProduct` — Produkt veröffentlichen
- `pricing.applyChange` — Preis tatsächlich anpassen
- `marketplace.createListing` — Listing auf Marktplatz veröffentlichen
- `campaign.launch` — Marketing-Kampagne starten

---

### 17.4 Kontext-Management

Agenten operieren mit Kontext-Fenstern. Für langlebige Prozesse wird Kontext aktiv verwaltet:

**Kontext-Quellen:**
- **Product DNA** — Immer verfügbar, per Referenz
- **Task Context** — Spezifisch für den aktuellen Task
- **Session Memory** — Ephemer, für die Dauer einer Agent-Session
- **Episodic Memory** — Langfristig: "Was hat dieser Agent zuletzt getan?"
- **Semantic Memory** — Aggregiertes Wissen: "Typische Spanne für Wechselrichter: 200–500 EUR"

---

### 17.5 Memory System

```
AgentMemory {
  episodic: [
    {
      timestamp: ISO8601,
      action: "analyzed_listing",
      listingId: "...",
      result: { dealScore: 72, recommendation: "buy" },
      outcome: "purchased" | "passed" | "pending"
    }
  ],
  semantic: {
    "pricing.wechselrichter.typical_range": "200-1500 EUR",
    "supplier.reliability.xyz": 0.87,
    "category.margin.laderegler": "45-60%"
  },
  procedural: [
    // Gelerntes Vorgehen: Wie analysiert man ein VB-Listing?
  ]
}
```

**Memory Persistence:** Episodisches Memory → Datenbank (PostgreSQL). Semantisches Memory → Vector DB (pgvector oder Pinecone).

---

### 17.6 Human-in-the-Loop

Jede Agenten-Aktion über einem definierten Stakes-Level erfordert menschliche Freigabe.

**Freigabe-Trigger:**
- Preisänderung > konfigurierter Schwellwert
- Neue Produktveröffentlichung
- Marketingbudget-Allocation > X EUR
- Kauf-Empfehlung > Y EUR
- Aktion, die irreversibel ist (Löschung, Versand)

**Freigabe-Flow:**
```
Agent proposes action
      │
      ▼
Approval Queue (in Admin UI)
      │
    Human reviews:
    - Was schlägt der Agent vor?
    - Warum? (Agent explanation)
    - Was passiert, wenn ich ablehne?
      │
    ┌─┴──────┐
  Approve   Reject
    │           │
Agent executes  Agent notes rejection
                → Learns from feedback
```

---

### 17.7 Task Queue

Agenten-Tasks werden in einer persistenten Queue verwaltet:

```
AgentTask {
  id:         UUID
  agentType:  string
  status:     "queued" | "running" | "awaiting_approval" | "completed" | "failed"
  priority:   "low" | "normal" | "high" | "critical"
  input:      Record<string, unknown>
  output:     Record<string, unknown>?
  error:      string?
  retries:    number
  maxRetries: number
  createdAt:  Timestamp
  completedAt: Timestamp?
  approvalRequired: boolean
  approvedBy: UserRef?
  approvedAt: Timestamp?
}
```

---

## 18. Zukünftige Engines & Module

### 18.1 Subscription Commerce Engine

**Zweck:** Abonnements und wiederkehrende Zahlungen.

**Scope:**
- Produkt-Abonnements (monatliche Lieferung)
- SaaS-Lizenzmodelle
- Content-Subscription (Premium-Mitgliedschaft)
- Pause/Resume/Cancel Flows
- Dunning Management (fehlgeschlagene Zahlung)

**Priorisierung:** Mittel — sobald digitale Produkte und Lizenzen im Einsatz sind.

---

### 18.2 B2B Commerce Engine

**Zweck:** Großkunden, Händler und Wiederverkäufer.

**Scope:**
- B2B-Preislisten (Staffelpreise, Kundenpreise)
- Angebotsworkflow (Quote → Approval → Order)
- Kreditlimit-Verwaltung
- Rechnungskauf (Zahlungsziel)
- Kundengruppen und Sortiment-Beschränkungen

**Priorisierung:** Hoch, sobald B2B-Kunden erschlossen werden.

---

### 18.3 Bundle Engine

**Zweck:** Produkt-Bundles mit intelligenter Zusammenstellung.

**Scope:**
- Manuelle Bundle-Definition
- AI-empfohlene Bundles (aus Recommendation Engine + DNA)
- Bundle-Pricing (Rabatt vs. Einzelkauf)
- Bundle-Inventory (aus Einzelteilen zusammengerechnet)

**Aktuelle Implementierung:** ✅ Basis implementiert (Bundles Admin)

---

### 18.4 Licensing Engine

**Zweck:** Verwaltung von Produkt- und Software-Lizenzen.

**Scope:**
- Lizenz-Generierung (eindeutige Keys)
- Lizenz-Validierung (Online/Offline)
- Lizenz-Transfer und Upgrade
- Missbrauchs-Erkennung

---

### 18.5 Personalization Engine

**Zweck:** Individualisierung der Shop-Erfahrung pro Besucher.

**Scope:**
- Dynamische Startseite (andere Produkte für andere Segmente)
- Personalisierte Preise (Segment-basiert)
- Personalisierter Content (Ton, Sprache, Angebote)
- Privacy-first (DSGVO-konformes Consent-Modell)

**Priorisierung:** Hoch, sobald Kundendaten vorhanden sind.

---

### 18.6 Experimentation & A/B Testing Engine

**Zweck:** Systematisches Testen von Produktseiten, Preisen, CTAs und Layouts.

**Scope:**
- A/B-Tests für Produkttexte (Listing Factory Output)
- Preis-A/B-Tests (Pricing Intelligence)
- Layout-Tests (Headless Frontend)
- Statistische Signifikanz-Berechnung
- Automatische Winner-Selection

---

### 18.7 Customer Intelligence Engine

**Zweck:** Tiefes Verständnis von Kundensegmenten.

**Scope:**
- Automatische Segmentierung (Verhalten, CLV, Produkt-Affinität)
- Churn-Vorhersage
- Next-Purchase-Prediction
- VIP-Kunden-Identification
- Feedback-Analyse (Reviews, Support-Tickets)

---

### 18.8 Commerce Copilot

**Zweck:** KI-Assistent, der direkt im Admin-Interface sitzt und natürlichsprachlich angesprochen werden kann.

**Scope:**
- Fragen beantworten: "Welche Produkte haben diese Woche am schlechtesten performed?"
- Aktionen auslösen: "Erstell ein Listing für dieses Produkt auf eBay"
- Analysen erklären: "Warum ist der Umsatz gestern gefallen?"
- Empfehlungen geben: "Was soll ich als nächstes priorisieren?"

**Priorisierung:** Hoch — wird zu einem der stärksten UX-Differenzierungsmerkmale.

---

### 18.9 Supplier Intelligence Engine

**Zweck:** Kontinuierliche Bewertung und Verbesserung der Lieferanten-Performance.

**Scope:**
- Lieferzeiten-Tracking und Abweichungsanalyse
- Qualitätsbewertung (Retouren-Quote pro Supplier)
- Preisvergleich zwischen Lieferanten
- Risiko-Scoring (Single-Source-Abhängigkeit)
- Automatische Alternativlieferanten-Empfehlungen

---

### 18.10 Workflow Engine (No-Code)

**Zweck:** Visuelle Automatisierung ohne Programmierung.

**Scope:**
- Node-basierter Workflow-Editor (Browser)
- Trigger: Events, Schedule, Webhook, Manual
- Actions: API-Calls, E-Mails, Admin-Aktionen
- Conditions und Branching
- Loops und Batch-Verarbeitung
- Fehlbehandlung und Retry

---

## 19. Roadmap nach Plattform-Reife

```
Phase 0: Foundation (ABGESCHLOSSEN)
─────────────────────────────────────────────────────────────────
  ✅ Core Layer (Catalog, Orders, Customers, Pricing, Inventory)
  ✅ Physical Commerce Engine (Shop)
  ✅ Blog Engine (Basis)
  ✅ Bundle Engine (Basis)
  ✅ Asset Management (Basis)
  ✅ Admin-Oberfläche
  ✅ Authentication & Permissions
  ✅ API (REST, Admin-geschützt)


Phase 1: Intelligence (LAUFEND)
─────────────────────────────────────────────────────────────────
  ✅ Marketplace Intelligence (Market Scout, Deal Analyzer)
  ✅ Market Reference Prices
  ✅ Product Draft Generator
  ✅ Opportunity Agent (Daily Report)
  ✅ Knowledge Extractor
  🔄 Neue Produktkategorien (Wechselrichter, Laderegler, Optimizer, Halterung)
  ⬜ Pricing Intelligence (Wettbewerber-Monitoring)
  ⬜ Revenue Intelligence (Revenue Dashboard)
  ⬜ Trend Intelligence (Basis)


Phase 2: Content & Creative (NÄCHSTE)
─────────────────────────────────────────────────────────────────
  ⬜ Listing Factory (vollständig, alle Kanäle)
  ⬜ SEO Engine (vollständig, Schema.org, Sitemap)
  ⬜ Social Content Factory (Basis)
  ⬜ AI Image Factory (Basis, DALL-E 3)
  ⬜ Translation Engine (DeepL Integration)
  ⬜ Product DNA Schema (vollständige Implementierung)


Phase 3: Automation
─────────────────────────────────────────────────────────────────
  ⬜ Event Bus (vollständig implementiert, dokumentiert)
  ⬜ Workflow Engine (No-Code, Basis)
  ⬜ Scheduler (Cron + Delayed Jobs)
  ⬜ AI Agent Runtime (Basis: Scout, Analyzer, Content)
  ⬜ Notifications (E-Mail, Slack, Telegram)
  ⬜ Human-in-the-Loop Approval Flows


Phase 4: Commerce Expansion
─────────────────────────────────────────────────────────────────
  ⬜ Marketplace Commerce Engine (eBay, Amazon Listing-Sync)
  ⬜ Digital Commerce Engine
  ⬜ B2B Commerce Engine (Basis)
  ⬜ Subscription Engine (Basis)
  ⬜ Personalization Engine (Basis)


Phase 5: AI Native Platform
─────────────────────────────────────────────────────────────────
  ⬜ Commerce Copilot (natürlichsprachliche Admin-Interaktion)
  ⬜ Autonomer Product Scout Agent
  ⬜ Pricing Agent (vollständig autonom innerhalb Bounds)
  ⬜ Customer Intelligence Engine
  ⬜ Recommendation Engine (vollständig)
  ⬜ A/B Testing Engine
  ⬜ Memory System für Agenten


Phase 6: Enterprise & Network
─────────────────────────────────────────────────────────────────
  ⬜ Plugin System (vollständig, mit Marketplace)
  ⬜ Developer SDK
  ⬜ White-Label-Fähigkeit
  ⬜ Multi-Tenant (mehrere Shops pro Instanz)
  ⬜ Commerce Intelligence Network (geteilte anonyme Daten)
  ⬜ Partner-API-Programm
```

---

## 20. Innovation Lab

*Ideen ohne akute Priorität — bewerteter Ideenspeicher für zukünftige Entscheidungen.*

---

### IL-001: Autonome Produkterfindung

**Idee:** Der Agent scannt Marktdaten, erkennt Lücken (hohe Nachfrage, niedriges Angebot) und schlägt vollständig neue Produktideen vor — inklusive DNA-Entwurf, Business Case und erstem Listingentwurf.

**Innovationspotenzial:** ★★★★★
**Umsetzungsaufwand:** ★★★★☆ (hoch — erfordert starke Trend + Market Intelligence)
**Geschäftspotenzial:** ★★★★★ (klarer Differentiator gegenüber allem am Markt)
**Technische Komplexität:** ★★★★☆

---

### IL-002: Selbstoptimierende Produktseiten

**Idee:** Die Plattform testet kontinuierlich Varianten von Produkttexten, Bildern und CTAs — und schaltet automatisch auf die bessere Variante, wenn statistische Signifikanz erreicht ist.

**Innovationspotenzial:** ★★★★☆
**Umsetzungsaufwand:** ★★★☆☆
**Geschäftspotenzial:** ★★★★☆
**Technische Komplexität:** ★★★☆☆

---

### IL-003: Dynamische Preisfindung durch Auktionsmechanismus

**Idee:** Für bestimmte Produktkategorien (Vintage, Refurbished, Limited) nutzt die Plattform interne Auktionen — oder bietet automatisch auf externen Marktplätzen (eBay) mit einer definierten Preisstrategie.

**Innovationspotenzial:** ★★★★☆
**Umsetzungsaufwand:** ★★★★☆
**Geschäftspotenzial:** ★★★☆☆
**Technische Komplexität:** ★★★★☆

---

### IL-004: Commerce Intelligence Network

**Idee:** Anonymisierter Datenaustausch zwischen WSP-Commerce-OS-Instanzen: Was verkauft sich in welcher Region? Welche Preispunkte sind optimal? Welche Keywords steigen?

**Innovationspotenzial:** ★★★★★
**Umsetzungsaufwand:** ★★★★★ (sehr hoch — Datenschutz, Infrastruktur, Adoption)
**Geschäftspotenzial:** ★★★★★ (Netzwerkeffekt = strategischer Burggraben)
**Technische Komplexität:** ★★★★★

---

### IL-005: AI-gestützte Preisverhandlung für B2B

**Idee:** Ein Conversational Agent übernimmt B2B-Preisverhandlungen via Chat — kennt Mindestmargen, Kundenwert und Marktpreise — und schließt Angebote innerhalb definierter Grenzen autonom ab.

**Innovationspotenzial:** ★★★★☆
**Umsetzungsaufwand:** ★★★★☆
**Geschäftspotenzial:** ★★★★★ (B2B-Differentiator, spart Vertriebszeit)
**Technische Komplexität:** ★★★★☆

---

### IL-006: Predictive Inventory Management

**Idee:** Der Inventory Agent sagt Bestands-Engpässe 30–60 Tage voraus (basierend auf Saisonalität, Trend-Daten, aktuellen Verkaufsraten) und löst automatisch Nachbestellungen aus.

**Innovationspotenzial:** ★★★☆☆
**Umsetzungsaufwand:** ★★★☆☆
**Geschäftspotenzial:** ★★★★☆ (verhindert Stockouts = direkter Umsatzverlust)
**Technische Komplexität:** ★★★☆☆

---

### IL-007: Product DNA aus Bild (Foto → DNA)

**Idee:** Händler fotografiert ein Produkt mit dem Smartphone → Vision AI extrahiert alle relevanten Produktinformationen → erste DNA wird automatisch angelegt. Besonders relevant für Kleinanzeigen-Ankäufe.

**Innovationspotenzial:** ★★★★★
**Umsetzungsaufwand:** ★★★☆☆ (Vision API vorhanden)
**Geschäftspotenzial:** ★★★★☆ (massiver UX-Vorteil beim Onboarding)
**Technische Komplexität:** ★★★☆☆

---

### IL-008: Emotional Commerce — Stimmungsbasierte Personalisierung

**Idee:** Der Shop erkennt aus Context-Signalen (Tageszeit, Wetter, Suchanfragen, Verweildauer) die emotionale Verfassung des Besuchers und passt Tonalität, Bilder und Angebote an.

**Innovationspotenzial:** ★★★★☆
**Umsetzungsaufwand:** ★★★★★
**Geschäftspotenzial:** ★★★☆☆
**Technische Komplexität:** ★★★★★

---

### IL-009: Live Commerce Integration

**Idee:** Direkter Verkauf während Livestreams (TikTok Live, YouTube Live) — der Agent überwacht den Stream, antwortet auf Kommentare mit Produktinfos und verarbeitet Sofortkäufe.

**Innovationspotenzial:** ★★★★☆
**Umsetzungsaufwand:** ★★★★☆
**Geschäftspotenzial:** ★★★★☆ (wachsende Vertriebsform)
**Technische Komplexität:** ★★★★☆

---

### IL-010: Zero-Inventory Commerce

**Idee:** Die Plattform listet Produkte, die noch nicht physisch vorhanden sind. Bei Bestellung löst sie automatisch Beschaffung, Qualitätsprüfung und Versand aus — ohne Lagerhaltung. Commerce-as-a-Service für den Händler ohne Lager.

**Innovationspotenzial:** ★★★★★
**Umsetzungsaufwand:** ★★★★★
**Geschäftspotenzial:** ★★★★★
**Technische Komplexität:** ★★★★★

---

## 21. Architektur-Entscheidungen (ADRs)

### ADR-001: Modular Monolith statt Microservices

**Entscheidung:** WSP Commerce OS wird als modularer Monolith entwickelt, nicht als Microservices-Architektur.

**Begründung:**
- Microservices sind sinnvoll bei Team-Skalierung >15 Entwickler und klaren Domänen-Grenzen
- Ein kleines Team mit einem modularen Monolith ist produktiver
- Module haben klare Grenzen (eigene Verzeichnisse, eigene Schemas)
- Migration zu Microservices ist möglich, wenn nötig — umgekehrt nicht

**Konsequenzen:** Alle Module laufen in einem Prozess. Der Event Bus ist zunächst in-process (kein Kafka/Redis nötig).

---

### ADR-002: Product DNA als zentrales Datenmodell

**Entscheidung:** Alle produktbezogenen Module leiten ihre Daten aus der Product DNA ab — sie speichern keine eigene Kopie von Produktdaten.

**Begründung:** Datenkonsistenz als Design-Constraint. Kein Sync-Problem, kein Datendrift.

**Konsequenzen:** Product DNA muss sehr gut modelliert sein. Änderungen an der DNA-Struktur sind breaking changes.

---

### ADR-003: TypeScript + Next.js als Plattform-Stack

**Entscheidung:** Der gesamte Stack bleibt TypeScript. Backend: Hono (Commerce API). Frontend: Next.js (Admin + Shop). Datenbank: PostgreSQL + Prisma.

**Begründung:** Einheitliches Ökosystem, geteilte Types, kein Kontextwechsel zwischen Frontend und Backend.

**Konsequenzen:** Kein Python, kein Go, kein PHP. AI-Integrationen über HTTP APIs (alle großen AI-Provider haben REST APIs).

---

### ADR-004: KI als Architekturelement, nicht als Feature

**Entscheidung:** KI-Fähigkeiten werden nicht als optionale Features hinzugefügt — sie sind Bestandteil der Kernel-Architektur. Der AI Agent Runtime und der AI Provider Adapter sind Core-Infrastruktur.

**Begründung:** Eine Plattform, die nachträglich KI "aufpropft", kämpft dauerhaft mit Integrationsproblemen. AI-native Design bedeutet, dass alle Schnittstellen AI-ready sind.

---

### ADR-005: Human-in-the-Loop als Architekturprinzip

**Entscheidung:** Alle Aktionen mit hohem Stakes erfordern explizite menschliche Freigabe — dieses Prinzip ist in der Plattform-Architektur verankert, nicht nachrüstbar konfigurierbar.

**Begründung:** Vertrauen in KI-Systeme muss verdient werden. Autonomie wird schrittweise ausgedehnt, nicht von Anfang an maximal gesetzt.

---

*Dokumentversion: 1.0 | Erstellt: Juni 2026 | Autor: WSP Commerce OS Architecture Team*

*Dieses Dokument ist der Ausgangspunkt für alle zukünftigen RFCs, Implementierungs-Sprints und Erweiterungen. Es soll regelmäßig aktualisiert werden, wenn sich Prioritäten oder Erkenntnisse ändern.*
