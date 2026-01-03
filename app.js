// Modern US State Holiday Calendar with enhanced UX features
(async function () {
  const ACC_ID = 'accordion';
  const SEARCH_ID = 'stateSearch';
  const THEME_TOGGLE_ID = 'themeToggle';
  const CLEAR_SEARCH_ID = 'clearSearch';
  const STATE_COUNT_ID = 'stateCount';
  const HOLIDAY_COUNT_ID = 'holidayCount';
  
  const container = document.getElementById(ACC_ID);
  const searchInput = document.getElementById(SEARCH_ID);
  const themeToggle = document.getElementById(THEME_TOGGLE_ID);
  const clearSearchBtn = document.getElementById(CLEAR_SEARCH_ID);
  const stateCountEl = document.getElementById(STATE_COUNT_ID);
  const holidayCountEl = document.getElementById(HOLIDAY_COUNT_ID);

  // Holiday icons mapping
  const holidayIcons = {
    'new year': '🎆',
    'martin luther king': '✊',
    'mlk': '✊',
    'president': '🎩',
    'george washington': '🎩',
    'memorial': '🇺🇸',
    'juneteenth': '✊🏿',
    'independence': '🎆',
    'july 4': '🎇',
    'labor': '⚒️',
    'columbus': '⛵',
    'veterans': '🎖️',
    'thanksgiving': '🦃',
    'christmas': '🎄',
    'election': '🗳️',
    'yorktown': '⚔️',
    'cesar chavez': '🌟',
    'default': '📅'
  };

  function getHolidayIcon(holidayName) {
    const name = holidayName.toLowerCase();
    for (const [key, icon] of Object.entries(holidayIcons)) {
      if (name.includes(key)) return icon;
    }
    return holidayIcons.default;
  }

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
  
  // Calculate total holidays
  const totalHolidays = states.reduce((sum, state) => sum + (state.holidays?.length || 0), 0);
  if (holidayCountEl) holidayCountEl.textContent = totalHolidays;
  if (stateCountEl) stateCountEl.textContent = states.length;

  let currentFilter = 'all';

  // Theme management
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
  }

  function updateThemeButton(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('.theme-icon');
    const text = themeToggle.querySelector('.theme-text');
    if (theme === 'dark') {
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Light Mode';
    } else {
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Dark Mode';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeButton(newTheme);
    });
  }

  // Filter chips
  const filterChips = document.querySelectorAll('[data-filter]');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
      currentFilter = chip.dataset.filter;
      render(searchInput.value, currentFilter);
    });
  });

  // Render list of states (filtered)
  function render(searchQuery = '', filter = 'all') {
    const q = searchQuery.trim().toLowerCase();
    
    // Remove loading skeleton
    const skeleton = container.querySelector('.loading-skeleton');
    if (skeleton) skeleton.remove();
    
    // Filter states
    let filteredStates = states.filter(s => s.name.toLowerCase().includes(q));
    
    // Apply additional filters
    if (filter === 'unique') {
      // States with unique holidays (more than just federal)
      filteredStates = filteredStates.filter(s => {
        const hasUniqueHolidays = s.holidays?.some(h => h.notes?.includes('state') || h.notes?.includes('exclusive'));
        return hasUniqueHolidays || (s.holidays?.length || 0) > 12;
      });
    } else if (filter === 'federal') {
      // States with mainly federal holidays (<=11 holidays)
      filteredStates = filteredStates.filter(s => (s.holidays?.length || 0) <= 11);
    }
    
    container.innerHTML = '';
    
    if (filteredStates.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No states found</div>
        <div class="empty-state-text">Try adjusting your search or filter criteria</div>
      `;
      container.appendChild(emptyState);
      return;
    }

    // Stagger animation delay for cards
    filteredStates.forEach((st, index) => {
      const card = createStateCard(st, index);
      container.appendChild(card);
    });
  }

  function createStateCard(st, index) {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.05}s`;
    const id = `state-${st.name.replace(/\\s+/g,'-')}`;

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
    title.innerHTML = `<span class="state-flag">📍</span>${escapeHtml(st.name)}`;
    
    const sub = document.createElement('div');
    sub.className = 'card-sub';
    
    const holidayCount = st.holidays?.length || 0;
    const badge = `<span class="holiday-badge">📅 ${holidayCount} holidays</span>`;
    const stateCode = st.short ? `<span>${st.short}</span>` : '';
    sub.innerHTML = `${stateCode}${badge}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);

    const toggle = document.createElement('button');
    toggle.className = 'card-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Toggle ${st.name} details`);
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
      if (st.details) {
        const p = document.createElement('p');
        p.textContent = st.details;
        p.style.marginBottom = '16px';
        content.appendChild(p);
      }

      // holidays list
      if (Array.isArray(st.holidays) && st.holidays.length) {
        const listEl = document.createElement('div');
        listEl.className = 'holidays-list';
        
        for (const h of st.holidays) {
          const hEl = document.createElement('div');
          hEl.className = 'holiday';
          
          const icon = document.createElement('div');
          icon.className = 'holiday-icon';
          icon.textContent = getHolidayIcon(h.name);
          
          const hContent = document.createElement('div');
          hContent.className = 'holiday-content';
          hContent.innerHTML = `<strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(h.when || '')}</small>`;
          
          if (h.notes) {
            const note = document.createElement('div');
            note.className = 'holiday-note';
            note.textContent = `💡 ${h.notes}`;
            hContent.appendChild(note);
          }
          
          hEl.appendChild(icon);
          hEl.appendChild(hContent);
          listEl.appendChild(hEl);
        }
        content.appendChild(listEl);
      } else {
        const none = document.createElement('div');
        none.className = 'empty-state-text';
        none.textContent = 'No holiday details available yet.';
        content.appendChild(none);
      }
    }

    card.appendChild(content);

    // Interactions
    function togglePanel() {
      const isOpen = content.classList.toggle('hidden') === false;
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      
      // Smooth scroll into view if opening
      if (isOpen) {
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }

    header.addEventListener('click', togglePanel);
    header.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePanel();
      }
    });

    return card;
  }

  function escapeHtml(s) { 
    return String(s).replace(/[&<>"']/g, m => ({ 
      '&': '&amp;', 
      '<': '&lt;', 
      '>': '&gt;', 
      '"': '&quot;', 
      "'": '&#39;' 
    }[m])); 
  }

  // Search functionality with debounce
  let searchTimer;
  
  function updateSearchUI() {
    if (searchInput && clearSearchBtn) {
      if (searchInput.value.length > 0) {
        clearSearchBtn.classList.add('active');
      } else {
        clearSearchBtn.classList.remove('active');
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const v = e.target.value;
      updateSearchUI();
      searchTimer = setTimeout(() => render(v, currentFilter), 200);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      updateSearchUI();
      render('', currentFilter);
      searchInput.focus();
    });
    
    clearSearchBtn.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clearSearchBtn.click();
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      updateSearchUI();
      render('', currentFilter);
    }
  });

  // Initialize
  initTheme();
  render('', currentFilter);
  
  console.log('✨ Holiday Calendar loaded successfully!');
  console.log(`📊 ${states.length} states, ${totalHolidays} total holidays`);

})();
