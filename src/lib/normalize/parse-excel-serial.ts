// Excel "1900 date system" :
//   serial 1 = 1900-01-01
//   bug : serial 60 = 1900-02-29 (n'existe pas, héritage compatibilité Lotus 1-2-3)
//   on compense en soustrayant 1 jour aux serials >= 60.
//
// Pour les dates modernes (>2000) ce bug est transparent : on a toujours -1.

const EPOCH_1900_UTC_MS = Date.UTC(1900, 0, 1);

export function parseExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const intPart = Math.floor(serial);
  const adjusted = intPart >= 60 ? intPart - 1 : intPart;
  const ms = EPOCH_1900_UTC_MS + (adjusted - 1) * 86400 * 1000;
  const iso = new Date(ms).toISOString();
  return iso.slice(0, 10);
}
