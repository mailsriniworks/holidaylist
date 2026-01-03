// Ultra-Interactive US Holiday Calendar 2026
// Features: Interactive Map, Multiple Views, Advanced Filtering, PTO Planning

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    dataFile: './data/states.json',
    views: ['map', 'grid', 'table', 'list'],
    defaultView: 'map',
    debounceDelay: 200,
    animationStagger: 50
  };

  // ==================== STATE MANAGEMENT ====================
  const AppState = {
    states: [],
    currentView: CONFIG.defaultView,
    selectedState: null,
    searchQuery: '',
    currentFilter: 'all',
    sortBy: 'name',
    theme: localStorage.getItem('theme') || 'light'
  };

  // ==================== DOM REFERENCES ====================
  const DOM = {
    // Navigation
    quickSearch: document.getElementById('quickSearch'),
    themeToggle: document.getElementById('themeToggle'),
    
    // View switcher
    viewBtns: document.querySelectorAll('.view-btn'),
    
    // Map view
    mapView: document.getElementById('mapView'),
    usMap: document.getElementById('usMap'),
    stateList: document.getElementById('stateList'),
    stateSearch: document.getElementById('stateSearch'),
    stateDetail: document.getElementById('stateDetail'),
    panelContent: document.getElementById('panelContent'),
    closePanel: document.getElementById('closePanel'),
    
    // Grid view
    gridView: document.getElementById('gridView'),
    gridContainer: document.getElementById('gridContainer'),
    filterChips: document.querySelectorAll('[data-filter]'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Table view
    tableView: document.getElementById('tableView'),
    tableBody: document.getElementById('tableBody'),
    exportTable: document.getElementById('exportTable'),
    expandAll: document.getElementById('expandAll'),
    
    // List view
    listView: document.getElementById('listView'),
    accordion: document.getElementById('accordion'),
    collapseAllList: document.getElementById('collapseAllList'),
    expandAllList: document.getElementById('expandAllList'),
    
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
      const icons = {
        'new year': '🎆', 'martin luther king': '✊', 'mlk': '✊',
        'president': '🎩', 'george washington': '🎩', 'memorial': '🇺🇸',
        'juneteenth': '✊🏿', 'independence': '🎇', 'july 4': '🎇',
        'labor': '⚒️', 'columbus': '⛵', 'veterans': '🎖️',
        'thanksgiving': '🦃', 'christmas': '🎄', 'election': '🗳️',
        'yorktown': '⚔️', 'cesar chavez': '🌟'
      };
      
      const name = holidayName.toLowerCase();
      for (const [key, icon] of Object.entries(icons)) {
        if (name.includes(key)) return icon;
      }
      return '📅';
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
      icon.textContent = AppState.theme === 'dark' ? '☀️' : '🌙';
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
      activeView.classList.remove('hidden');
    }
    
    // Render appropriate view
    switch(viewName) {
      case 'map':
        renderMapView();
        break;
      case 'grid':
        renderGridView();
        break;
      case 'table':
        renderTableView();
        break;
      case 'list':
        renderListView();
        break;
    }
  }

  // ==================== MAP VIEW ====================
  function renderMapView() {
    renderStateList();
    initUSMap();
  }

  function renderStateList() {
    if (!DOM.stateList) return;
    
    const filtered = filterStates(AppState.states, AppState.searchQuery);
    DOM.stateList.innerHTML = '';
    
    filtered.forEach((state, index) => {
      const item = document.createElement('div');
      item.className = 'state-list-item';
      item.style.animationDelay = `${index * 20}ms`;
      item.innerHTML = `
        <div class="state-list-info">
          <div class="state-list-name">${Utils.escapeHtml(state.name)}</div>
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
    
    // Create interactive US map with D3.js-like simple SVG
    // For now, create a grid-based representation
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
    showStateDetail(state);
    if (DOM.selectedStateDisplay) {
      DOM.selectedStateDisplay.textContent = state.name;
    }
  }

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
    `;
    
    DOM.stateDetail.classList.add('active');
  }

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
        h.notes?.includes('state') || h.notes?.includes('exclusive')
      ) || [];
      
      row.innerHTML = `
        <td class="td-state">
          <strong>${Utils.escapeHtml(state.name)}</strong>
        </td>
        <td class="td-code">${state.short}</td>
        <td class="td-count">
          <span class="badge badge-primary">${state.holidays?.length || 0}</span>
        </td>
        <td class="td-unique">
          ${uniqueHolidays.length > 0 ? 
            `<span class="badge badge-accent">${uniqueHolidays.length}</span>` : 
            '<span class="text-muted">—</span>'}
        </td>
        <td class="td-actions">
          <button class="btn-table-action" data-action="view">View</button>
          <button class="btn-table-action" data-action="expand">Expand</button>
        </td>
      `;
      
      const detailRow = document.createElement('tr');
      detailRow.className = 'detail-row';
      detailRow.style.display = 'none';
      detailRow.innerHTML = `
        <td colspan="5">
          <div class="detail-content">
            <div class="detail-holidays">
              ${(state.holidays || []).map(h => `
                <div class="detail-holiday">
                  <span class="detail-holiday-icon">${Utils.getHolidayIcon(h.name)}</span>
                  <span class="detail-holiday-name">${Utils.escapeHtml(h.name)}</span>
                  <span class="detail-holiday-when">${Utils.escapeHtml(h.when || '')}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </td>
      `;
      
      row.querySelector('[data-action="expand"]').addEventListener('click', function() {
        const isExpanded = detailRow.style.display !== 'none';
        detailRow.style.display = isExpanded ? 'none' : 'table-row';
        this.textContent = isExpanded ? 'Expand' : 'Collapse';
      });
      
      row.querySelector('[data-action="view"]').addEventListener('click', () => {
        selectState(state);
        switchView('map');
      });
      
      DOM.tableBody.appendChild(row);
      DOM.tableBody.appendChild(detailRow);
    });
  }

  // ==================== LIST VIEW ====================
  function renderListView() {
    if (!DOM.accordion) return;
    
    const filtered = filterStates(AppState.states, AppState.searchQuery);
    DOM.accordion.innerHTML = '';
    
    filtered.forEach((state, index) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.animationDelay = `${index * CONFIG.animationStagger}ms`;
      
      const id = `state-${state.short}`;
      
      card.innerHTML = `
        <header class="card-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}">
          <div>
            <div class="card-title">
              <span class="state-flag">📍</span>${Utils.escapeHtml(state.name)}
            </div>
            <div class="card-sub">
              <span>${state.short}</span>
              <span class="holiday-badge">📅 ${state.holidays?.length || 0} holidays</span>
            </div>
          </div>
          <button class="card-toggle" aria-label="Toggle details">▾</button>
        </header>
        <div id="${id}" class="card-content hidden" aria-hidden="true">
          ${state.details ? `<p class="card-description">${Utils.escapeHtml(state.details)}</p>` : ''}
          <div class="holidays-list">
            ${(state.holidays || []).map(h => `
              <div class="holiday">
                <div class="holiday-icon">${Utils.getHolidayIcon(h.name)}</div>
                <div class="holiday-content">
                  <strong>${Utils.escapeHtml(h.name)}</strong>
                  <small>${Utils.escapeHtml(h.when || '')}</small>
                  ${h.notes ? `<div class="holiday-note">💡 ${Utils.escapeHtml(h.notes)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ${state.detailedHTML ? `<div class="card-pto">${state.detailedHTML}</div>` : ''}
        </div>
      `;
      
      const header = card.querySelector('.card-header');
      const content = card.querySelector('.card-content');
      const toggle = card.querySelector('.card-toggle');
      
      const toggleCard = () => {
        const isOpen = content.classList.toggle('hidden');
        header.setAttribute('aria-expanded', !isOpen);
        content.setAttribute('aria-hidden', isOpen);
        toggle.setAttribute('aria-expanded', !isOpen);
      };
      
      header.addEventListener('click', toggleCard);
      header.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard();
        }
      });
      
      DOM.accordion.appendChild(card);
    });
  }

  // ==================== FILTERING & SORTING ====================
  function filterStates(states, query, filter = 'all') {
    let filtered = states.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filter === 'unique') {
      filtered = filtered.filter(s => {
        const hasUnique = s.holidays?.some(h => 
          h.notes?.includes('state') || h.notes?.includes('exclusive')
        );
        return hasUnique || (s.holidays?.length || 0) > 12;
      });
    } else if (filter === 'federal') {
      filtered = filtered.filter(s => (s.holidays?.length || 0) <= 11);
    }
    
    return filtered;
  }

  function sortStates(states, sortBy) {
    const sorted = [...states];
    
    switch(sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'holidays':
        sorted.sort((a, b) => (b.holidays?.length || 0) - (a.holidays?.length || 0));
        break;
      case 'unique':
        sorted.sort((a, b) => {
          const aUnique = a.holidays?.filter(h => 
            h.notes?.includes('state') || h.notes?.includes('exclusive')
          ).length || 0;
          const bUnique = b.holidays?.filter(h => 
            h.notes?.includes('state') || h.notes?.includes('exclusive')
          ).length || 0;
          return bUnique - aUnique;
        });
        break;
    }
    
    return sorted;
  }

  // ==================== EVENT HANDLERS ====================
  function setupEventListeners() {
    // Theme toggle
    DOM.themeToggle?.addEventListener('click', toggleTheme);
    
    // View switching
    DOM.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    // Search
    if (DOM.stateSearch) {
      DOM.stateSearch.addEventListener('input', Utils.debounce((e) => {
        AppState.searchQuery = e.target.value;
        renderStateList();
      }, CONFIG.debounceDelay));
    }
    
    if (DOM.quickSearch) {
      DOM.quickSearch.addEventListener('input', Utils.debounce((e) => {
        AppState.searchQuery = e.target.value;
        renderCurrentView();
      }, CONFIG.debounceDelay));
    }
    
    // Filter chips
    DOM.filterChips?.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.filterChips.forEach(c => c.classList.remove('chip-active'));
        chip.classList.add('chip-active');
        AppState.currentFilter = chip.dataset.filter;
        renderGridView();
      });
    });
    
    // Sort select
    DOM.sortSelect?.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      renderGridView();
    });
    
    // Close panel
    DOM.closePanel?.addEventListener('click', closeStateDetail);
    
    // Export table
    DOM.exportTable?.addEventListener('click', exportTableToCSV);
    
    // Expand/collapse all
    DOM.expandAll?.addEventListener('click', () => {
      document.querySelectorAll('.detail-row').forEach(row => {
        row.style.display = 'table-row';
      });
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
