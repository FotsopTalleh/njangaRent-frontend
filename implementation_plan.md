# Admin Dashboard UI Revamp

This plan outlines the steps to restructure the Admin Dashboard to match the provided screenshot, while utilizing the existing backend APIs to fetch actual data from Supabase/Clerk.

## User Review Required

> [!IMPORTANT]  
> The backend `adminApi.getDashboard` does not currently return a month-by-month revenue breakdown. I will implement the chart using `recharts` with a placeholder dataset for the monthly trends, while the top-level stats will use real data. Let me know if you plan to update the backend to return monthly revenue data later!

## Proposed Changes

### 1. `src/routes/_admin.admin.dashboard.tsx`
We will completely overhaul the layout of the dashboard to match the screenshot.

- **Top Row (4 Cards):**
  - Total Users: Maps to `stats.activeUsers`.
  - Active Providers: Currently we lack a specific `activeProviders` count in `AdminStats`, so we will display `stats.activeListings` or total landlords.
  - Total Listings: Maps to `stats.activeListings`.
  - FCFA Processed: Maps to `stats.paymentsThisMonthXaf`.
- **Middle Row (Charts & Pending Actions):**
  - **Revenue Chart:** Implemented using `recharts` `<BarChart>` and `<Bar>` with customized `radius` and colors to match your app's scheme (`#1B4332` for primary, and orange for the current month).
  - **Pending Actions:** A custom widget displaying `pendingVerifications`, `pendingListings` (or just `activeListings`), and `flaggedListings` with badges.
- **Bottom Row (Recent Provider Applications):**
  - We will use `useQuery` to fetch `adminApi.getLandlordVerifications(1, 5)` and render a list of the 5 most recent pending landlord applications, complete with their initials avatar, name, location, date, and a "Review" button that links to `/admin/verifications/landlords`.

### 2. `src/components/ui/` Updates
If necessary, we will create or modify small UI components (like badges or customized cards) to ensure they look exactly like the premium, glassmorphism-inspired design in the screenshot.

## Verification Plan
1. Ensure the new dashboard layout matches the screenshot's spacing, hierarchy, and typography.
2. Verify that `recharts` renders the bar chart correctly without errors.
3. Verify that the pending verifications correctly pull from `adminApi.getLandlordVerifications()`.
