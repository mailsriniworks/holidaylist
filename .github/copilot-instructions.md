# PTO Optimizer - AI Coding Instructions

## Project Overview
An interactive, vanilla JavaScript single-page application for exploring US state holidays (2026) with smart PTO optimization. Pure client-side with no framework dependencies, designed for Cloudflare Workers deployment.

## Architecture

### Core Components
- **Interactive Map**: Leaflet.js with OpenStreetMap tiles showing clickable state markers with tooltips and visual feedback
- **Multi-View System**: Four synchronized view modes (Map, Grid, Table, List) toggle via `switchView()` and `data-view` attribute on `<body>`
- **State Management**: Single `AppState` object tracks current view, selected state, filters, search, sort, theme, and map/marker instances
- **Data Source**: `data/states.json` - array of state objects with `name`, `short`, `holidays[]`, optional `details`, and `detailedHTML` fields
- **Geolocation Data**: `data/us-states-geo.json` - GeoJSON with state center coordinates for map markers
- **PTO Engine**: `Utils.analyzePTOOpportunities()` calculates bridge days, long weekends, and vacation stretches based on holiday weekday analysis

### File Structure
```
app.js          # Primary production file with PTO analysis and map integration
app-new.js      # Variant without PTO features
app-final.js    # Similar variant
pto-addon.js    # Standalone PTO functions (reference implementation)
index.html      # Single HTML entry point with Leaflet CDN
styles.css      # Complete UI styles with CSS variables for theming and custom map markers
data/
  states.json        # Holiday data for all 50 states + DC
  us-states-geo.json # GeoJSON with state coordinates
wrangler.jsonc  # Cloudflare Workers config
```

## Development Patterns

### Map Integration
- Leaflet.js loaded via CDN (unpkg.com) with OpenStreetMap tile layer
- `initUSMap()` creates map instance centered on USA (39.8283°N, -98.5795°W) with zoom level 4
- State markers created from `us-states-geo.json` with custom `divIcon` styled as circular pins
- Click handler on markers calls `selectStateFromMap(state, marker)` to show detail panel
- Selected marker gets `marker-selected` class with pulsing animation
- Hover effects add `marker-hover` class for visual feedback
- Map stored in `AppState.map`, markers in `AppState.stateMarkers` array

### Code Organization
- Functions grouped by feature in comment-delimited sections: `// ==================== SECTION ====================`
- All code wrapped in IIFE: `(function() { 'use strict'; ... })()`
- DOM references cached in `DOM` object at initialization
- Utility functions in `Utils` namespace object

### State Selection Flow
1. User clicks state in list/grid/table → calls `selectState(state)`
2. `selectState()` updates `AppState.selectedState` and calls `showStateDetail(state)`
3. `showStateDetail()` renders side panel with holidays and PTO recommendations
4. Panel includes `detailedHTML` field if present (allows custom HTML content per state)

### PTO Analysis Algorithm
- `Utils.parseHolidayDate()` converts text like "Third Monday in January" to actual 2026 dates
- `Utils.analyzePTOOpportunities()` checks each holiday's weekday position:
  - **Thursday holiday** → suggest taking Friday (1 PTO day = 4-day weekend)
  - **Tuesday holiday** → suggest taking Monday (1 PTO day = 4-day weekend)
  - **Adjacent holidays** (2-4 days apart) → cluster opportunity
  - Calculate ROI as `totalDays / ptoDays`
- Results shown in collapsible "PTO Strategy" section with opportunity cards

### View Rendering Pattern
Each view has a dedicated render function called by `switchView()`:
- `renderMapView()` → calls `renderStateList()` and `initUSMap()` to populate sidebar and create interactive OpenStreetMap
- `renderGridView()` → creates filterable card grid with chips
- `renderTableView()` → generates expandable table rows
- `renderListView()` → builds accordion with collapsible sections

### Map Marker Styling
- Custom markers styled with `.state-marker` and `.marker-pin` classes
- Gradient background (`#667eea` → `#764ba2`) with white border and shadow
- Hover state scales marker to 32px with enhanced glow
- Selected state gets 36px marker with different gradient (`#f093fb` → `#f5576c`) and pulse animation
- Tooltips use glassmorphism with backdrop-filter blur and card background
- Dark mode adjusts marker borders and tooltip colors via `[data-theme="dark"]`

### Theming
- Theme stored in `localStorage` as `'light'` or `'dark'`
- Applied via `data-theme` attribute on `<html>`
- CSS variables in `:root` and `[data-theme="dark"]` selectors
- Toggle with `toggleTheme()`, updates moon/sun icon

## Key Conventions

### Data Escaping
Always use `Utils.escapeHtml(text)` when rendering user/data text into HTML strings to prevent XSS

### Search & Filter
- `filterStates(states, query, filter)` applies both text search and type filter ('all', 'federal', 'state')
- `sortStates(states, sortBy)` supports 'name', 'holidays', 'short' sorting
- Search debounced with `Utils.debounce(func, CONFIG.debounceDelay)`

### Holiday Icons
`Utils.getHolidayIcon(name)` maps holiday names to emojis via keyword matching (e.g., "christmas" → 🎄)

### Animation Stagger
When rendering lists, apply `style.animationDelay = '${index * CONFIG.animationStagger}ms'` for cascading entrance effects

## Testing & Debugging

### Local Development
1. Open `index.html` directly in browser (no build required)
2. Use browser DevTools console - init logs include state count and load success
3. Check console for errors: `console.error('Error loading data:', error)`

### Cloudflare Workers Deployment
```bash
npx wrangler dev          # Local preview
npx wrangler deploy       # Production deploy
```
- Config in `wrangler.jsonc`: sets `assets.directory` to `./` (serves all files as static assets)
- No server-side logic, purely static hosting

### Common Issues
- **State not updating**: Check `AppState.currentView` matches expected view string
- **PTO not showing**: Verify holiday has valid `when` field and `Utils.parseHolidayDate()` returns non-null
- **Panel not opening**: Check `DOM.stateDetail` and `DOM.panelContent` exist in HTML

## Extending the App

### Adding a New View
1. Add view container to `index.html`: `<div class="view-container" id="newView">`
2. Add button to view switcher with `data-view="new"`
3. Create `renderNewView()` function in appropriate section
4. Add case to `switchView()` switch statement
5. Update `CONFIG.views` array

### Adding New Holiday Data
Edit `data/states.json`:
- Each holiday object needs `name` and `when` fields
- `when` should match parseable formats in `Utils.parseHolidayDate()`
- Use `detailedHTML` for rich state-specific content (e.g., Virginia's PTO Maximizer)
- Optional `notes` field shows with 💡 icon in holiday list

### Custom PTO Logic
Modify `Utils.analyzePTOOpportunities()` to add new opportunity types. Return objects with:
```javascript
{ type: 'new-type', holiday: string, date: Date, ptoDays: number, 
  totalDays: number, roi: number, description: string }
```

## Code Style
- Use template literals for HTML generation
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Comment complex logic (especially PTO date calculations)
- Section headers with ASCII box drawing for visual separation
