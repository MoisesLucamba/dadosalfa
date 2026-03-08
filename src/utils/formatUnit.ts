/**
 * Global unit formatting utility for consistent display across the platform.
 * All numeric values should pass through this before rendering.
 */

export type UnitType =
  | 'production'    // bbl/d
  | 'gas'           // MMscf/d
  | 'pressure'      // bar (with optional psi)
  | 'temperature'   // °C
  | 'depth'         // m MD
  | 'depthTVD'      // m TVD
  | 'api'           // ° API
  | 'price'         // USD
  | 'percentage'    // %
  | 'volume'        // bbl
  | 'waterCut'      // %
  | 'gor'           // scf/bbl
  | 'number'        // generic with separators
  | 'compact';      // auto K/M/B

const LOCALE = 'en-US'; // consistent number formatting

function addCommas(n: number, decimals = 0): string {
  return n.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUnit(value: number | null | undefined, type: UnitType): string {
  if (value == null || isNaN(value)) return 'N/A';

  switch (type) {
    case 'production':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MMbbl/d`;
      return `${addCommas(value)} bbl/d`;

    case 'gas':
      return `${(value / 1_000_000).toFixed(2)} MMscf/d`;

    case 'pressure':
      return `${addCommas(value)} bar`;

    case 'temperature':
      return `${addCommas(value, 1)}°C`;

    case 'depth':
      return `${addCommas(value)} m MD`;

    case 'depthTVD':
      return `${addCommas(value)} m TVD`;

    case 'api':
      return `${value.toFixed(1)}° API`;

    case 'price':
      return `$${addCommas(value, 2)}`;

    case 'percentage':
    case 'waterCut':
      return `${value.toFixed(1)}%`;

    case 'gor':
      return `${addCommas(value)} scf/bbl`;

    case 'volume':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MMbbl`;
      if (value >= 1_000) return `${addCommas(value)} bbl`;
      return `${value.toFixed(0)} bbl`;

    case 'compact':
      if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
      if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toFixed(0);

    case 'number':
      return addCommas(value, Number.isInteger(value) ? 0 : 2);

    default:
      return String(value);
  }
}

/** Get pressure in psi as secondary display */
export function barToPsi(bar: number): string {
  return `(${addCommas(bar * 14.5038, 0)} psi)`;
}

/** Format "Updated X seconds ago" for live indicators */
export function formatLastUpdated(seconds: number, lang: string = 'pt'): string {
  if (lang === 'en') {
    if (seconds < 60) return `Updated ${seconds}s ago`;
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
    return `Updated ${Math.floor(seconds / 3600)}h ago`;
  }
  if (lang === 'fr') {
    if (seconds < 60) return `Mis à jour il y a ${seconds}s`;
    if (seconds < 3600) return `Mis à jour il y a ${Math.floor(seconds / 60)}m`;
    return `Mis à jour il y a ${Math.floor(seconds / 3600)}h`;
  }
  // pt default
  if (seconds < 60) return `Actualizado há ${seconds}s`;
  if (seconds < 3600) return `Actualizado há ${Math.floor(seconds / 60)}m`;
  return `Actualizado há ${Math.floor(seconds / 3600)}h`;
}
