interface PreferencesConfig {
  showTxDetailsInTerminal: boolean;
}

interface UpdatePreferencesConfig {
  showTxDetailsInTerminal?: boolean;
}

export class PgPreferences {
  private static readonly _PREFERENCES_KEY = "preferences";
  private static readonly _DEFAULT_PREFERENCES: PreferencesConfig = {
    showTxDetailsInTerminal: false,
  };

  static getPreferences(): PreferencesConfig {
    let preferences = localStorage.getItem(this._PREFERENCES_KEY);
    if (!preferences) {
      const preferencesStr = JSON.stringify(this._DEFAULT_PREFERENCES);
      localStorage.setItem(this._PREFERENCES_KEY, preferencesStr);
      preferences = preferencesStr;
    }

    return JSON.parse(preferences);
  }

  static update(params: UpdatePreferencesConfig) {
    const { showTxDetailsInTerminal } = params;
    const preferences = this.getPreferences();

    if (showTxDetailsInTerminal !== undefined) {
      preferences.showTxDetailsInTerminal = showTxDetailsInTerminal;
    }

    localStorage.setItem(this._PREFERENCES_KEY, JSON.stringify(preferences));
  }
}
