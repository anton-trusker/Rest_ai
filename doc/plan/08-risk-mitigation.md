# 08 — Risk Mitigation & Impact Analysis

## 1. Change Impact Analysis

Transitioning from a Wine-Specific app to a Universal Syrve-First system impacts several existing features:

| Feature | Impact | Mitigation Strategy |
|---------|--------|---------------------|
| **Product Model** | High: `wines` table becomes `products`. | Create migration script to map existing wine data to the new generic schema. |
| **Search/Filter** | Medium: Filters must become dynamic based on Syrve categories. | Implement a category tree component that builds itself from the `categories` table. |
| **Units** | Medium: ML/Bottles replaced by Syrve units (kg, шт, etc.). | Adapt the Quantity Entry UI to show the specific `unit_name` from Syrve. |
| **User Flows** | Low: Core counting flow remains similar. | Enhance the flow with location-based counting and additive logic. |

---

## 2. Risk Mitigation Strategies

| Risk | Probability | Impact | Mitigation Plan |
|------|-------------|--------|-----------------|
| **Syrve API Downtime** | Medium | High | Implement a robust local cache (Supabase). Allow inventory counting to proceed even if Syrve is offline. |
| **Inaccurate AI Matching** | High | Low | Always treat AI results as "suggestions." Require user confirmation and provide a fast fallback to manual search. |
| **Data Synchronization Conflicts** | Low | Medium | Use a "Last Write Wins" strategy for product data, but an "Additive" strategy for inventory counts. |
| **Offline Data Loss** | Low | Critical | Use `IndexedDB` (via `idb-keyval` or `zustand-persist`) for persistent local storage of counts before sync. |
| **API License Limits** | Medium | Medium | Use the "Login-Operate-Logout" pattern in Edge Functions to minimize session duration in Syrve. |

---

## 3. Measurable Success Criteria

To evaluate the success of the implementation, the following KPIs will be tracked:

### Technical KPIs
- **Sync Speed**: Product sync (1000 items) completes in under 30 seconds.
- **Offline Reliability**: 100% of counts recorded offline successfully sync when online.
- **AI Accuracy**: Top-3 suggestions include the correct product in >90% of cases.

### Business KPIs
- **Counting Time**: Average time to complete a full inventory reduced by 30% compared to manual/paper methods.
- **Data Accuracy**: Discrepancies between app counts and Syrve records reduced by 50% due to barcode scanning.
- **Adoption Rate**: 100% of staff trained on the app within the first week of deployment.

---

## 4. Emergency Procedures

### "Kill Switch" Feature Flags
The system includes a Feature Flag dashboard allowing the Super Admin to instantly disable problematic modules (e.g., "Disable Syrve Commit" if a bug is found in the XML generation).

### Manual Sync Override
If the scheduled sync fails, Admins can trigger a "Force Full Sync" which bypasses delta checks and re-downloads all product data.

### Support Logs
A dedicated `system_errors` table captures detailed stack traces and context for all Edge Function failures, enabling rapid debugging by the development team.
