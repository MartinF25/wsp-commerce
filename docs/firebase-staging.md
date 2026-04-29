# Firebase Function Staging – Lead-Ingestion Deploy Guide

Scope: Staging-Deploy der Firebase HTTP Function `onLeadSubmit` für End-to-End Lead-Test.  
Ziel: Kontaktformular → Firebase Function → Firestore (→ optional n8n).

---

## 1. Architektur der Lead-Ingestion

```
Browser
  └─ Kontaktformular absenden
       └─ Next.js Server Action (apps/storefront/app/[locale]/kontakt/actions.ts)
            ├─ FIREBASE_LEAD_FUNCTION_URL gesetzt?
            │    └─ Ja  → POST https://europe-west1-wsp-commerce.cloudfunctions.net/onLeadSubmit
            │                  ├─ Firestore: leads/{leadId} (n8nStatus: "pending")
            │                  └─ N8N_WEBHOOK_URL gesetzt?
            │                       ├─ Ja  → POST {N8N_WEBHOOK_URL}/webhook/lead
            │                       │         └─ Firestore update: n8nStatus: "sent"
            │                       └─ Nein → Firestore update: n8nStatus: "failed" (akzeptabel)
            └─ Nein → Direkt POST {N8N_WEBHOOK_URL}/webhook/lead (Fallback)
```

Für Staging reicht: Firebase Function deployed + `FIREBASE_LEAD_FUNCTION_URL` in Vercel.  
`N8N_WEBHOOK_URL` ist optional — ohne n8n landet der Lead trotzdem in Firestore.

---

## 2. Voraussetzungen

