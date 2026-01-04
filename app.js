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
    theme: localStorage.getItem('theme') || 'light',
    map: null,
    stateMarkers: [],
    selectedMarker: null
  };

  // ==================== DOM REFERENCES ====================
  const DOM = {
    // Navigation
    quickSearch: document.getElementById('quickSearch'),
    themeToggle: document.getElementById('themeToggle'),
    stateDatalist: document.getElementById('stateDatalist'),
    stateDatalist2: document.getElementById('stateDatalist2'),
    
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
    },
    
    // Smart PTO Analysis Functions
    parseHolidayDate(holiday) {
      // Parse common date formats for 2026
      const when = holiday.when?.toLowerCase() || '';
      
      // Fixed dates
      if (when.includes('jan 1') || when.includes('january 1')) return new Date(2026, 0, 1);
      if (when.includes('july 4')) return new Date(2026, 6, 4);
      if (when.includes('nov 11') || when.includes('november 11')) return new Date(2026, 10, 11);
      if (when.includes('dec 25') || when.includes('december 25')) return new Date(2026, 11, 25);
      
      // Relative dates
      if (when.includes('third monday in january')) return new Date(2026, 0, 19); // MLK Day
      if (when.includes('third monday in february')) return new Date(2026, 1, 16); // Presidents Day
      if (when.includes('last monday in may')) return new Date(2026, 4, 25); // Memorial Day
      if (when.includes('first monday in september')) return new Date(2026, 8, 7); // Labor Day
      if (when.includes('second monday in october')) return new Date(2026, 9, 12); // Columbus Day
      if (when.includes('fourth thursday in november')) return new Date(2026, 10, 26); // Thanksgiving
      
      return null;
    },
    
    getWeekday(date) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    },
    
    formatDate(date) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    },
    
    analyzePTOOpportunities(holidays) {
      const opportunities = [];
      const parsedHolidays = holidays
        .map(h => ({ ...h, date: this.parseHolidayDate(h) }))
        .filter(h => h.date)
        .sort((a, b) => a.date - b.date);
      
      parsedHolidays.forEach((holiday, index) => {
        const date = holiday.date;
        const dayOfWeek = date.getDay();
        
        // Thursday holiday - Bridge to Friday for 4-day weekend
        if (dayOfWeek === 4) {
          opportunities.push({
            type: 'bridge',
            holiday: holiday.name,
            date: date,
            ptoDays: 1,
            totalDays: 4,
            roi: 4,
            description: `Take Friday ${this.formatDate(new Date(date.getTime() + 86400000))} for a 4-day weekend`,
            suggestion: 'Thu-Sun'
          });
        }
        
        // Tuesday holiday - Bridge to Monday for 4-day weekend
        if (dayOfWeek === 2) {
          opportunities.push({
            type: 'bridge',
            holiday: holiday.name,
            date: date,
            ptoDays: 1,
            totalDays: 4,
            roi: 4,
            description: `Take Monday ${this.formatDate(new Date(date.getTime() - 86400000))} for a 4-day weekend`,
            suggestion: 'Sat-Tue'
          });
        }
        
        // Monday holiday - Natural 3-day weekend
        if (dayOfWeek === 1) {
          opportunities.push({
            type: 'weekend',
            holiday: holiday.name,
            date: date,
            ptoDays: 0,
            totalDays: 3,
            roi: Infinity,
            description: `Natural 3-day weekend (no PTO needed)`,
            suggestion: 'Sat-Mon'
          });
        }
        
        // Friday holiday - Natural 3-day weekend
        if (dayOfWeek === 5) {
          opportunities.push({
            type: 'weekend',
            holiday: holiday.name,
            date: date,
            ptoDays: 0,
            totalDays: 3,
            roi: Infinity,
            description: `Natural 3-day weekend (no PTO needed)`,
            suggestion: 'Fri-Sun'
          });
        }
        
        // Wednesday holiday - Bridge both sides for 5-day vacation
        if (dayOfWeek === 3) {
          opportunities.push({
            type: 'stretch',
            holiday: holiday.name,
            date: date,
            ptoDays: 2,
            totalDays: 5,
            roi: 2.5,
            description: `Take Mon-Tue for a 5-day break (Sat-Wed)`,
            suggestion: 'Sat-Wed'
          });
        }
        
        // Check for consecutive holidays
        if (index < parsedHolidays.length - 1) {
          const nextHoliday = parsedHolidays[index + 1];
          const daysBetween = Math.floor((nextHoliday.date - date) / 86400000);
          
          if (daysBetween <= 5 && daysBetween > 1) {
            const ptoDaysNeeded = daysBetween - 1;
            const totalDaysOff = daysBetween + 1;
            opportunities.push({
              type: 'cluster',
              holiday: `${holiday.name} + ${nextHoliday.name}`,
              date: date,
              ptoDays: ptoDaysNeeded,
              totalDays: totalDaysOff,
              roi: totalDaysOff / ptoDaysNeeded,
              description: `Bridge ${ptoDaysNeeded} day(s) between holidays for ${totalDaysOff} days off`,
              suggestion: `${this.formatDate(date)} - ${this.formatDate(nextHoliday.date)}`
            });
          }
        }
      });
      
      // Sort by ROI (best value first)
      return opportunities.sort((a, b) => b.roi - a.roi);
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

  async function initUSMap() {
    if (!DOM.usMap) return;
    
    // Clear existing map
    DOM.usMap.innerHTML = '';
    if (AppState.map) {
      AppState.map.remove();
    }
    
    // Initialize Leaflet map
    AppState.map = L.map('usMap', {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      minZoom: 3,
      maxZoom: 7
    }).setView([39.8283, -98.5795], 4); // Center of USA
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(AppState.map);
    
    // Load and add state markers
    try {
      const response = await fetch('./data/us-states-geo.json');
      const geoData = await response.json();
      
      // Clear existing markers
      AppState.stateMarkers.forEach(marker => marker.remove());
      AppState.stateMarkers = [];
      
      // Create custom icon
      const stateIcon = L.divIcon({
        className: 'state-marker',
        html: '<div class="marker-pin"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      // Add marker for each state
      geoData.features.forEach(feature => {
        const { name, short } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        
        // Find state data
        const stateData = AppState.states.find(s => s.short === short || s.name === name);
        if (!stateData) return;
        
        const marker = L.marker([lat, lng], { icon: stateIcon })
          .bindTooltip(name, {
            permanent: false,
            direction: 'top',
            className: 'state-tooltip'
          })
          .on('click', () => {
            selectStateFromMap(stateData, marker);
          })
          .on('mouseover', function() {
            this.getElement().classList.add('marker-hover');
          })
          .on('mouseout', function() {
            if (AppState.selectedMarker !== this) {
              this.getElement().classList.remove('marker-hover');
            }
          })
          .addTo(AppState.map);
        
        marker.stateData = stateData;
        AppState.stateMarkers.push(marker);
      });
    } catch (error) {
      console.error('Error loading state geo data:', error);
    }
  }
  
  function selectStateFromMap(state, marker) {
    // Remove previous selection highlight
    if (AppState.selectedMarker) {
      AppState.selectedMarker.getElement().classList.remove('marker-selected');
    }
    
    // Highlight new selection
    marker.getElement().classList.add('marker-selected');
    AppState.selectedMarker = marker;
    
    // Select the state
    selectState(state);
    
    // Pan to marker
    AppState.map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
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
        <h3 class="panel-section-title">� Smart PTO Recommendations</h3>
        <div class="pto-recommendations" id="ptoRecommendations">
          ${generatePTORecommendations(state)}
        </div>
      </div>
      
      <div class="panel-section">
        <h3 class="panel-section-title">�📅 Holidays</h3>
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
  
  // ==================== SMART PTO RECOMMENDATIONS ====================
  function generatePTORecommendations(state) {
    if (!state.holidays || state.holidays.length === 0) {
      return '<p class="pto-no-data">No holiday data available for PTO analysis.</p>';
    }
    
    const opportunities = Utils.analyzePTOOpportunities(state.holidays);
    
    if (opportunities.length === 0) {
      return '<p class="pto-no-data">No optimal PTO opportunities found for this state.</p>';
    }
    
    // Group by type
    const bridges = opportunities.filter(o => o.type === 'bridge');
    const weekends = opportunities.filter(o => o.type === 'weekend');
    const stretches = opportunities.filter(o => o.type === 'stretch');
    const clusters = opportunities.filter(o => o.type === 'cluster');
    
    let html = '<div class="pto-summary">';
    html += `<div class="pto-summary-stat"><span class="pto-stat-number">${bridges.length}</span> Bridge Days</div>`;
    html += `<div class="pto-summary-stat"><span class="pto-stat-number">${weekends.length}</span> Long Weekends</div>`;
    html += `<div class="pto-summary-stat"><span class="pto-stat-number">${stretches.length + clusters.length}</span> Vacation Weeks</div>`;
    html += '</div>';
    
    html += '<div class="pto-opportunities">';
    
    // Top 5 best opportunities
    const topOpportunities = opportunities.slice(0, 5);
    
    topOpportunities.forEach((opp, index) => {
      const icons = {
        bridge: '🌉',
        weekend: '🎉',
        stretch: '🏖️',
        cluster: '⭐'
      };
      
      const typeLabels = {
        bridge: 'Bridge Day',
        weekend: 'Long Weekend',
        stretch: 'Extended Break',
        cluster: 'Holiday Cluster'
      };
      
      html += `
        <div class="pto-opportunity ${opp.type}">
          <div class="pto-opp-header">
            <span class="pto-opp-icon">${icons[opp.type]}</span>
            <div class="pto-opp-title">
              <strong>${Utils.escapeHtml(opp.holiday)}</strong>
              <span class="pto-opp-type">${typeLabels[opp.type]}</span>
            </div>
            <div class="pto-opp-badge">
              <span class="pto-days-off">${opp.totalDays} days</span>
            </div>
          </div>
          <div class="pto-opp-body">
            <p class="pto-opp-description">${Utils.escapeHtml(opp.description)}</p>
            <div class="pto-opp-stats">
              <div class="pto-opp-stat">
                <span class="label">PTO Cost:</span>
                <span class="value">${opp.ptoDays === 0 ? 'FREE' : opp.ptoDays + ' day' + (opp.ptoDays > 1 ? 's' : '')}</span>
              </div>
              <div class="pto-opp-stat">
                <span class="label">Total Days Off:</span>
                <span class="value">${opp.totalDays} days</span>
              </div>
              <div class="pto-opp-stat">
                <span class="label">ROI:</span>
                <span class="value roi-badge\">${opp.roi === Infinity ? '∞' : opp.roi.toFixed(1) + 'x'}</span>
              </div>
            </div>
            <div class=\"pto-opp-dates\">${opp.suggestion}</div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    return html;
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
    console.log('🚀 Initializing PTO Optimizer...');
    
    // Load data
    AppState.states = await loadData();
    console.log(`✅ Loaded ${AppState.states.length} states`);
    
    // Populate autocomplete datalists
    populateDatalist();
    
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
    
    console.log('✨ PTO Optimizer ready!');
  }
  
  // ==================== AUTOCOMPLETE ====================
  function populateDatalist() {
    const states = AppState.states.map(state => ({
      name: state.name,
      short: state.short
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Populate both datalists
    [DOM.stateDatalist, DOM.stateDatalist2].forEach(datalist => {
      if (!datalist) return;
      datalist.innerHTML = states.map(state => 
        `<option value="${state.name}">${state.short} - ${state.name}</option>`
      ).join('');
    });
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