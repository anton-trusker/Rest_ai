# Inventory Management System — Application Scope

## Purpose

This folder contains the **detailed scope documentation** for the Universal Inventory Management System. The system supports **any product category** — not just wine. All product data, categories, and organizational structure are sourced from **Syrve (iiko)** as the master system.

> **Key Principle**: Syrve is the source of truth for all product data. The app is a powerful inventory counting and tracking layer on top of Syrve.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Application Architecture & Data Flow](./01-architecture-data-flow.md) | System architecture, Syrve-driven data model, state management, end-to-end data flow |
| 02 | [Data Model & Business Rules](./02-data-model-business-rules.md) | Products, categories, dynamic attributes, Syrve config storage, entity relationships |
| 03 | [Syrve Integration Logic](./03-syrve-integration.md) | Admin connection setup, test button, initial data pull, product sync, inventory exchange |
| 04 | [Inventory Process & Collaborative Counting](./04-inventory-process.md) | Session lifecycle, scanning, collaborative counting, variance, approval flow |
| 05 | [AI Recognition Engine](./05-ai-recognition.md) | Image capture, Vision API, category-aware matching, confidence scoring |
| 06 | [UI/UX Improvements & Proposed Features](./06-ui-improvements.md) | Syrve connection page, dynamic catalog, proposed enhancements |
| 07 | [Implementation Roadmap](./07-roadmap.md) | Phased plan with Syrve-first approach |

---

## Core Design Principles

1. **Syrve-First** — All products, categories, prices, and units come from Syrve. No manual product creation in the app unless disconnected.
2. **Category-Agnostic** — The app works with ANY product type: wine, spirits, beer, food, supplies — whatever Syrve provides.
3. **Admin-Configurable** — Syrve server address, credentials, store selection — all configured via UI by admin. Zero hardcoded values.
4. **Connection Verification** — Admin can test the Syrve connection before saving, ensuring credentials work.
5. **Additive Collaborative Counting** — Multiple users count simultaneously; quantities are summed per session.
6. **Stock Hiding from Staff** — Staff cannot view current stock to prevent confirmation bias.
7. **API License Management** — Syrve API tokens are acquired → used → immediately released.
8. **Data Stored Locally** — After initial sync, product data is stored in Supabase for fast access and offline capability.

---

## Current State Summary

| Aspect | Status |
|--------|--------|
| **Frontend** | ✅ Built (React 18 + TypeScript + Vite), currently wine-specific — needs generalization |
| **State Management** | ⚠️ Zustand with mock data — not connected to Supabase |
| **Supabase Schema** | ⚠️ Defined but wine-specific — needs refactoring to generic products |
| **Syrve Integration** | ❌ Not implemented — admin config UI and Edge Functions needed |
| **AI Recognition** | ❌ Not implemented — needs category-aware approach |
| **Barcode Scanning** | ⚠️ Partially implemented — html5-qrcode works, lookup uses mock data |
| **Admin Syrve Config** | ❌ Not built — no connection setup page exists |

---

## What Changes from Wine-Specific to Universal

| Aspect | Before (Wine-Only) | After (Universal) |
|--------|--------------------|--------------------|
| **Data Source** | Manual entry + CSV import | Syrve product sync (primary) |
| **Product Table** | `wines` with fixed wine fields | `products` with dynamic category attributes |
| **Categories** | Hardcoded: red, white, rosé, sparkling | Dynamic: synced from Syrve product groups |
| **Attributes** | Fixed: grape, vintage, region, ABV | Dynamic: category-specific attributes from Syrve |
| **Item Creation** | Admin creates in app | Products synced from Syrve; app is consumer |
| **Configuration** | `.env` file | Admin UI → stored in `syrve_config` table |
| **Connection** | Assumed working | Admin tests + verifies before saving |
| **AI Recognition** | Wine-label specific | Generic product recognition (label, package, shelf) |
