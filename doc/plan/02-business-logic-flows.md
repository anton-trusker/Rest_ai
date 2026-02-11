# 02 — Business Logic Flows

## 1. Syrve Connection & Authentication Flow

Before any inventory operations can occur, the Admin must establish a secure link with the Syrve server.

```mermaid
flowchart TD
    A[Admin opens Settings > Syrve Connection] --> B[Enter Server URL, Login, Password]
    B --> C{Click 'Test Connection'}
    C --> D[Edge Function: syrve-connect-test]
    D --> E{Syrve /auth Success?}
    E -- No --> F[Show Error: Invalid Credentials/URL]
    E -- Yes --> G[Fetch Store List from Syrve]
    G --> H[Return Stores & Server Info to Frontend]
    H --> I[Admin selects 'Active Store']
    I --> J{Click 'Save Configuration'}
    J --> K[Encrypt Password & Save to syrve_config]
    K --> L[Connection Established ✅]
```

---

## 2. Product Synchronization Logic (Syrve → App)

Synchronizing data involves a hierarchical update to ensure categories exist before products are mapped to them.

```mermaid
flowchart TD
    Start[Trigger Product Sync] --> Auth[Authenticate with Syrve]
    Auth --> FetchCat[Fetch Product Groups]
    FetchCat --> LoopCat{Loop Categories}
    LoopCat --> UpsertCat[Upsert Category in DB]
    UpsertCat --> LoopCat
    LoopCat -- Done --> FetchProd[Fetch All Products]
    FetchProd --> LoopProd{Loop Products}
    LoopProd --> MapCat[Resolve category_id via syrve_group_id]
    MapCat --> UpsertProd[Upsert Product & Barcodes]
    UpsertProd --> LoopProd
    LoopProd -- Done --> Deactivate[Deactivate Products missing in Syrve]
    Deactivate --> Log[Log Sync Results & Duration]
    Log --> End[Sync Complete ✅]
```

---

## 3. Inventory Counting Session (Staff Workflow)

The physical counting process is designed for speed and accuracy in high-pressure environments.

```mermaid
flowchart LR
    Start([Start Count]) --> Setup[Setup: Select Location & Category]
    Setup --> Mode{Recognition Mode}
    Mode -- Scan --> Barcode[Scan Barcode]
    Mode -- AI --> Vision[Capture Photo]
    Mode -- Manual --> Search[Search by Name/SKU]
    
    Barcode --> Lookup[Lookup Product in DB]
    Vision --> Recognize[AI Recognize Product]
    Search --> Select[User Selects Product]
    
    Lookup --> Found{Found?}
    Recognize --> Match{Match?}
    
    Found -- Yes --> Qty[Enter Quantity & Unit]
    Match -- High Confidence --> Qty
    Match -- Low Confidence --> Search
    Found -- No --> Search
    
    Qty --> Save[Save inventory_item]
    Save --> More{More items?}
    More -- Yes --> Mode
    More -- No --> Summary[Review Session Summary]
    Summary --> Finish([Finish Counting])
```

---

## 4. Session Review & Syrve Commitment (Admin Workflow)

The final step bridges the gap between the app's counted values and Syrve's inventory management.

```mermaid
flowchart TD
    Start[Admin Opens Session Review] --> List[View All Session Items]
    List --> Variance[Check Variance against Expected Stock]
    Variance --> Decision{Approve or Flag?}
    
    Decision -- Flag --> Notes[Add Notes & Send back to Staff]
    Notes --> List
    
    Decision -- Approve --> Status[Set Session Status: Completed]
    Status --> Stock[Update Local Product Stock Levels]
    
    Stock --> Syrve{Send to Syrve?}
    Syrve -- Yes --> Commit[Edge Function: syrve-inventory-commit]
    Commit --> XML[Generate Syrve XML Document]
    XML --> Post[POST to Syrve /import/incomingInventory]
    Post --> SyncStatus[Update Session Syrve Sync Status]
    
    Syrve -- No --> End[Process Complete]
    SyncStatus --> End
```

---

### 2.2 Counting & Entry Logic
1.  **Item Identification**: Scan barcode OR Search by Name/SKU OR AI Label Recognition.
2.  **Variant Selection**: If item has variants (e.g., Size, Vintage), user selects the specific variant.
3.  **State Selection**: 
    -   **Full/Unopened**: Enter integer quantity.
    -   **Partial/Opened**: Enter decimal (e.g., 0.5) or use visual "slider" for bottle fill level.
4.  **Local Save**: Immediate save to Zustand/IndexedDB.
5.  **Conflict Resolution**: If same item counted by another user, prompt for "Merge", "Overwrite", or "Keep Both" (session-based).

### 2.3 AI Recognition Flow
1.  **Trigger**: User clicks "AI Scan" button.
2.  **Capture**: Mobile camera captures label/bottle.
3.  **Process**: 
    -   Client-side compression.
    -   Edge Function: OCR + Feature Extraction.
    -   Matching: Search Supabase `products` then Syrve local cache.
4.  **Verification**: User confirms matched item.
5.  **Learning**: System logs match confidence for future model fine-tuning.
