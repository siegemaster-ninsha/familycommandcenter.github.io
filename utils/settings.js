// Lightweight SettingsClient utility for consistent account settings operations
// Exposes as window.SettingsClient for use across components
(function () {
  const base = () => CONFIG.API.BASE_URL.replace(/\/$/, '');
  const authHeader = () => authService && authService.getAuthHeader ? authService.getAuthHeader() : null;

  async function call(path, options = {}, accountId) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const auth = authHeader();
    if (auth) headers.Authorization = auth;
    if (accountId) headers['X-Account-Id'] = accountId;

    const res = await fetch(`${base()}${path}`, { ...options, headers });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const j = await res.json(); if (j && j.error) msg = j.error; } catch {}
      const err = new Error(`API error: ${msg}`);
      err.status = res.status; err.response = res;
      throw err;
    }
    try { return await res.json(); } catch { return {}; }
  }

  window.SettingsClient = {
    async get(accountId) {
      return call(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS, { method: 'GET' }, accountId);
    },
    async updateProfile(accountId, profilePartial, opts = {}) {
      const headers = {};
      if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
      return call(`${CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS}/${encodeURIComponent(accountId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ profile: profilePartial })
      }, accountId);
    },
    async updatePreferences(accountId, preferencesPartial, opts = {}) {
      const headers = {};
      if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
      return call(`${CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS}/${encodeURIComponent(accountId)}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ preferences: preferencesPartial })
      }, accountId);
    },
    async updateMemberVisibility(accountId, memberId, enabled, opts = {}) {
      const headers = {};
      if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
      return call(`${CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS}/${encodeURIComponent(accountId)}/preferences/members/${encodeURIComponent(memberId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enabled: !!enabled })
      }, accountId);
    },
    async setUserTheme(themeId) {
      return call(`${CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS}/theme`, {
        method: 'PUT',
        body: JSON.stringify({ theme: themeId })
      });
    }
  };
})();

