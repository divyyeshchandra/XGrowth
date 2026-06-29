import { create } from "zustand";
import type { Provider } from "@/types";
import { loadStoredKeys, saveStoredKeys } from "@/lib/storage";

interface SettingsState {
  provider: Provider;
  keys: Partial<Record<Provider, string>>;
  customBaseUrl: string;
  customModel: string;
  isSettingsOpen: boolean;
  hydrated: boolean;

  hydrate: () => void;
  setProvider: (provider: Provider) => void;
  setKeyForProvider: (provider: Provider, key: string) => void;
  setCustomBaseUrl: (url: string) => void;
  setCustomModel: (model: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
  clearAllKeys: () => void;

  // Computed
  currentApiKey: () => string;
  isBYOK: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: "groq",
  keys: {},
  customBaseUrl: "",
  customModel: "",
  isSettingsOpen: false,
  hydrated: false,

  hydrate: () => {
    const stored = loadStoredKeys();
    set({
      provider: stored.provider,
      keys: stored.keys,
      customBaseUrl: stored.customBaseUrl || "",
      customModel: stored.customModel || "",
      hydrated: true,
    });
  },

  setProvider: (provider) => {
    set({ provider });
    const state = get();
    saveStoredKeys({
      provider,
      keys: state.keys,
      customBaseUrl: state.customBaseUrl,
      customModel: state.customModel,
    });
  },

  setKeyForProvider: (provider, key) => {
    const newKeys = { ...get().keys, [provider]: key };
    set({ keys: newKeys });
    const state = get();
    saveStoredKeys({
      provider: state.provider,
      keys: newKeys,
      customBaseUrl: state.customBaseUrl,
      customModel: state.customModel,
    });
  },

  setCustomBaseUrl: (customBaseUrl) => {
    set({ customBaseUrl });
    const state = get();
    saveStoredKeys({
      provider: state.provider,
      keys: state.keys,
      customBaseUrl,
      customModel: state.customModel,
    });
  },

  setCustomModel: (customModel) => {
    set({ customModel });
    const state = get();
    saveStoredKeys({
      provider: state.provider,
      keys: state.keys,
      customBaseUrl: state.customBaseUrl,
      customModel,
    });
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  clearAllKeys: () => {
    set({ keys: {}, customBaseUrl: "", customModel: "" });
    saveStoredKeys({
      provider: get().provider,
      keys: {},
    });
  },

  currentApiKey: () => {
    const state = get();
    return state.keys[state.provider] || "";
  },

  isBYOK: () => {
    const state = get();
    return !!state.keys[state.provider];
  },
}));
