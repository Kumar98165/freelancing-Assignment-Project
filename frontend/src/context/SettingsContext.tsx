import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import settingsService, { type StoreSettings } from '../services/settingsService';

// Default fallback values (used while loading or on API error)
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'TZA Mart Supermarket',
  branchName: 'Kariakoo Main Flagship, Dar es Salaam',
  currency: 'TZS',
  storePhone: '+255 754 892 100',
  storeEmail: 'info@tzamart.co.tz',
  storeAddress: 'Plot 42, Msimbazi Street, Kariakoo',
  tin: '102-394-857',
  vrn: '40012983-T',
  vatRate: '18',
  vfdServerUrl: 'https://vfd.tra.go.tz/api/v1',
  vfdDeviceId: 'EFD-TZ-DAR-001',
  receiptPaperWidth: '80mm',
  receiptHeaderTagline: 'Fresh Groceries & Household Essentials',
  receiptFooter: 'Asante kwa kununua nasi TzSuperPOS! Karibu tena.',
};

const LS_KEY = 'store_settings_cache';

interface SettingsContextValue {
  settings: StoreSettings;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  refetch: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    // Instantly hydrate from localStorage cache (no flicker)
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) return JSON.parse(cached) as StoreSettings;
    } catch {
      // ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      if (data) {
        setSettings(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('[SettingsContext] Could not load settings from API, using cache/defaults.', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch fresh settings once on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Call this hook inside any component to access live store settings */
export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;

