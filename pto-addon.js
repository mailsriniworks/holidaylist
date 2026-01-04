// PTO Recommendation Add-on Functions
// This extends the Utils object with smart PTO analysis

// Add these methods to Utils object:
Utils.parseHolidayDate = function(holiday) {
  const when = holiday.when?.toLowerCase() || '';
  if (when.includes('jan 1') || when.includes('january 1')) return new Date(2026, 0, 1);
  if (when.includes('july 4')) return new Date(2026, 6, 4);
  if (when.includes('nov 11') || when.includes('november 11')) return new Date(2026, 10, 11);
  if (when.includes('dec 25') || when.includes('december 25')) return new Date(2026, 11, 25);
  if (when.includes('third monday in january')) return new Date(2026, 0, 19);
  if (when.includes('third monday in february')) return new Date(2026, 1, 16);
  if (when.includes('last monday in may')) return new Date(2026, 4, 25);
  if (when.includes('first monday in september')) return new Date(2026, 8, 7);
  if (when.includes('second monday in october')) return new Date(2026, 9, 12);
  if (when.includes('fourth thursday in november')) return new Date(2026, 10, 26);
  return null;
};

Utils.formatDate = function(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

Utils.analyzePTOOpportunities = function(holidays) {
  const opportunities = [];
  const parsedHolidays = holidays
    .map(h => ({ ...h, date: this.parseHolidayDate(h) }))
    .filter(h => h.date)
    .sort((a, b) => a.date - b.date);
  
  parsedHolidays.forEach((holiday, index) => {
    const date = holiday.date;
    const dayOfWeek = date.getDay();
    
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
  
  return opportunities.sort((a, b) => b.roi - a.roi);
};

// Function to generate PTO recommendations HTML
window.generatePTORecommendations = function(state) {
  if (!state.holidays || state.holidays.length === 0) {
    return '<p class="pto-no-data">No holiday data available for PTO analysis.</p>';
  }
  
  const opportunities = Utils.analyzePTOOpportunities(state.holidays);
  
  if (opportunities.length === 0) {
    return '<p class="pto-no-data">No optimal PTO opportunities found for this state.</p>';
  }
  
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
            <strong>${opp.holiday}</strong>
            <span class="pto-opp-type">${typeLabels[opp.type]}</span>
          </div>
          <div class="pto-opp-badge">
            <span class="pto-days-off">${opp.totalDays} days</span>
          </div>
        </div>
        <div class="pto-opp-body">
          <p class="pto-opp-description">${opp.description}</p>
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
              <span class="value roi-badge">${opp.roi === Infinity ? '∞' : opp.roi.toFixed(1) + 'x'}</span>
            </div>
          </div>
          <div class="pto-opp-dates">${opp.suggestion}</div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  return html;
};
