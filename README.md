# Expense Tracker — Frontend

A personal finance web app for tracking income and expenses, built with Vue 3 and TailwindCSS v4. Connects to a REST API backend.

---

## Features

### Dashboard

- **Summary cards** — Income, Expenses, Net Balance, and Savings Rate for the selected period
- **Period filter** — 7 preset ranges: This Month, Last Month, Last 3/6 Months, This Year, This FY, Last FY (Indian financial year Apr–Mar)
- **Top Categories** — Progress-bar widget showing top 5 expense and income categories side by side
- **Charts** (ApexCharts):
  - Expense breakdown by category (donut)
  - Income vs Expense over time (bar)
  - Expense breakdown by payment method (donut)
- **Recent Transactions** list with quick links
- Full **skeleton loaders** on initial load; overlay spinner on period switch

### Transactions

- Paginated transaction list with **server-side filtering** by:
  - Type (income / expense)
  - Category
  - Payment method
  - Date range
- Collapsible filter panel on mobile; always-visible on desktop
- Active filter count badge
- **Add / Edit** transactions via a modal form (amount, type, category, payment method, date, notes)
- **Delete** with confirmation dialog
- **CSV export** of the current filtered result set
- Responsive: table layout on desktop, card layout on mobile

### Settings

- **Categories** — Create, rename (inline), and delete custom transaction categories
- **Payment Methods** — Create, rename (inline), and delete payment methods (e.g. Cash, UPI, Credit Card)

### Profile

- View account details (name, email, phone, member since)
- Edit first name, last name, and email with Zod-validated form
- Change password with current-password verification
- Delete account with confirmation

### Auth

- Phone + OTP login flow
- Profile setup on first login (name, email)
- Route guards — protected pages redirect to login; authenticated users are redirected away from login

### UX

- **Dark mode** — class-based, persisted across sessions
- **Mobile-first** layout with bottom navigation bar and floating action button for adding transactions
- **Toast notifications** for success and error feedback
- Responsive sidebar navigation on desktop

---

## Tech Stack

| Layer | Library / Tool |
| --- | --- |
| Framework | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| Language | TypeScript |
| Build | [Vite 7](https://vitejs.dev/) |
| Styling | [TailwindCSS v4](https://tailwindcss.com/) |
| State Management | [Pinia](https://pinia.vuejs.org/) |
| Routing | [Vue Router 5](https://router.vuejs.org/) |
| HTTP Client | [Axios](https://axios-http.com/) |
| Forms & Validation | [VeeValidate](https://vee-validate.logaretm.com/) + [Zod](https://zod.dev/) |
| Charts | [ApexCharts](https://apexcharts.com/) via [vue3-apexcharts](https://github.com/apexcharts/vue3-apexcharts) |
| Utilities | [@vueuse/core](https://vueuse.org/) (breakpoints, composables) |
| Linting | ESLint + [oxlint](https://oxc.rs/docs/guide/usage/linter) |
| Formatting | Prettier |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the backend API

### Setup

```bash
# Install dependencies
npm install

# Create environment file — set VITE_API_BASE_URL to your backend URL
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

### Development

```bash
npm run dev
```

The dev server proxies `/v1` requests to `http://localhost:8000` (configurable in `vite.config.ts`).

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Type Check & Lint

```bash
npm run type-check
npm run lint
```

---

## Deployment (GitHub Pages)

The app is pre-configured for hosting at `/<repo-name>/` on GitHub Pages (`base: '/expense-web/'` in `vite.config.ts`).

A `public/404.html` redirect shim handles deep-link refreshes so Vue Router routes work correctly after deploy.

Set the following repository secret before running the deploy workflow:

| Secret | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Production API base URL |
