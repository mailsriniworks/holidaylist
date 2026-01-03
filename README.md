# US State Holiday List (static UI)

This is a small static UI that renders a searchable accordion of U.S. states and their holidays. It's dependency-free — just open `index.html` in a browser.

How it works
- data/states.json contains an array of states. Each object should include:
  - name (string)
  - short (string, e.g., "VA")
  - holidays (array of { name, when, notes })
  - details (optional short text)
  - detailedHTML (optional HTML string — useful for richer content, e.g., Virginia's PTO Maximizer)

To edit or add holiday details, update `data/states.json`. The UI will show the `detailedHTML` field (if present) as raw HTML inside the accordion.

Run locally
1. Clone or copy files into a folder.
2. Open `index.html` in your browser.

Next steps (ideas)
- Add authoritative 2026 observed dates for all states (data collection).
- Add export to iCal / Google Calendar.
- Convert to React/Next or integrate into your existing site.
- Add a per-state calendar view and "PTO calculator" widget.

If you'd like, I can: populate 2026 observed dates for all states, convert the UI into a React component, or wire up a small admin UI to edit the JSON in-browser.
