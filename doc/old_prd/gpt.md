Here is a structured, detailed solution document you can hand to your client (or use as an internal spec) for the wine inventory web app.

---

## **1\. Business goals and use cases**

The app’s purpose is to make wine inventory faster, more accurate, and traceable, directly from employees’ mobile phones.[hoopsandbrew+1](https://hoopsandbrew.com/blog/inventory-management-app-ui-design-1763346892296)

Core goals:

* Speed up counting bottles during inventory rounds.  
* Reduce manual typing errors.  
* Allow multiple employees to work in parallel, each action linked to a user.  
* Support two workflows:  
  * Search and type inventory.  
  * Scan bottle (barcode or label image recognition) and input quantity.  
* Keep a clear history of who did what and when.

Primary use cases:

1. Employee logs in on a mobile phone.  
2. Employee starts an inventory session (e.g., “Main cellar – February 2026”).  
3. For each bottle:  
   * Option A – Search:  
     * Type part of wine name, grape, or producer.  
     * See candidate list, open details on tap.  
     * Choose the wine, input amount (e.g., “+6”) and confirm.  
   * Option B – Scan:  
     * Open camera.  
     * Choose Barcode or Image Recognition.  
     * App identifies bottle, shows a small card with bottle info and a quantity field.  
     * If multiple candidates, show a short list; user selects correct one.  
     * User confirms quantity.  
4. Data is saved to the database with:  
   * Bottle ID, quantity, timestamp, user ID, inventory session ID, method (search, barcode, image).  
5. Managers can:  
   * See current stock per wine.  
   * See change log (who adjusted which bottle, when, and by how much).  
   * Export reports (CSV).

---

## **2\. High-level architecture**

Recommended architecture:

* Frontend: Responsive web app (React, Vue, or Angular; React is a good default).  
* Backend: REST or GraphQL API (Node.js/TypeScript with Express/NestJS, or Python/FastAPI).  
* Database: Relational DB (PostgreSQL or MySQL) for strong consistency.  
* Authentication: JWT-based auth with refresh tokens.  
* External integrations:  
  * Barcode scanning in-browser via JavaScript library (e.g., STRICH, Quagga2, html5-qrcode).[scanbot+3](https://scanbot.io/techblog/html5-barcode-scanner-tutorial/)  
  * Wine label recognition via external AI API (e.g., API4AI Wine Recognition or similar).[api4+2](https://api4.ai/apis/wine-rec)

Suggested deployment:

* Backend \+ DB on a cloud provider (AWS/Azure/GCP or Render/Fly.io).  
* Frontend as static hosting behind CDN.  
* Use HTTPS everywhere for secure camera and login.

---

## **3\. Core functional requirements**

## **3.1 Authentication and user management**

* User registration (admin only).  
* Roles:  
  * Admin: manage wines, view reports, manage users.  
  * Staff: perform inventory, view bottle info, cannot manage users.  
* Login/logout:  
  * Email/username \+ password.  
  * JWT access token (short-lived) \+ refresh token (longer-lived).  
* Session security:  
  * HTTPS only, secure cookies or local storage with care.  
  * Automatic token refresh; prompt logout on invalid session.

## **3.2 Wine catalog management**

Data model for each wine bottle:

* id  
* name (e.g., “Château X”)  
* producer  
* country, region, sub-region  
* grape(s)  
* vintage (year)  
* type (red, white, rosé, sparkling, fortified, etc.)  
* volume (e.g., 0.75 L)  
* internal SKU/code  
* barcode(s) (EAN/UPC, can be multiple)  
* label image(s) (for reference and to help disambiguation)  
* notes / description  
* minimum stock threshold (for low-stock alerts)

Admin features:

* Create, edit, archive wines.  
* Upload reference label images.  
* Assign barcode values to wines.  
* Set target stock levels and reorder thresholds.[claritee+2](https://claritee.io/blog/designing-an-effective-inventory-app-best-practices-and-tips/)

## **3.3 Inventory sessions**

* InventorySession:  
  * id  
  * name (e.g., “February 2026 full inventory”)  
  * location (e.g., “Main cellar”, “Restaurant bar”)  
  * status (open, closed)  
  * created\_at, closed\_at  
  * created\_by (user id)  
* During an open session, employees:  
  * Add “inventory lines” for bottles and quantities.  
  * Can continue the same session on different days until closed.  
* When closed:  
  * Lock further edits.  
  * Generate snapshot of final stock levels for that date.

## **3.4 Inventory operations**

InventoryLine / StockMovement:

* id  
* session\_id (nullable for ad-hoc adjustments vs. session-based)  
* wine\_id  
* user\_id  
* quantity\_change (positive for added, negative for removed, 0 not allowed)  
* method (SEARCH, BARCODE\_SCAN, IMAGE\_RECOGNITION)  
* created\_at  
* optional notes (e.g., “Broken bottle”, “Promo event”)

Stock calculation:

* Store a `current_stock` field per wine and update it transactionally whenever you insert a StockMovement.  
* Alternatively, compute stock on the fly as sum of movements, but this is heavier at scale; a running total plus movements is usually best.

---

## **4\. AI and scanning integrations**

## **4.1 Barcode scanning in the browser**

Use a JS barcode scanning library that runs on the client using the device camera.[scanbot+3](https://scanbot.io/techblog/quagga-js-tutorial/)

Options:

* STRICH (commercial; JS barcode SDK).[docs.strich+1](https://docs.strich.io/creating-a-barcode-scanning-app-with-javascript-from-scratch.html)  
* Quagga2 (open-source; successor of QuaggaJS).\[[scanbot](https://scanbot.io/techblog/quagga-js-tutorial/)\]​  
* html5-qrcode (simple for QR/1D barcodes).\[[scanbot](https://scanbot.io/techblog/html5-barcode-scanner-tutorial/)\]​

Key capabilities:

* Real-time scanning from camera stream.  
* Support 1D codes like EAN-13 / UPC, which wine bottles typically use.  
* Events/callback when a barcode is detected.[docs.strich+2](https://docs.strich.io/creating-a-barcode-scanning-app-with-javascript-from-scratch.html)

Flow:

1. User taps “Scan barcode” in the app.  
2. The app requests camera permission (via `getUserMedia`).  
3. Barcode library starts scanning and returns the code text.  
4. Frontend calls backend: `GET /api/wines?barcode=EANCODE`.  
5. Backend:  
   * Searches wines table by barcode.  
   * Returns exact match or list of candidates.  
6. Frontend:  
   * If one match: show card with wine name, vintage, current stock, quantity input, confirm button.  
   * If multiple: show list, user selects one, then show card.

## **4.2 Wine label image recognition (AI API)**

Use a wine label recognition API.[rapidapi+2](https://rapidapi.com/api4ai-api4ai-default/api/wine-recognition2/details)

Example providers:

* API4AI Wine Recognition API: recognizes wine labels, returning label name, type, vintage, with confidence scores.[api4+1](https://api4.ai/apis/wine-rec)  
* Other wine label recognition APIs (e.g., on API marketplaces like ZylaLabs).\[[zylalabs](https://zylalabs.com/api-marketplace/machine+learning/wine+label+recognition+api/825)\]​

General behavior:

* Client captures an image through camera input or file upload.  
* Client sends image (or a compressed base64/jpeg) to your backend.  
* Backend calls the external API (e.g., `POST /v1/results` with image) and receives:  
  * List of candidate wines with predicted label name and confidence.[rapidapi+1](https://rapidapi.com/api4ai-api4ai-default/api/wine-recognition2/details)  
* Backend maps those predictions to internal wines:  
  * By exact or fuzzy match on name, producer, vintage.  
  * Optionally store the external API’s label ID for better future matching.

Flow:

1. User taps “Scan label (image recognition)”.  
2. App opens camera, user takes picture of the bottle label.  
3. Frontend uploads image to backend `POST /api/ai/recognize-label`.  
4. Backend:  
   * Validates image, may resize/compress.  
   * Calls AI Wine Recognition API with API key.  
   * Receives predicted labels \+ confidence scores.[zylalabs+2](https://zylalabs.com/api-marketplace/machine+learning/wine+label+recognition+api/825)  
   * Matches predictions to internal DB records (e.g., fuzzy name \+ vintage).  
5. Backend returns list of candidate wines to frontend.  
6. Frontend:  
   * If one high-confidence match: show matching card directly.  
   * If multiple: show list with confidence/short info; user picks one, then sees quantity card.

AI usage considerations:

* Log all recognition requests and results for later evaluation and improvement.  
* Allow user override when AI is wrong.  
* Handle low-confidence results by:  
  * Falling back to showing a search box prefilled with the predicted name.  
  * Or requiring user to confirm manually.

---

## **5\. Detailed UI/UX flows (mobile-first)**

Design principles:[gshnccommunitypartners+2](https://gshnccommunitypartners.org/blog/inventory-management-app-ui-design-1763346892296)

* Large touch targets (buttons and input fields).  
* Minimal steps per action (tap, scan, confirm).  
* Visible, clear feedback after each action (toast/snackbar).  
* Fast text search with instant results.  
* Dark-friendly design possible, as restaurant/cellar lighting is often low.

## **5.1 Login and home**

* Login screen:  
  * Fields: email/username, password.  
  * “Login” button.  
  * Remember me (optional).  
* Home screen for staff:  
  * “Start inventory session” or “Continue session” (if one is open for this location).  
  * “Quick adjust stock” (optional).  
  * Profile/options.

## **5.2 Inventory session screen**

* Header with session name and location.  
* Two big buttons:  
  * “Search & add”  
  * “Scan bottle”  
* Recent wines list:  
  * Shows last 5–10 wines updated in this session for quick repeated use.

## **5.3 Search workflow (typing)**

Screen 1: Search

* Search input with placeholder “Type wine name, grape, or barcode”.  
* As user types, results appear in a scrollable list:  
  * Each item: Wine name, vintage, producer, type, small bottle icon/thumbnail.  
* Tap to open “Quick add card”.

Screen 2: Quick add card

* Show:  
  * Name \+ vintage \+ producer.  
  * Current stock (optional but useful).  
  * Input:  
    * Either quantity to set (absolute) or add (relative). For fast inventory, usually “add X bottles”.  
* Buttons:  
  * “+1”, “+6”, “+12” shortcuts.  
  * Numeric keyboard input.  
  * “Confirm”.  
* After confirm:  
  * Show success message “+6 bottles added”.  
  * Option to “Add another” or “Back to scan”.

## **5.4 Barcode scan workflow**

Screen: Scanner

* Camera preview full-screen.  
* Overlay frame to focus the barcode.[scanbot+2](https://scanbot.io/techblog/html5-barcode-scanner-tutorial/)  
* Button to toggle flashlight if supported.  
* Cancel button.

Behavior:

* When barcode detected:  
  * Pause scanner.  
  * Call API for wine by barcode.  
  * If found:  
    * Show quick add card as above.  
  * If multiple:  
    * Show selection list, then quick add card.  
  * If none:  
    * Show message “No wine found for this barcode”.  
    * Options:  
      * “Search by name” (pre-filled).  
      * “Create new wine” (admin only).

## **5.5 Image recognition workflow**

Screen: Label capture

* Camera preview with guidance: “Align the label within the frame”.  
* Capture button.  
* After capture:  
  * Show preview with “Use” or “Retake”.  
* On “Use”:  
  * Show loading indicator while backend calls AI.  
* Result screen:  
  * Show top matched wine card.  
  * If multiple candidates:  
    * Show list of 2–5 best guesses with confidence.  
  * User selects one, then sees quick add card.

Error/edge cases:

* Poor light or blur:  
  * Offer instructions: “Try again with better lighting” or “Move closer”.  
* API error:  
  * Fall back to search workflow with prefilled likely name if any.

## **5.6 History and reporting (admin UI)**

* Stock overview page:  
  * Table with wine name, vintage, current stock, min stock level, low-stock indicator.[hoopsandbrew+1](https://hoopsandbrew.com/blog/inventory-management-app-ui-design-1763346892296)  
* Movements page:  
  * Filters: date range, wine, user, method, session.  
  * List: timestamp, wine, quantity\_change, user, method.  
* Export:  
  * CSV export of movements and stock.

---

## **6\. Data model (indicative schema)**

Tables (simplified):

1. `users`  
   * id (PK)  
   * name  
   * email  
   * password\_hash  
   * role (ADMIN, STAFF)  
   * created\_at, updated\_at  
2. `wines`  
   * id (PK)  
   * name  
   * producer  
   * country  
   * region  
   * sub\_region  
   * grape\_varieties (JSON or text)  
   * vintage (integer)  
   * type  
   * volume\_ml (integer)  
   * sku  
   * current\_stock (integer, default 0\)  
   * min\_stock (integer, default 0\)  
   * is\_active (boolean)  
   * created\_at, updated\_at  
3. `wine_barcodes`  
   * id (PK)  
   * wine\_id (FK \-\> wines)  
   * barcode\_value  
   * barcode\_type (e.g., EAN\_13)  
   * UNIQUE(barcode\_value)  
4. `wine_images`  
   * id (PK)  
   * wine\_id (FK \-\> wines)  
   * image\_url  
   * is\_reference\_label (boolean)  
   * created\_at  
5. `inventory_sessions`  
   * id (PK)  
   * name  
   * location  
   * status (OPEN, CLOSED)  
   * created\_by (FK \-\> users)  
   * created\_at  
   * closed\_at  
6. `stock_movements`  
   * id (PK)  
   * session\_id (nullable FK \-\> inventory\_sessions)  
   * wine\_id (FK \-\> wines)  
   * user\_id (FK \-\> users)  
   * quantity\_change (integer)  
   * method (SEARCH, BARCODE\_SCAN, IMAGE\_RECOGNITION, OTHER)  
   * created\_at  
   * notes (nullable)  
   * external\_reference (e.g., AI API request id)  
7. `ai_recognition_logs`  
   * id (PK)  
   * user\_id  
   * session\_id (nullable)  
   * raw\_request\_metadata (JSON)  
   * raw\_response (JSON)  
   * created\_at

---

## **7\. API design (example endpoints)**

Authentication:

* POST `/api/auth/login`  
* POST `/api/auth/refresh`  
* POST `/api/auth/logout`

Users (admin):

* GET `/api/users`  
* POST `/api/users`  
* PATCH `/api/users/:id`

Wines:

* GET `/api/wines` (filters: search string, barcode, type, is\_active)  
* GET `/api/wines/:id`  
* POST `/api/wines` (admin)  
* PATCH `/api/wines/:id` (admin)  
* POST `/api/wines/:id/barcodes` (admin)

Inventory sessions:

* GET `/api/inventory-sessions`  
* POST `/api/inventory-sessions`  
* PATCH `/api/inventory-sessions/:id` (close, change name, etc.)  
* GET `/api/inventory-sessions/:id/movements`

Stock movements:

* POST `/api/stock-movements` with:  
  * wine\_id  
  * session\_id (optional)  
  * quantity\_change  
  * method  
  * notes  
* GET `/api/stock-movements` (with filters)

AI recognition:

* POST `/api/ai/recognize-label`  
  * Body: image file or base64.  
  * Backend calls external API (e.g., API4AI Wine Recognition).  
  * Response: list of candidate wines `{wine: {...}, confidence: 0.92}`.[api4+2](https://api4.ai/apis/wine-rec)

Barcode lookup:

* GET `/api/wines/by-barcode/:barcode`  
  * Return 0, 1, or many wines.

---

## **8\. Technology stack (suggested)**

Frontend:

* React with:  
  * React Router.  
  * State management (React Query, Zustand, or Redux).  
  * UI library for responsive design (MUI, Chakra UI, or TailwindCSS).  
* For barcode scanning:  
  * STRICH JS, Quagga2, or html5-qrcode integrated into React component.[strich+3](https://strich.io/)

Backend:

* Node.js \+ TypeScript with NestJS or Express.  
* ORM: Prisma or TypeORM connecting to PostgreSQL.

Infrastructure:

* PostgreSQL DB.  
* File storage:  
  * Cloud storage (S3-compatible) for label images and captured photos (if you decide to store them).  
* CI/CD pipeline for automated deploys.

AI/ML:

* External wine recognition API; no need to train own model initially.[rapidapi+2](https://rapidapi.com/api4ai-api4ai-default/api/wine-recognition2/details)  
* Optional later: fine-tune or build a custom classifier using your client’s own images via a service like Nyckel or similar if coverage is insufficient.\[[nyckel](https://www.nyckel.com/pretrained-classifiers/wine-brands/)\]​

---

## **9\. Security, logging, and compliance**

Security:

* Use HTTPS.  
* Validate all input at backend.  
* Implement role-based access control for admin vs staff.  
* Store passwords hashed with a strong algorithm (e.g., Argon2 or bcrypt).

Logging:

* Log:  
  * All logins and failed attempts.  
  * All stock movements: wine, user, quantity, method.  
  * All AI recognition requests and results (for debugging and audit).

Privacy:

* Don’t send personally identifiable information to AI providers.  
* Keep only necessary metadata for AI calls.

---

## **10\. Phased implementation plan**

Phase 1 – Core inventory by search:

* Implement auth, basic wine catalog, sessions, stock movements.  
* Implement mobile-responsive UI with search and quick add card.  
* Add basic reporting.

Phase 2 – Barcode scanning:

* Integrate JS barcode library into mobile web UI.[strich+3](https://strich.io/)  
* Implement backend endpoint for barcode lookup.  
* Add UI flow for scanning and quantity input.

Phase 3 – Image recognition (AI):

* Integrate external wine label recognition API on backend.[zylalabs+2](https://zylalabs.com/api-marketplace/machine+learning/wine+label+recognition+api/825)  
* Implement UI to capture image, call backend, disambiguate results.  
* Log recognitions and measure accuracy.

Phase 4 – Enhancements:

* Low-stock alerts and reorder suggestions.[gshnccommunitypartners+1](https://gshnccommunitypartners.org/blog/inventory-management-app-ui-design-1763346892296)  
* Multi-location stock.  
* Export and integrations (e.g., accounting or POS).

---

## **11\. Example UX wireframe elements (for your spec)**

* Top navigation (mobile):  
  * Left: app logo or session name.  
  * Right: user avatar (with logout).  
* Primary action bar:  
  * “Search” button.  
  * “Scan barcode” button.  
  * “Scan label” button.  
* Inventory list:  
  * Each row: wine name, vintage, current stock, location icon.  
* Action feedback:  
  * Small non-blocking toast: “+6 bottles of X added”.

---

If you want, next step I can turn this into a client-facing PDF-style specification with sections like “Scope”, “Assumptions”, “Non-functional requirements”, and more explicit acceptance criteria for each feature.

\# Mobile-First Web Inventory App for a Wine Restaurant

\#\# Problem framing and success criteria

A wine restaurant with 200+ distinct bottles typically suffers inventory errors for two reasons: identification friction (finding the exact bottle/variant fast enough) and transaction ambiguity (whether a change is a \*\*count\*\*, a \*\*receive\*\*, a \*\*consume\*\*, or an \*\*adjustment\*\*). A successful app must reduce identification time to “seconds per bottle” while producing an audit-grade, tamper-resistant trail of who changed what and when. citeturn1search11turn1search3

A realistic definition of success for this specific client looks like this:

\- \*\*Speed\*\*: bottle identification \+ quantity entry in one continuous flow; the UI should be optimized for one-handed mobile use, with minimal navigation depth.  
\- \*\*Accuracy\*\*: support \*\*variant disambiguation\*\* (same producer/wine name across different vintages, bottle sizes, or formats) and “confidence-based” image results (top match \+ alternatives when ambiguous).  
\- \*\*Accountability\*\*: every stock change is logged with actor, timestamp, device/session context, and before/after state or event payload, with integrity controls (append-only or equivalent). citeturn1search11turn1search3  
\- \*\*Operational resilience\*\*: usable on restaurant Wi‑Fi and in dead zones; at minimum, the UI shell and manual search should remain functional offline (with queued sync). Service-worker caching is the standard mechanism for offline capability in PWAs. citeturn1search2turn1search26  
\- \*\*Privacy & compliance (EU)\*\*: employee accounts, audit logs, and any captured photos can become personal data depending on context; the system must follow GDPR principles like data minimization and storage limitation and implement Data Protection by Design/Default. citeturn2search0turn2search5turn2search12

\#\# User experience and workflows

The usability bar here is not “looks nice,” it’s “works during service with wet hands, poor lighting, and zero patience.” Camera permissions, scan reliability, and disambiguation UX will make or break adoption.

image\_group{"layout":"carousel","aspect\_ratio":"16:9","query":\["mobile inventory scanning UI","barcode scanning web app UI mobile","wine bottle label scanner app UI","inventory count app mobile interface"\],"num\_per\_query":1}

\#\#\# Roles and permissions

You want three practical roles (you can extend later):

\- \*\*Admin\*\*: full CRUD of bottle catalog, barcode assignments, image reference set management, user management, retention settings, export.  
\- \*\*Manager\*\*: start/close inventory sessions, review variances, approve adjustments, view audit trail.  
\- \*\*Staff\*\*: perform counts/receives/adjustments within allowed sessions; view bottle details needed for disambiguation (producer, region, vintage, bottle size, barcode, label photo).

Enforce least privilege and keep permission checks server-side (never rely on UI-only gating). This is standard security hygiene, and it’s especially important if you later expose APIs to integrations. citeturn1search11turn1search3

\#\#\# Primary flows

\#\#\#\# Login and session start

\- On first load, show “Sign in” with either:  
  \- \*\*Passkeys\*\* (preferred modern option): passwordless, phishing-resistant, and works widely when served over HTTPS. citeturn5search2turn5search6turn5search18    
  \- Or email/password with strong hashing (Argon2id/scrypt/bcrypt per best practice). citeturn5search1turn5search17  
\- After login, the user lands on a \*\*single Home screen\*\* with two large actions:  
  \- \*\*Search & update\*\*  
  \- \*\*Scan & update\*\*

\#\#\#\# Search & update (manual typing)

This must be optimized for speed and tolerance of imperfect input:

\- Search box with “typeahead” results (debounced).  
\- Results show compact cards: \*(Producer \+ Wine Name \+ Vintage \+ Format \+ Location summary)\*.  
\- Tap a card → quantity entry panel with a numeric keypad and fast controls: \`+1\`, \`+3\`, \`+6\`, \`+12\`, plus a direct numeric field.  
\- User selects the \*\*transaction type\*\* up front:  
  \- “Count (set absolute)”  
  \- “Receive (add)”  
  \- “Consume/Breakage (subtract)”  
  \- “Adjustment (reason required)”  
    
This avoids the classic ambiguity where employees “add amount” but meant “I see 6 in the cellar.” It also makes the audit trail meaningful. citeturn1search11turn1search3

Under the hood, implement full-text search and fuzzy matching (typos). Native PostgreSQL full-text search uses \`tsvector\`/\`tsquery\` types for efficient search and ranking. citeturn4search2turn4search8

\#\#\#\# Scan & update (camera)

Camera access in browsers is done via \`MediaDevices.getUserMedia()\` (permission prompt required) and should only be requested after a clear user action (“Tap to scan”), not on page load. citeturn1search0turn1search9

Scanning mode offers two tabs:

\- \*\*Barcode\*\*  
\- \*\*Label photo (image recognition)\*\*

Both produce the same end-state: an identified bottle variant → compact card → amount entry → confirm.

\*\*Barcode scan UX:\*\*  
\- Live camera view with scan box overlay.  
\- Immediate haptic/audio feedback on successful decode (optional).  
\- If multiple internal matches exist, show them as a short list (vintage/format disambiguation) and require user confirm.

\*\*Label-recognition UX:\*\*  
\- Live camera preview with a “Capture label” button (or auto-capture when stable, optional).  
\- After capture, show:  
  \- Top match card with confidence indicator  
  \- “Other possible matches” list (max 5\)  
  \- “Not found? Create/update bottle” (permission-gated)

\#\# Technical architecture

A “simple CRUD app” will fail here because the hard parts are: camera capabilities across browsers, offline/poor connectivity, and image matching. The architecture below keeps those concerns isolated and lets you upgrade AI without rewriting the rest.

\#\#\# Reference architecture

\- \*\*Frontend\*\*: Mobile-first PWA (React/TypeScript recommended) with service worker caching for app-shell offline support. citeturn1search2turn1search26    
\- \*\*Backend API\*\*: Stateless API service (Node.js or Python) handling auth, RBAC, inventory events, and catalog CRUD.  
\- \*\*Database\*\*: PostgreSQL as system of record.  
  \- Full-text search for name queries (\`tsvector\`/\`tsquery\`). citeturn4search2turn4search8  
  \- Vector search for image embeddings via \`pgvector\` extension. citeturn4search0turn4search1  
\- \*\*Object storage\*\*: Bottle reference images \+ captured label photos (S3-compatible).  
\- \*\*Vision service\*\* (pluggable): one of:  
  \- Self-hosted embedding pipeline (CLIP-like) \+ pgvector  
  \- Managed product search / custom vision APIs  
\- \*\*Observability\*\*: centralized logs \+ security/audit event stream. OWASP explicitly calls out the need for audit trails with integrity controls (append-only or similar). citeturn1search11turn1search3

\#\#\# Offline strategy

You don’t need full offline parity on day 1, but you do need \*graceful degradation\*:

\- Cache the UI shell and static assets via service worker so the app loads even if the network drops. citeturn1search2turn1search26    
\- Queue inventory events locally when offline and sync when connectivity returns (background sync if available; otherwise “Sync now” prompt). MDN notes caching improves offline operation and responsiveness. citeturn1search2turn1search10  
\- Barcode scanning can still work locally if you use a JS/WASM decoder; label-recognition matching may require server inference unless you explicitly implement on-device inference.

\#\# Data model and auditability

If you want “proper log \+ DB integrity,” design around \*\*events\*\*, not just mutable counts.

\#\#\# Core entities

\- \*\*BottleVariant\*\*: the atomic item you track (producer, wine name, vintage, bottle size, packaging, barcode(s), reference images).  
\- \*\*Location\*\*: cellar, bar, shelf, offsite storage.  
\- \*\*InventorySession\*\*: a named counting window (e.g., “Weekly count Feb 2026”).  
\- \*\*InventoryEvent\*\* (append-only): each action creates one immutable row:  
  \- event\_type: COUNT\_SET, RECEIVE\_ADD, CONSUME\_SUBTRACT, ADJUST  
  \- delta or absolute\_count (depending on type)  
  \- actor\_user\_id  
  \- timestamps  
  \- device/session metadata  
  \- “reason” field for adjustments/breakage  
\- \*\*CurrentStock\*\* (derived): computed or materialized summary per BottleVariant × Location.

This design aligns with the security guidance that high-value transactions should have an audit trail with integrity controls, such as append-only tables. citeturn1search11turn1search3

Event sourcing is also a recognized pattern for keeping an immutable sequence of changes in an append-only log; it differs from a basic audit log because it is \*the source of truth\* and can rebuild state by replay. citeturn4search25turn4search9

\#\#\# Database implementation details

\- PostgreSQL tables:  
  \- \`bottle\_variants\`  
  \- \`barcodes\` (many-to-one to variants)  
  \- \`variant\_images\` (reference \+ captured, metadata, hashes)  
  \- \`inventory\_sessions\`  
  \- \`inventory\_events\` (append-only)  
  \- \`current\_stock\` (optional materialized projection)  
\- Search:  
  \- \`bottle\_variants.search\_tsv\` as a \`tsvector\` built from producer \+ wine name \+ region \+ vintage tokens. PostgreSQL’s docs describe \`tsvector\`/\`tsquery\` for full-text search. citeturn4search2turn4search8  
\- Image similarity:  
  \- \`variant\_images.embedding vector(...)\` using \`pgvector\`, which supports exact/approx nearest neighbor search and multiple distance metrics (cosine, L2, inner product). citeturn4search0turn4search1

\#\#\# Audit trail requirements

At minimum, log:

\- Authentication events (login, logout, failures)  
\- Inventory events (who changed what)  
\- Admin actions (catalog edits, barcode relinks, image deletions)  
\- Export actions (data exfiltration risk)

OWASP logging guidance emphasizes building proper logging mechanisms and protecting log integrity; it also flags not to log sensitive info unnecessarily. citeturn1search3turn1search34    
For broader log management practice (retention, analysis, storage, disposal), NIST provides enterprise log management guidance. citeturn2search3turn2search7

\#\# Computer vision and barcode strategy

This is where you need to be blunt: “Vivino-level” recognition is built on massive datasets and years of iteration. For \*\*a 200-bottle restaurant catalog\*\*, you can still deliver an excellent experience by controlling the problem: curated reference images, barcode-first flow, and embedding-based similarity search with human confirmation.

\#\#\# Barcode scanning in mobile web

\#\#\#\# Browser-native BarcodeDetector is not enough

The Barcode Detection API exists, but it’s marked experimental and (critically) Safari on iOS has no support in production. citeturn0search0turn7search1turn7search6    
So if your employees use iPhones (very likely), you must plan a fallback.

\#\#\#\# Practical options

\- \*\*Open-source JS decoding\*\*  
  \- ZXing ports exist for browser use. citeturn0search5turn0search1    
  \- QuaggaJS exists (and forks like Quagga2). citeturn0search2turn0search10  
\- \*\*Commercial Web SDKs (best reliability across iOS)\*\*  
  \- Some vendors provide WebAssembly-based web barcode SDKs with explicit Safari support; for example, Scanbot documents Safari 11+ support and iOS 14.5+ mobile browser support for its Web Barcode Scanner SDK. citeturn7search32    
  \- Enterprise-grade scanners like Scandit position their Web SDK as an AI-powered barcode solution (commercial). citeturn7search28

Recommendation for a restaurant: implement ZXing-based scanning first (fast to ship), validate on your target devices, and only move to a commercial SDK if iOS performance/focus makes open-source unreliable during service.

\#\#\# Identifying bottles by label photo

You need a hybrid approach: \*\*retrieve candidates by visual similarity\*\*, then \*\*confirm using text cues (OCR) \+ user selection\*\*.

\#\#\#\# Option A: Managed product visual search

Google’s Vision API Product Search supports creating a product catalog with reference images and then searching for visually similar products. citeturn0search3turn0search7    
This can work well if you:  
\- Create one “product” per BottleVariant  
\- Upload multiple viewpoints (front label, full bottle, neck label)  
\- Use “general” category for broad matching citeturn0search3

Trade-offs: recurring API cost, vendor lock-in, latency, and data residency considerations (important under GDPR).

\#\#\#\# Option B: Train a custom classifier

\- AWS offers Rekognition Custom Labels for training models that detect business-specific objects/logos/scenes using a relatively small labeled dataset (often a few hundred images). citeturn7search2turn7search5    
\- Microsoft’s Custom Vision can train image classification models via portal or SDK. citeturn7search3turn7search19

Trade-offs: you must collect labeled images; performance depends on label uniqueness and photo conditions. Custom training adds MLOps complexity.

\#\#\#\# Option C: Self-hosted embeddings \+ vector search (strong fit for 200 items)

This is the most controllable and typically the best price/performance for a small, fixed catalog:

\- Use a vision-language embedding model in the CLIP family (the original CLIP model was introduced by OpenAI and learns visual concepts from natural language supervision). citeturn3search8  
\- Compute an embedding for each reference image and store it in PostgreSQL using \`pgvector\`. citeturn4search0turn4search1  
\- For each captured label photo, compute its embedding and run \`top\_k\` similarity search.  
\- Present top candidates to the user for confirmation.

This is essentially a “private, restaurant-scale” version of image retrieval. If you want extra robustness, add an OCR pass and re-rank candidates by “does the extracted text resemble producer/name/vintage.”

If you need data to accelerate prototyping, public datasets exist with large collections of wine bottle images, such as a 100k+ image dataset published on Hugging Face for wine recognition tasks. citeturn3search0    
In production, you should primarily rely on \*\*your client’s own bottle photos\*\* to avoid licensing ambiguity and to match the actual labels/markets they stock.

\#\#\# AI enrichment and “smart catalog creation”

The biggest operational win is reducing admin time when adding new bottles.

A best-in-market workflow:

\- Admin scans barcode (if available) and/or captures label photo.  
\- System creates a draft BottleVariant:  
  \- Suggested producer/name/vintage extracted from label (vision/OCR)  
  \- Suggested “close matches” to prevent duplicates (vector \+ text search)  
\- Admin confirms/edits and saves.

If you use OpenAI for image understanding or text extraction, OpenAI’s API supports image inputs (“Images and vision” guide), and OpenAI provides explicit enterprise privacy and retention controls (default retention described as up to 30 days for abuse monitoring logs, with configurable controls for qualifying customers). citeturn8search1turn8search2turn8search3    
You should treat this as a configurable module: some clients will accept cloud AI; others will require self-hosted OCR/embedding.

\#\# Security, privacy, and compliance

\#\#\# Authentication and secure contexts

Camera and passkeys both require HTTPS/secure contexts in modern browsers. Camera access via \`getUserMedia()\` triggers a permission prompt. citeturn1search0turn5search2    
You should also follow permission UX best practices: request only after a user action and provide alternative paths (e.g., manual search) if permission is denied. citeturn1search9

For passwords (if you support them), NIST’s digital identity guidance specifies minimum lengths and encourages allowing long passphrases (up to at least 64 characters) and discourages arbitrary periodic password resets. citeturn5search4turn5search36    
For storage, OWASP recommends modern password hashing approaches; bcrypt is described as legacy when Argon2/scrypt are available. citeturn5search1

\#\#\# Logging, retention, and GDPR alignment

This app processes employee personal data (accounts, actions), so GDPR principles apply, especially:

\- \*\*Data minimization & storage limitation\*\*: do not keep logs, photos, or device metadata forever; define retention explicitly. citeturn2search0turn2search12    
\- \*\*Data protection by design & default\*\*: plan safeguards early (access controls, encryption, retention, least privilege). The EDPB’s guidance on GDPR Article 25 emphasizes implementing principles and safeguards by design and by default. citeturn2search5turn2search1    
\- CNIL guidance reiterates that personal data cannot be stored indefinitely and that retention must be defined by purpose. citeturn2search10turn2search6

OWASP also notes that audit trails for high-value actions should have integrity controls (e.g., append-only). citeturn1search11    
This matters because “inventory adjustments” can be financial fraud in practice.

\#\#\# Practical privacy controls to include in the product

\- Retention settings (admin-configurable):  
  \- Raw captured label photos: short retention unless needed for model improvement  
  \- Audit logs: longer retention, but still bounded  
\- Access scoping:  
  \- Only managers/admins can view full audit logs  
  \- Staff see only their own activity \+ what’s necessary to do the job  
\- Export governance:  
  \- Export endpoints require manager/admin role \+ explicit “export reason” event

If you integrate hosted AI services, document data flows and retention. For example, OpenAI documents default retention controls for API data (abuse monitoring logs retained up to 30 days by default) and enterprise privacy commitments. citeturn8search2turn8search3

\#\# Delivery plan and operating model

A deliverable “solution document” should map directly to build tasks and acceptance criteria. The plan below is optimized to ship value early while de-risking scanning and recognition.

\#\#\# Phase-based delivery

\*\*Phase A: Discovery \+ catalog ground truth\*\*  
\- Confirm how inventory is currently done (paper, spreadsheet, POS exports).  
\- Define BottleVariant identity rules (what makes a distinct item: vintage? bottle size? by-the-glass vs bottle?).  
\- Build the initial bottle catalog spreadsheet template and import pipeline.  
\- Decide barcode strategy:  
  \- Do bottles already have EAN-13/UPC? (common in retail; placement guidance exists in GS1 wine trade standards, but in practice you’ll just scan what’s printed). citeturn6search3turn6search36

\*\*Phase B: MVP (manual search \+ event logging)\*\*  
\- Auth \+ roles  
\- Bottle search (full-text) \+ “quick add” UI  
\- Inventory sessions and event model (append-only)  
\- Variance view for managers  
\- Exports (CSV) for accounting

This MVP already improves accuracy because it forces clear transaction types and creates an audit trail aligned with OWASP logging guidance. citeturn1search3turn1search11

\*\*Phase C: Barcode scanning\*\*  
\- Implement camera permissions flow with best practices. citeturn1search0turn1search9  
\- Integrate ZXing (or equivalent) barcode decoding. citeturn0search5turn0search1  
\- Field test on the restaurant’s real devices.  
\- If iOS focus/lighting issues cause failures, evaluate a commercial Web SDK with Safari support. citeturn7search32turn7search28

\*\*Phase D: Label recognition\*\*  
\- Start with embedding-based similarity:  
  \- Store embeddings in PostgreSQL \`pgvector\`. citeturn4search0turn4search1  
  \- Collect reference images per BottleVariant (minimum: front label \+ full bottle; better: multiple lighting conditions).  
\- Add OCR-assisted re-ranking (optional) and disambiguation list UX.  
\- Add admin tooling to manage reference images and override mappings.

\*\*Phase E: Best-in-market enhancements\*\*  
\- Passkeys rollout (reduce password resets and phishing risk). citeturn5search6turn5search2  
\- Offline “queue and sync” for inventory events; service worker caching for app shell. citeturn1search2turn1search26  
\- “Smart add bottle” wizard using AI vision extraction (if approved by client’s privacy posture). citeturn8search1turn8search2  
\- Advanced analytics:  
  \- shrinkage rate (breakage/adjustments)  
  \- inventory aging by session-to-session variance

\#\#\# Operating considerations you should put in the solution doc

\- \*\*Device matrix\*\*: define supported phones/browsers explicitly; BarcodeDetector is not available on iOS Safari, so you must test your chosen library on iPhone hardware early. citeturn7search1turn7search6  
\- \*\*Image capture standards\*\*: provide a simple “how to photograph labels” guide for the staff/admin who maintains the catalog.  
\- \*\*Model lifecycle\*\* (if doing embeddings or custom ML):  
  \- how new bottles get added  
  \- how misidentifications are corrected (feedback loop)  
  \- how you prevent duplicates  
\- \*\*Log review & incident response\*\*: CNIL and NIST both emphasize the value of log review and incident preparedness; treat logs as an operational asset, not a checkbox. citeturn2search2turn2search3  
