# 08 — Feature Flags System

## 8.1. Overview
The **Feature Flags System** is a platform-wide mechanism for controlled feature rollout, A/B testing, and operational toggling. It allows administrators to enable or disable specific functionalities without code deployments, scoped at either the **Platform (Global)** or **Business (Tenant)** level.

---

## 8.2. Core Implementation Strategy

### 8.2.1. Persistence Layer
Feature flags are stored in the `feature_flags` table:
- `id`: UUID (Primary Key)
- `business_id`: UUID (Foreign Key, nullable for global flags)
- `flag_key`: Text (Unique identifier, e.g., `ai_label_recognition`)
- `is_enabled`: Boolean
- `description`: Text (Purpose of the flag)
- `metadata`: JSONB (For complex flag logic like percentage rollouts or specific user IDs)

### 8.2.2. Frontend Integration
The application uses a centralized `useFeatureFlags` hook that:
1.  Fetches active flags from Supabase on application load.
2.  Subscribes to real-time changes using Supabase Realtime.
3.  Provides a simple `isEnabled(flagKey)` helper for conditional rendering.

---

## 8.3. List of Feature Flags

### 8.3.1. Core Modules
| Flag Key | Description | Impact |
|:---|:---|:---|
| `module_ai_recognition` | Toggles the AI label scanning feature. | Hides/Shows "AI Scan" button in inventory count. |
| `module_syrve_integration` | Toggles all Syrve-related sync features. | Disables Syrve settings and sync buttons. |
| `module_advanced_reports` | Toggles financial and variance analytics. | Hides/Shows the "Reports" module in sidebar. |
| `module_offline_mode` | Enables/Disables IndexedDB caching for offline. | Affects data persistence strategy in the count view. |

### 8.3.2. Administrative Controls
| Flag Key | Description | Impact |
|:---|:---|:---|
| `admin_approval_workflow` | Forces admin review before POS sync. | Changes "Submit" behavior to "Pending Review". |
| `admin_custom_ai_keys` | Allows businesses to provide their own API keys. | Hides/Shows API key input in settings. |
| `admin_multi_location` | Enables sub-location and rack mapping. | Toggles location hierarchy complexity. |

### 8.3.3. UI/UX Features
| Flag Key | Description | Impact |
|:---|:---|:---|
| `ui_modern_dashboard` | Toggles the experimental v2 dashboard UI. | Switches root `/dashboard` component. |
| `ui_visual_bottle_slider` | Enables the decimal/slider UI for partials. | Changes the quantity entry method for opened items. |

---

## 8.4. Future Development Guidelines
1.  **Flag First**: Every new significant feature must be developed behind a feature flag.
2.  **Naming Convention**: Use prefixes like `module_`, `admin_`, or `ui_` for clarity.
3.  **Cleanup**: Flags for fully rolled-out features should be removed from the code (but kept in history) within 3 months of 100% adoption.

---

## 8.5. Management Interface
The **Super Admin Panel** provides a master toggle for these flags across all businesses, while the **Business Settings** allows local Admins to toggle flags permitted for their subscription level.