- [ ] Google-Konto mit Zugriff auf Firebase-Projekt `wsp-commerce`
- [ ] Firebase CLI installiert: `npm install -g firebase-tools`
- [ ] Eingeloggt: `firebase login`
- [ ] Firebase-Projekt in der Console angelegt: [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Firestore-Datenbank aktiviert (Schritt 3)
- [ ] Git-Repository enthält Firebase-Source (Schritt 4)

---

## 3. Firebase-Projekt einrichten (einmalig)

### 3.1 – Firestore aktivieren

1. [Firebase Console](https://console.firebase.google.com) → Projekt `wsp-commerce`
2. **Build** → **Firestore Database** → **Create database**
3. Mode: **Production mode** (sicherer Default — Admin SDK ist nicht betroffen)
4. Region: **`europe-west1`** (muss zur Function-Region passen)

> Wenn Firestore in einer anderen Region angelegt wird, muss die Funktion in `index.ts`
> ebenfalls angepasst werden (`region: "europe-west1"` → matching region).

### 3.2 – Firestore Security Rules (Staging)

Da die Function Firebase Admin SDK nutzt (serverseitig), greift sie die Security Rules.  
Für Staging sind die Default-Production-Rules ausreichend — kein Browser-Direktzugriff nötig.

---

## 4. Firebase Source committen und pushen

```bash
# Von Repo-Root:
git add apps/firebase/.firebaserc
git add apps/firebase/firebase.json
git add apps/firebase/functions/package.json
git add apps/firebase/functions/tsconfig.json
git add apps/firebase/functions/src/index.ts
git add apps/firebase/functions/.env.example

git commit -m "feat: add Firebase onLeadSubmit function for lead ingestion"
git push
```

> `.env` und `lib/` (compiled output) dürfen **nicht** committed werden.

---

## 5. Firebase Function deployen

```bash
cd apps/firebase

# Firebase-Projekt verknüpfen (einmalig)
firebase use wsp-commerce

# Function bauen und deployen
# firebase.json läuft automatisch: npm --prefix functions run build → tsc
firebase deploy --only functions
```

Erwartete Ausgabe:
```
✔  functions: Finished running predeploy script.
✔  functions[onLeadSubmit(europe-west1)]: Successful deploy
Function URL (onLeadSubmit(europe-west1)):
  https://europe-west1-wsp-commerce.cloudfunctions.net/onLeadSubmit
```

**Function-URL notieren** — wird in Schritt 7 in Vercel gesetzt.

---

## 6. n8n-Webhook-URL setzen (optional)

Ohne `N8N_WEBHOOK_URL` speichert die Function den Lead trotzdem in Firestore  
(`n8nStatus: "failed"`). Für die Staging-Smoke-Test-Verifizierung ist das ausreichend.

Wenn n8n in Staging aktiv sein soll:

```bash
# Secret Manager (empfohlen — kein Klartext in Firebase-Konsole)
firebase functions:secrets:set N8N_WEBHOOK_URL
# → Prompt: Wert eingeben (z. B. https://n8n.yourdomain.com)

# Danach re-deployen damit die Function das Secret liest:
firebase deploy --only functions
```

Alternativ — `.env`-Datei im functions/-Verzeichnis (lokal + Staging, nicht für Production):

```bash
# apps/firebase/functions/.env  (NICHT committen)
N8N_WEBHOOK_URL=https://n8n.yourdomain.com
```

```bash
# Dann deployen:
firebase deploy --only functions
```

---

## 7. FIREBASE_LEAD_FUNCTION_URL in Vercel setzen

Vercel Dashboard → Storefront-Projekt → **Settings → Environment Variables**:

| Variable | Wert | Environment |
|---|---|---|
| `FIREBASE_LEAD_FUNCTION_URL` | `https://europe-west1-wsp-commerce.cloudfunctions.net/onLeadSubmit` | Preview |

Nach dem Setzen: Neues Vercel-Deployment auslösen (Git-Push oder manuelles Redeploy).

---

## 8. Smoke-Test – Kontaktformular End-to-End

### 8.1 – Direkttest der Firebase Function

```bash
curl -X POST \
  https://europe-west1-wsp-commerce.cloudfunctions.net/onLeadSubmit \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lead",
    "leadType": "private",
    "firstName": "Max",
    "lastName": "Mustermann",
    "company": null,
    "email": "test@example.com",
    "phone": "+49123456789",
    "message": "Staging Smoke Test",
    "productInterest": "solarzaun",
    "region": null,
    "submittedAt": "2026-04-29T10:00:00.000Z"
  }'

# Erwartet: {"success":true,"leadId":"<uuid>"}
# Fehler:   {"error":"..."} (400 = Payload ungültig, 500 = Firestore-Fehler)
```

### 8.2 – Firestore-Prüfung

1. [Firebase Console](https://console.firebase.google.com) → Projekt `wsp-commerce`
2. **Firestore Database** → Collection **`leads`**
3. Neues Dokument mit der `leadId` aus der Antwort prüfen:

| Feld | Erwarteter Wert |
|---|---|
| `email` | `test@example.com` |
| `status` | `"new"` |
| `n8nStatus` | `"sent"` (wenn n8n aktiv) oder `"failed"` (ohne n8n — OK) |
| `createdAt` | Timestamp gesetzt |

### 8.3 – Formular im Vercel-Preview testen

1. Vercel-Preview-URL öffnen → `/kontakt`
2. Formular mit echten Testdaten ausfüllen und absenden
3. Formular zeigt Erfolgsmeldung
4. Firestore → Collection `leads` → neues Dokument prüfen

---

## 9. Staging-Checkliste

- [ ] Firebase-Projekt `wsp-commerce` existiert in Firebase Console
- [ ] Firestore aktiviert, Region `europe-west1`
- [ ] Firebase CLI installiert + eingeloggt
- [ ] Firebase Source committed + gepusht
- [ ] `firebase deploy --only functions` erfolgreich
- [ ] `curl -X POST` → `{"success":true,"leadId":"..."}` ✓
- [ ] Firestore: Dokument in Collection `leads` prüfbar ✓
- [ ] `FIREBASE_LEAD_FUNCTION_URL` in Vercel (Preview) gesetzt
- [ ] Vercel Redeploy ausgelöst
- [ ] Kontaktformular im Preview: Erfolgsmeldung nach Absenden ✓
- [ ] Firestore: Neuer Eintrag nach Formular-Absenden ✓

---

## 10. Bekannte Einschränkungen Staging vs. Production

| Thema | Staging | Production |
|---|---|---|
| `n8nStatus: "failed"` bei fehlendem n8n | Akzeptabel — Lead in Firestore gesichert | n8n aktiv schalten |
| Firestore Production-Mode ohne Custom Rules | OK für Server-only-Zugriff | Rules prüfen wenn Browser-Direktzugriff geplant |
| Function-Kaltstart (erster Request) | Bis 3 Sek. Verzögerung | Cold Start auf min-instances=1 minimieren (Kosten!) |
| Kein Google Cloud Billing aktiviert | Free Tier ausreichend für Staging | Billing pflichtfrei für höheres Volumen |

---

## 11. Blocker für Production-Go-Live

- [ ] Billing-Account in Google Cloud aktivieren (Free Tier hat Limits bei HTTP-Functions)
- [ ] `N8N_WEBHOOK_URL` als Secret Manager Secret gesetzt (nicht als Klartext-Variable)
- [ ] Firestore Security Rules geprüft (falls Storefront Direct-Read implementiert)
- [ ] Firebase Auth konfiguriert (falls Admin-Zugriff auf Firestore-Daten geplant)
- [ ] `min-instances: 1` für `onLeadSubmit` — verhindert Cold-Start-Verzögerungen bei Prod

---

## 12. Empfohlener nächster Task

Alle drei Staging-Deploys (Railway + Vercel + Firebase) laufen.

> **Vollständiger End-to-End Staging Smoke-Test** — alle Seiten, Produktdaten, 
> Kontaktformular in einer systematischen Session durchspielen.  
> Danach: Impressum befüllen + echte Produktdaten importieren für Production-Go-Live.

---

*Erstellt: 2026-04-29 | Scope: Staging only – kein Production-Go-Live*
