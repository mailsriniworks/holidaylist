// Simple state holiday accordion + search
// Loads data from data/states.json (or embedded if available).
(async function () {
  const ACC_ID = 'accordion';
  const SEARCH_ID = 'stateSearch';
  const container = document.getElementById(ACC_ID);
  const searchInput = document.getElementById(SEARCH_ID);

  // Load data file
  async function loadData() {
    try {
      const res = await fetch('./data/states.json');
      if (!res.ok) throw new Error('Could not fetch states.json');
      return await res.json();
    } catch (err) {
      console.error('Failed to load data:', err);
      // fallback minimal dataset (shouldn't happen if file present)
      return [
        { name: 'Virginia', short: 'VA', holidays: [], details: '', detailedPlan: '' }
      ];
    }
  }

  const states = await loadData();

  // Render list of states (filtered)
  function render(filter = '') {
    const q = filter.trim().toLowerCase();
    container.innerHTML = '';
    const list = states.filter(s => s.name.toLowerCase().includes(q));
    if (list.length === 0) {
      container.innerHTML = `<div class="card"><div>No states match "${escapeHtml(filter)}"</div></div>`;
      return;
    }

    for (const st of list) {
      const card = document.createElement('article');
      card.className = 'card';
      const id = `state-${st.name.replace(/\s+/g,'-')}`;

      // Header
      const header = document.createElement('header');
      header.className = 'card-header';
      header.tabIndex = 0;
      header.setAttribute('role','button');
      header.setAttribute('aria-controls', id);
      header.setAttribute('aria-expanded', 'false');

      const titleWrap = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = st.name;
      const sub = document.createElement('div');
      sub.className = 'card-sub';
      sub.textContent = st.short ? `${st.short} • ${st.holidays.length} entries` : `${st.holidays.length} entries`;

      titleWrap.appendChild(title);
      titleWrap.appendChild(sub);

      const toggle = document.createElement('button');
      toggle.className = 'card-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '▾';

      header.appendChild(titleWrap);
      header.appendChild(toggle);
      card.appendChild(header);

      // Content
      const content = document.createElement('div');
      content.id = id;
      content.className = 'card-content hidden';
      content.setAttribute('aria-hidden', 'true');

      // If there is raw HTML detail (trusted because it's from your repo), insert it.
      if (st.detailedHTML) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = st.detailedHTML;
        content.appendChild(wrapper);
      } else {
        // generic display
        const p = document.createElement('p');
        p.textContent = st.details || `Holiday list for ${st.name}.`;
        content.appendChild(p);

        // holidays list
        if (Array.isArray(st.holidays) && st.holidays.length) {
          const listEl = document.createElement('div');
          listEl.className = 'holidays-list';
          for (const h of st.holidays) {
            const hEl = document.createElement('div');
            hEl.className = 'holiday';
            const hLeft = document.createElement('div');
            hLeft.innerHTML = `<strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(h.when || '')}</small>`;
            hEl.appendChild(hLeft);
            listEl.appendChild(hEl);
          }
          content.appendChild(listEl);
        } else {
          const none = document.createElement('div');
          none.className = 'card-sub';
          none.textContent = 'No holiday details yet. Edit data/states.json to add entries.';
          content.appendChild(none);
        }
      }

      card.appendChild(content);

      // interactions
      function togglePanel() {
        const isOpen = content.classList.toggle('hidden') === false;
        header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }

      header.addEventListener('click', togglePanel);
      header.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePanel();
        }
      });

      container.appendChild(card);
    }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m])); }

  // initial render
  render('');

  // wire search
  let searchTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const v = e.target.value;
    searchTimer = setTimeout(() => render(v), 120);
  });

})();
