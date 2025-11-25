import { PrayerEntry } from "../types";

const STORAGE_KEY = 'soulscribe_prayers_v1';

// Simulates a database delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const savePrayerToHistory = async (entry: PrayerEntry): Promise<void> => {
  await delay(300); // Fake network latency
  const existing = getPrayersFromHistorySync();
  const updated = [entry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const updatePrayerInHistory = async (updatedEntry: PrayerEntry): Promise<void> => {
  await delay(200);
  const existing = getPrayersFromHistorySync();
  const index = existing.findIndex(p => p.id === updatedEntry.id);
  if (index !== -1) {
    existing[index] = updatedEntry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
};

export const getPrayersFromHistory = async (): Promise<PrayerEntry[]> => {
  await delay(300);
  return getPrayersFromHistorySync();
};

const getPrayersFromHistorySync = (): PrayerEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const deletePrayerFromHistory = async (id: string): Promise<void> => {
  await delay(200);
  const existing = getPrayersFromHistorySync();
  const updated = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};