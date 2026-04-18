

# Campaign Overview Page — Visual & Layout Overhaul

## Bugs & Issues Found

1. **Tiny fonts everywhere** — KPI labels at `text-[10px]`, section titles `text-xs`, values `text-lg`. Inconsistent with other modules (Deals/Contacts use `text-sm`/`text-base`/`text-xl`).
2. **Cramped spacing** — `gap-2`, `p-2`, `py-2` headers feel squeezed. Other modules use `gap-4`/`p-4`/`py-3`.
3. **Weak boundaries** — All cards use the same plain `border` with no color accent. The dashboard list page (`CampaignDashboard.tsx`) already uses colored `border-l-4` accents — overview doesn't match.
4. **No color in KPIs** — All 6 KPI cards are monochrome muted gray. Dashboard uses indigo/emerald/blue/amber/slate colored icon tiles + colored values.
5. **Width not used** — Container has `p-4 pt-2 pb-3` from parent (CampaignDetail line 218) and child uses default — wide screens (1558px) leave huge empty bottom space and KPI strip looks stretched-thin without visual weight.
6. **Campaign Details section is plain text** — labels and values stacked weirdly ("Type ... Cold Outreach" with huge gap, "Region" badges floating right). Looks like a config dump not a polished detail card.
7. **Recent Activity rows are too dense** — `text-xs` with `h-4` badges, single-line cramped, hard to scan.
8. **Contact Funnel bars are 2px thin** (`h-2`) — barely visible.
9. **No section icons with color** — icons all `text-muted-foreground`, no hierarchy.
10. **Outreach Timeline chart hidden** — only shows when ≥3 weeks of data; should always show with empty state.
11. **No visual separation** between KPI strip, charts, and details — everything blends.

## Improvements Plan — `src/components/campaigns/CampaignOverview.tsx`

### A. KPI Strip (top row)
- Increase card padding to `p-4`, gap to `gap-3`
- Add colored `border-l-4` accents per KPI (matching dashboard convention):
  - Accounts → `border-l-blue-500` + blue icon tile
  - Contacts → `border-l-emerald-500` + emerald icon tile
  - Outreach → `border-l-purple-500` + purple icon tile
  - Responses → `border-l-amber-500` + amber icon tile
  - Deals → `border-l-indigo-500` + indigo icon tile
  - Setup → `border-l-rose-500` + rose icon tile
- Icon in a colored rounded tile (`h-10 w-10 rounded-lg bg-{color}-100`) like dashboard
- Label `text-xs uppercase tracking-wide`, Value `text-2xl font-bold`, sub `text-xs`
- Add subtle `hover:shadow-md transition-all`

### B. Contact Funnel card
- Title `text-base font-semibold` with colored Users icon (emerald)
- Stage rows: bar height `h-3`, label `text-sm`, count `text-sm font-medium tabular-nums`
- Color-coded stage bars: Not Contacted (slate), Contacted (blue), Responded (amber), Qualified (purple), Converted (emerald)
- Card padding `p-5`, header `pb-3`

### C. Recent Activity card
- Title `text-base font-semibold` with colored MessageSquare icon (purple)
- Each row: `py-2`, type badge color-coded by communication type (Email=blue, Call=green, LinkedIn=indigo)
- Contact name `text-sm font-medium`, snippet `text-sm text-muted-foreground`
- Row hover: `hover:bg-muted/50 rounded-md`
- Add divider lines between rows for clarity

### D. Outreach Timeline
- Always render (with empty state "No outreach activity yet")
- Increase height `h-[180px]`, axis ticks `fontSize: 12`
- Header same `text-base font-semibold` + colored BarChart3 icon (indigo)

### E. Campaign Details card — major restructure
- Two-column responsive grid using proper definition-list styling:
  - Left col: Type, Status, Region (with badge wrapping)
  - Right col: Description, Goal, Notes (multi-line text blocks with bg-muted/30 rounded boxes)
- Each detail block: label `text-xs uppercase tracking-wide text-muted-foreground mb-1`, value `text-sm`
- Status badge larger `h-6 px-2.5 text-xs`
- Region badges `h-6 px-2.5 text-xs` with subtle background color

### F. Layout & spacing
- Container: `space-y-4 p-1` (parent already pads)
- Use `grid-cols-12` for charts row to better balance Funnel (col-span-7) + Activity (col-span-5)
- Ensure the page fills available width — remove unnecessary `max-w` constraints
- Update parent `CampaignDetail.tsx` line 218: change `px-4 pt-2 pb-3` → `px-6 pt-3 pb-4` for breathing room consistent with other module pages

### G. Tabs (CampaignDetail.tsx)
- Increase tab height from `h-8`/`h-7` to `h-10`/`h-9`, font from `text-xs` to `text-sm` for consistency with rest of app
- Header (`h-16`): increase title to `text-xl font-semibold`, subtitle `text-sm`

## Files to Edit
| File | Change |
|---|---|
| `src/components/campaigns/CampaignOverview.tsx` | Full visual rewrite: bigger fonts, colored borders, colored icon tiles, restructured Details card, always-show timeline |
| `src/pages/CampaignDetail.tsx` | Larger tabs (`h-10`, `text-sm`), larger header title (`text-xl`), wider container padding (`px-6`) |

## Out of Scope
- No data/feature changes — purely visual refinement
- Setup / Monitoring / Action Items tabs untouched (separate request if needed)

