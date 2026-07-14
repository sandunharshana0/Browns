# Browns Engineering ERP — Phased MVP Implementation Roadmap

## Excel → PostgreSQL Migration Strategy

---

## Phase 0: Foundation & Infrastructure (Week 1-2)

### 0.1 Environment Setup
- [ ] Provision PostgreSQL database (local dev + production)
- [ ] Configure `DATABASE_URL` in `.env` / `prisma.config.ts`
- [ ] Run `npx prisma migrate dev --name init` to apply schema
- [ ] Verify Prisma client generation succeeds

### 0.2 Seed Reference Data
- [ ] Create seed script `prisma/seed.ts` with:
  - Admin user credentials
  - Project codes lookup
  - Vehicle type enums
- [ ] Run `npx prisma db seed`

### 0.3 Authentication Scaffold
- [ ] Implement NextAuth.js or iron-session for login
- [ ] Role-based access: Admin, Supervisor, Driver, Viewer
- [ ] Login page at `(auth)/login`

---

## Phase 1: Master Data Import (Week 3-4)

### 1.1 Employee Master (Sheet 1 → `Employee` table)
- [ ] Build CSV parser utility for Excel exports (`src/utils/csv-parser.ts`)
- [ ] Map columns: `empNo`, `category`, `teamName`, `region`, `nameWithInitials`, etc.
- [ ] Implement deduplication on `idNo` (unique constraint)
- [ ] Admin UI: DataTable with search, filter by category/status
- [ ] Bulk CSV upload via drag-and-drop

### 1.2 Vehicle Master (Sheet 5 → `Vehicle` table)
- [ ] CSV import for vehicle registry
- [ ] Link `driverEmpNo` to `Employee.empNo` (FK validation)
- [ ] Admin CRUD page

### Validation Gates
- [ ] Reject CSV rows where `idNo` already exists
- [ ] Warn on missing `projectCode` references
- [ ] Log all import errors with row numbers

---

## Phase 2: Transactional Modules (Week 5-8)

### 2.1 Daily Running Log (Sheet 6 + Sheet 9)
- [ ] API: `POST /api/running-logs` with constraint check:
  - `today.onMeterReading >= yesterday.endMeterReading` (per vehicle)
- [ ] Mobile-friendly form for field data entry
- [ ] Dashboard: Vehicle Running Chart with month filter

### 2.2 Fuel Transactions (Sheet 7)
- [ ] API: `POST /api/fuel` with cross-verification:
  - Fuel `meterReading` BETWEEN day's `onMeterReading` AND `endMeterReading`
- [ ] Real-time amount calculation: `amount = literPrice * liters`
- [ ] Link fuel card numbers to vehicle

### 2.3 Daily Attendance (Sheet 2)
- [ ] API: `POST /api/attendance/bulk` (transactional upsert)
- [ ] Tabular calendar grid UI
- [ ] Client filter: Dialog / Mobitel / SLT
- [ ] Weekly & monthly summary exports

### 2.4 Teams Plan & Progress (Sheet 3)
- [ ] Supervisor mobile form: plan work scope in AM, log actual in PM
- [ ] Reason-for-non-completion dropdown
- [ ] DailyProgress sub-table cascade

### 2.5 Petty Cash (Sheet 4)
- [ ] Advance request workflow: request → admin approve → disburse
- [ ] Auto-calculated balance: `submittedAmount - amount = balance`
- [ ] Cash return reconciliation form
- [ ] PettyCashLedger running balance

### 2.6 Utility Bills (Sheet 8)
- [ ] Vertical logging form
- [ ] Link to Petty Cash via `projectCode`
- [ ] Bill type: Electricity / Water radio

---

## Phase 3: Interactive Dashboard Views (Week 9-10)

### 3.1 Vehicle Running Chart Matrix
- [ ] Month grid: 1-31 columns, KM + Fuel rows
- [ ] Graceful `#DIV/0!` handling: show `-` when no activity
- [ ] Dynamic vehicle selector

