// Ultra-Interactive US Holiday Calendar 2026
// Features: Interactive Map, Multiple Views, Advanced Filtering, PTO Planning

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    dataFile: './data/states.json',
    defaultView: 'map',
    debounceDelay: 300,
    animationStagger: 40
  };

  // ==================== STATE MANAGEMENT ====================
  const AppState = {
    states: [],
    currentView: 'map',
    selectedState: null,
    searchQuery: '',
    theme: localStorage.getItem('theme') || 'light'
  };

  // ==================== DOM REFERENCES ====================
  const DOM = {
    // Navigation
    quickSearch: document.getElementById('quickSearch'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Map view
    mapView: document.getElementById('mapView'),
    usMap: document.getElementById('usMap'),
    stateList: document.getElementById('stateList'),
    stateSearch: document.getElementById('stateSearch'),
    stateDetail: document.getElementById('stateDetail'),
    panelContent: document.getElementById('panelContent'),
    closePanel: document.getElementById('closePanel'),
    
    // Stats
    stateCount: document.getElementById('stateCount'),
    holidayCount: document.getElementById('holidayCount'),
    selectedStateDisplay: document.getElementById('selectedState')
  };

  // ==================== UTILITY FUNCTIONS ====================
  const Utils = {
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    getHolidayIcon(holidayName) {
      return '•';
    },
    
    formatHolidayCount(count) {
      return count === 1 ? '1 holiday' : `${count} holidays`;
    }
  };

  // ==================== DATA LOADING ====================
  async function loadData() {
    try {
      const response = await fetch(CONFIG.dataFile);
      if (!response.ok) throw new Error('Failed to load data');
      return await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
      return [];
    }
  }

  // ==================== THEME MANAGEMENT ====================
  function initTheme() {
    document.documentElement.setAttribute('data-theme', AppState.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const icon = DOM.themeToggle?.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = AppState.theme === 'dark' ? 'Light' : 'Dark';
    }
  }

  function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
    updateThemeIcon();
  }

  // ==================== VIEW SWITCHING ====================
  function switchView(viewName) {
    AppState.currentView = viewName;
    document.body.setAttribute('data-view', viewName);
    
    // Update view buttons
    DOM.viewBtns.forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Show/hide view containers
    document.querySelectorAll('.view-container').forEach(container => {
      container.classList.add('hidden');
    });
    
    const activeView = document.getElementById(`${viewName}View`);
    if (activeView) {
      activeView.classList.remoRENDERING ====================
  function renderView() {
    renderMapView();     <div class="state-list-name">${Utils.escapeHtml(state.name)}</div>
          <div class="state-list-meta">
            <span class="state-code">${state.short}</span>
            <span class="holiday-count">${Utils.formatHolidayCount(state.holidays?.length || 0)}</span>
          </div>
        </div>
        <div class="state-list-arrow">→</div>
      `;
      
      item.addEventListener('click', () => selectState(state));
      DOM.stateList.appendChild(item);
    });
  }

  function initUSMap() {
    if (!DOM.usMap) return;
    
    // Create interactive US map visualization
    DOM.usMap.innerHTML = `
      <div class="map-placeholder">
        <div class="map-instruction">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <h3>Select a State</h3>
          <p>Choose a state from the list on the left or search above</p>
        </div>
      </div>
    `;
  }

  function selectState(state) {
    AppState.selectedState = state;
          <h3>Select a State</h3>
          <p>Choose a state from the list to view holiday details</p>
  function showStateDetail(state) {
    if (!DOM.stateDetail || !DOM.panelContent) return;
    
    DOM.panelContent.innerHTML = `
      <div class="panel-header">
        <div class="panel-state-badge">${state.short}</div>
        <div>
          <h2 class="panel-state-name">${Utils.escapeHtml(state.name)}</h2>
          <p class="panel-state-meta">${Utils.formatHolidayCount(state.holidays?.length || 0)} in 2026</p>
        </div>
      </div>
      
      ${state.details ? `<p class="panel-description">${Utils.escapeHtml(state.details)}</p>` : ''}
      
      <div class="panel-section">
        <h3 class="panel-section-title">📅 Holidays</h3>
        <div class="panel-holidays">
          ${(state.holidays || []).map(h => `
            <div class="panel-holiday">
              <span class="panel-holiday-icon">${Utils.getHolidayIcon(h.name)}</span>
              <div class="panel-holiday-info">
                <div class="panel-holiday-name">${Utils.escapeHtml(h.name)}</div>
                <div class="panel-holiday-when">${Utils.escapeHtml(h.when || '')}</div>
                ${h.notes ? `<div class="panel-holiday-note">💡 ${Utils.escapeHtml(h.notes)}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${state.detailedHTML ? `
        <div class="panel-section">
          <h3 class="panel-section-title">📊 PTO Strategy</h3>
          <div class="panel-pto">${state.detailedHTML}</div>
        </div>
      ` : ''}
              <div class=\"panel-holiday-info\">
                <div class=\"panel-holiday-name\">${Utils.escapeHtml(h.name)}</div>
                <div class=\"panel-holiday-when\">${Utils.escapeHtml(h.when || '')}</div>
                ${h.notes ? `<div class=\"panel-holiday-note\">${Utils.escapeHtml(h.notes)}</div>` : ''}
  function closeStateDetail() {
    if (DOM.stateDetail) {
      DOM.stateDetail.classList.remove('active');
    }
    AppState.selectedState = null;
    if (DOM.selectedStateDisplay) {
      DOM.selectedStateDisplay.textContent = '—';
    }
  }

  // ==================== GRID VIEW ====================
  function renderGridView() {
    if (!DOM.gridContainer) return;
    
    const filtered = filterStates(AppState.states, AppState.searchQuery, AppState.currentFilter);
    const sorted = sortStates(filtered, AppState.sortBy);
    
    DOM.gridContainer.innerHTML = '';
    
    sorted.forEach((state, index) => {
      const card = document.createElement('div');
      card.className = 'grid-card';
      card.style.animationDelay = `${index * CONFIG.animationStagger}ms`;
      
      const uniqueCount = state.holidays?.filter(h => 
        h.notes?.includes('state') || h.notes?.includes('exclusive')
      ).length || 0;
      
      card.innerHTML = `
        <div class="grid-card-header">
          <div class="grid-card-state">${Utils.escapeHtml(state.name)}</div>
          <div class="grid-card-code">${state.short}</div>
        </div>
        <div class="grid-card-stats">
          <div class="grid-stat">
            <div class="grid-stat-value">${state.holidays?.length || 0}</div>
            <div class="grid-stat-label">Total</div>
          </div>
          ${uniqueCount > 0 ? `
            <div class="grid-stat">
              <div class="grid-stat-value unique">${uniqueCount}</div>
              <div class="grid-stat-label">Unique</div>
            </div>
          ` : ''}
        </div>
        <button class="grid-card-btn">View Details →</button>
      `;
      
      card.querySelector('.grid-card-btn').addEventListener('click', () => {
        selectState(state);
        switchView('map');
      });
      
      DOM.gridContainer.appendChild(card);
    });
  }

  // ==================== TABLE VIEW ====================
  function renderTableView() {
    if (!DOM.tableBody) return;
    
    const sorted = sortStates([...AppState.states], 'name');
    DOM.tableBody.innerHTML = '';
    
    sorted.forEach(state => {
      const row = document.createElement('tr');
      const uniqueHolidays = state.holidays?.filter(h => 
        h.notes?.includes(FILTERING ====================
  function filterStates(states, query) {
    return states.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase())
    )
    });
    
    DOM.collapseAllList?.addEventListener('click', () => {
      document.querySelectorAll('.card-content').forEach(content => {
        content.classList.add('hidden');
      });
    });
    
    DOM.expandAllList?.addEventListener('click', () => {
      document.querySelectorAll('.card-content').forEach(content => {
        content.classList.remove('hidden');
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        DOM.quickSearch?.focus();
      }
      
      if (e.key === 'Escape') {
        if (DOM.stateDetail?.classList.contains('active')) {
          closeStateDetail();
        }
      }
    });
  }

  // ==================== EXPORT FUNCTIONALITY ====================
  function exportTableToCSV() {
    const rows = [['State', 'Code', 'Total Holidays', 'Unique Holidays']];
    
    AppState.states.forEach(state => {
      const uniqueCount = state.holidays?.filter(h => 
        h.notes?.includes('state') || h.notes?.includes('exclusive')
      ).length || 0;
      
      rows.push([
        state.name,
        state.short,
        state.holidays?.length || 0,
        uniqueCount
      ]);
    });
    
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'us-holidays-2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== RENDER HELPERS ====================
  function renderCurrentView() {
    switch(AppState.currentView) {
      case 'map': renderMapView(); break;
      case 'grid': renderGridView(); break;
      case 'table': renderTableView(); break;
      case 'list': renderListView(); break;
    }
  }

  // ==================== INITIALIZATION ====================
  async function init() {
    console.log('🚀 Initializing Holiday Calendar...');
    
    // Load data
    AppState.states = await loadData();
    console.log(`✅ Loaded ${AppState.states.length} states`);
    
    // Calculate stats
    const totalHolidays = AppState.states.reduce((sum, state) => 
      sum + (state.holidays?.length || 0), 0
    );
    
    if (DOM.stateCount) DOM.stateCount.textContent = AppState.states.length;
    if (DOM.holidayCount) DOM.holidayCount.textContent = totalHolidays;
    
    // Initialize theme
    initTheme();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial view
    switchView(CONFIG.defaultView);
    
    console.log('✨ Holiday Calendar ready!');
  }

  // Start the application
  init();
})();
Search
    if (DOM.stateSearch) {
      DOM.stateSearch.addEventListener('input', Utils.debounce((e) => {
        AppState.searchQuery = e.target.value;
        renderStateList();
      }, CONFIG.debounceDelay));
    }
    
    if (DOM.quickSearch) {
      DOM.quickSearch.addEventListener('input', Utils.debounce((e) => {
        AppState.searchQuery = e.target.value;
        renderStateList();
      }, CONFIG.debounceDelay));
    }
    
    // Close panel
    DOM.closePanel?.addEventListener('click', closeStateDetail);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        (DOM.quickSearch || DOM.stateSearch)?.focus();
      }
      
      if (e.key === 'Escape') {
        if (DOM.stateDetail?.classList.contains('active')) {
          closeStateDetail();
        }
      }
    });map view
    renderView();
    
    console.log('✨ US Holidays 2026