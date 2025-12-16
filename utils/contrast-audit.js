// Simple contrast audit for key token pairings
(function() {
  const toRgb = (h) => {
    const m = h.replace('#','');
    const r = parseInt(m.substring(0,2), 16) / 255;
    const g = parseInt(m.substring(2,4), 16) / 255;
    const b = parseInt(m.substring(4,6), 16) / 255;
    return [r,g,b];
  };

  const luminance = ([r,g,b]) => {
    const a = [r,g,b].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  };

  const ratio = (fg, bg) => {
    const L1 = luminance(toRgb(fg));
    const L2 = luminance(toRgb(bg));
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  };

  try {
    const root = getComputedStyle(document.documentElement);
    const get = (v) => (root.getPropertyValue(v) || '').trim();
    const hex = (str) => {
      if (!str) return null;
      // handle rgb/rgba
      if (str.startsWith('rgb')) {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return null;
        return `#${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`;
      }
      return str;
    };

    const pairs = [
      { name: 'Body text', fg: get('--color-text-primary'), bg: get('--color-bg-primary'), min: 4.5 },
      { name: 'Secondary text', fg: get('--color-text-secondary'), bg: get('--color-bg-primary'), min: 3.0 },
      { name: 'Button primary', fg: '#ffffff', bg: get('--color-primary-500'), min: 4.5 },
      { name: 'Badge success', fg: get('--color-success-700'), bg: get('--color-success-50'), min: 4.5 },
      { name: 'Badge warning', fg: get('--color-warning-700'), bg: get('--color-warning-50'), min: 4.5 },
      { name: 'Badge error', fg: get('--color-error-700'), bg: get('--color-error-50'), min: 4.5 },
      { name: 'Card text', fg: get('--color-text-primary'), bg: get('--color-bg-card'), min: 4.5 },
    ].map(p => ({ ...p, fg: hex(p.fg), bg: hex(p.bg) })).filter(p => p.fg && p.bg && p.fg.startsWith('#') && p.bg.startsWith('#'));

    const results = pairs.map(p => ({ name: p.name, ratio: Number(ratio(p.fg, p.bg).toFixed(2)), pass: ratio(p.fg, p.bg) >= p.min, min: p.min }));
    const fails = results.filter(r => !r.pass);
    // eslint-disable-next-line no-console
    console.groupCollapsed('Contrast audit');
    results.forEach(r => console[r.pass ? 'log' : 'warn'](`${r.name}: ${r.ratio} (min ${r.min})`));
    console.groupEnd();
    if (fails.length) {
      console.warn('Contrast issues found:', fails);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Contrast audit skipped', e);
  }
})();

