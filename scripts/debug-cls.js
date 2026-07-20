/**
 * CLS Debugging Script
 *
 * Add this script to pages to capture detailed layout shift information
 * Run in browser console during page load to capture shift events
 *
 * Usage:
 * 1. Add this script to the page or paste in DevTools console
 * 2. Refresh the page
 * 3. Check console for layout shift details
 * 4. Copy output for analysis
 */

(function() {
  'use strict';

  console.log('%c🔍 CLS Debugging Started', 'color: #00ffcc; font-size: 16px; font-weight: bold');

  const layoutShifts = [];
  let clsScore = 0;

  // Observe layout shifts
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        const shiftValue = entry.value;
        clsScore += shiftValue;
        layoutShifts.push({
          score: shiftValue,
          cumulative: clsScore,
          sources: entry.sources.map(source => ({
            node: source.node ? source.node.nodeName : 'unknown',
            selector: getSourceSelector(source.node),
            currentRect: {
              x: Math.round(source.currentRect.x),
              y: Math.round(source.currentRect.y),
              width: Math.round(source.currentRect.width),
              height: Math.round(source.currentRect.height)
            },
            previousRect: {
              x: Math.round(source.previousRect.x),
              y: Math.round(source.previousRect.y),
              width: Math.round(source.previousRect.width),
              height: Math.round(source.previousRect.height)
            }
          }))
        });

        console.log('%c📊 Layout Shift Detected', 'color: #ff6b6b; font-weight: bold');
        console.log('Shift Value:', shiftValue.toFixed(4));
        console.log('Cumulative CLS:', clsScore.toFixed(4));
        console.log('Sources:', entry.sources);

        // Highlight the shifted elements
        entry.sources.forEach(source => {
          if (source.node) {
            source.node.style.outline = '2px solid red';
            source.node.style.outlineOffset = '2px';
            setTimeout(() => {
              source.node.style.outline = '';
              source.node.style.outlineOffset = '';
            }, 3000);
          }
        });
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['layout-shift'] });
    console.log('%c✅ Performance Observer started', 'color: #00ffcc');
  } catch (error) {
    console.error('%c❌ Failed to start Performance Observer:', 'color: #ff6b6b', error);
  }

  // Helper function to get CSS selector for a node
  function getSourceSelector(node) {
    if (!node || !node.nodeName) return 'unknown';

    if (node.id) {
      return `#${node.id}`;
    }

    if (node.className) {
      const classes = node.className.split(' ').filter(c => c).join('.');
      if (classes) return `.${classes}`;
    }

    return node.nodeName.toLowerCase();
  }

  // Wait for page to load, then report
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('%c🎯 CLS Debugging Report', 'color: #00ffcc; font-size: 18px; font-weight: bold');
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffcc');
      console.log('Total Layout Shifts:', layoutShifts.length);
      console.log('Final CLS Score:', clsScore.toFixed(4));
      console.log('');
      console.log('%cDetailed Shift Events:', 'color: #00ffcc; font-weight: bold');
      console.table(layoutShifts.map((shift, index) => ({
        '#': index + 1,
        Score: shift.score.toFixed(4),
        Cumulative: shift.cumulative.toFixed(4),
        Element: shift.sources[0]?.selector || 'unknown',
        'Width Change': `${shift.sources[0]?.previousRect.width}px → ${shift.sources[0]?.currentRect.width}px`,
        'Height Change': `${shift.sources[0]?.previousRect.height}px → ${shift.sources[0]?.currentRect.height}px`
      })));

      // Export to clipboard
      const reportData = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        clsScore: clsScore.toFixed(4),
        totalShifts: layoutShifts.length,
        shifts: layoutShifts
      };

      console.log('%c💾 Copy this data for analysis:', 'color: #00ffcc');
      console.log(JSON.stringify(reportData, null, 2));

      // Also export as a downloadable file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cls-debug-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('%c✅ CLS report downloaded as JSON file', 'color: #00ffcc');
    }, 2000);
  });

  // Monitor main content width changes
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    let lastWidth = mainContent.offsetWidth;
    const widthObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - lastWidth) > 50) { // Only log significant changes
          console.log('%c📏 Main Content Width Change', 'color: #ff6b6b; font-weight: bold');
          console.log('Previous:', lastWidth, 'px → New:', newWidth, 'px');
          console.log('Difference:', (newWidth - lastWidth), 'px');
          lastWidth = newWidth;
        }
      }
    });
    widthObserver.observe(mainContent);
    console.log('%c✅ Width monitoring started for .main-content', 'color: #00ffcc');
  } else {
    console.warn('%c⚠️ .main-content element not found', 'color: #ff6b6b');
  }

  // Monitor news grid
  const newsGrid = document.querySelector('.news-list__grid');
  if (newsGrid) {
    let lastGridWidth = newsGrid.offsetWidth;
    const gridObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - lastGridWidth) > 20) {
          console.log('%c📏 News Grid Width Change', 'color: #ff6b6b; font-weight: bold');
          console.log('Previous:', lastGridWidth, 'px → New:', newWidth, 'px');
          lastGridWidth = newWidth;
        }
      }
    });
    gridObserver.observe(newsGrid);
    console.log('%c✅ Width monitoring started for .news-list__grid', 'color: #00ffcc');
  }

  // Monitor about page sections
  const aboutSections = document.querySelectorAll('.about section, .about-hero');
  if (aboutSections.length > 0) {
    console.log('%c✅ Found', aboutSections.length, 'about page sections to monitor', 'color: #00ffcc');
    aboutSections.forEach((section, index) => {
      const sectionObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          console.log(`%c📏 About Section ${index + 1} Size Change`, 'color: #ff6b6b');
          console.log('Width:', Math.round(width), 'px, Height:', Math.round(height), 'px');
        }
      });
      sectionObserver.observe(section);
    });
  }

  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffcc');
  console.log('%c🔧 Monitoring active. Page will auto-report after 2 seconds.', 'color: #00ffcc');
  console.log('%c💡 Tip: Open DevTools Network tab and set "Slow 3G" to exaggerate shifts', 'color: #00ffcc');
})();