### 3.2 Attendance Matrix
- [ ] Calendar heatmap: employee rows × day columns
- [ ] Color-coded cells: Present (green), Leave (yellow), Day Off (gray)

### 3.3 Operational KPIs
- [ ] Cards: Active employees, Active vehicles, Today attendance %
- [ ] Pending petty cash approvals count

---

## Phase 4: CSV Data Migration Protocols (Week 11-12)

### 4.1 ETL Scripts
```
prisma/
  etl/
    import-employees.ts
    import-vehicles.ts
    import-attendance.ts
    import-running-logs.ts
    import-fuel.ts
    import-petty-cash.ts
```

Each script:
1. Read CSV from `data/import/<module>/`
2. Validate with Zod schema
3. Transform (date normalization, enum mapping)
4. Insert via Prisma transaction
5. Generate `data/import/<module>/errors.csv` for failures

### 4.2 Idempotency Strategy
- Use `upsert` for Employee (by `idNo`) and Attendance (by `date+employeeNo`)
- Use `skipDuplicates: true` for bulk creates
- Maintain import audit log table

### 4.3 Dry-Run Mode
- `--dry-run` flag: validate all rows without inserting
- Report: `{"total": 500, "valid": 480, "errors": 20, "errorRows": [...]}`

---

## Phase 5: Production Hardening (Week 13-14)

### 5.1 Security
- [ ] CORS policies for API routes
- [ ] Rate limiting on mutation endpoints
- [ ] Input sanitization (Zod strict mode)
- [ ] HTTPS enforcement

### 5.2 Performance
- [ ] Database indexes on `date`, `vehicleNo`, `projectCode`, `employeeNo`
- [ ] React Query caching with stale-while-revalidate
- [ ] Pagination for large datasets (cursor-based)

### 5.3 Monitoring
- [ ] Error boundary at route group level
- [ ] API request logging middleware
- [ ] Database connection pool limits

---

## Technology Decision Records

| Concern | Choice | Rationale |
|---------|--------|-----------|
| ORM | Prisma | Type-safe, auto-generated client, migrations |
| UI Framework | Shadcn/ui + Radix | Accessible, composable, tree-shakeable |
| State Fetching | TanStack Query | Caching, optimistic updates, devtools |
| Validation | Zod v4 | Runtime type safety, inferred TS types |
| CSS | Tailwind v4 | Utility-first, consistent design tokens |
| Fonts | Geist (Vercel) | Low CLS, matches modern design |
| DB | PostgreSQL | Relational integrity, JSON support, robust |

---

## Excel-to-System Field Mapping Reference

| Excel Sheet | Table | Key Mapping |
|-------------|-------|-------------|
| 1 - Staff Master | Employee | `empNo` → PK, `idNo` → Unique |
| 2 - Attendance | Attendance | `date+employeeNo` → Composite Unique |
| 3 - Teams Plan | TeamsPlan | `id` → PK, `supervisorNo` → FK→Employee |
| 3 - Progress | DailyProgress | `teamsPlanId` → FK→TeamsPlan |
| 4 - Petty Cash | PettyCashAdvance | `referenceNo` → PK |
| 4 - Ledger | PettyCashLedger | `advanceRefNo` → FK→PettyCashAdvance |
| 5 - Fleet | Vehicle | `vehicleNo` → PK |
| 6 - Running Log | DailyRunningLog | `date+vehicleNo` → Composite Unique |
| 7 - Fuel Log | FuelTransaction | `id` → PK |
| 8 - Utilities | UtilityBill | `refNo` → PK |

---

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Set DATABASE_URL=postgresql://user:pass@host:5432/browns_erp

# 2. Apply schema
npx prisma migrate dev --name init

# 3. Seed reference data
npx prisma db seed

# 4. Import legacy data (Phase 4 scripts)
npx tsx prisma/etl/import-employees.ts --file ./data/employees.csv

# 5. Start dev server
npm run dev
```
