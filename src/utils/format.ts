/**
 * Formatuje bajty na czytelny rozmiar (UI).
 * Backend przechowuje INTEGER size_bytes; formatowanie tylko tutaj.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '—';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;

  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

/**
 * Skraca ISO datetime do daty wyświetlanej w tabeli (YYYY-MM-DD).
 */
export function formatModifiedDate(iso: string): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}
