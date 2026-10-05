import {
  OFFLINE_COUNTRIES,
  OFFLINE_STATES,
  OFFLINE_CITIES,
  OFFLINE_LOCALITIES,
  OFFLINE_ROADS,
  getCustomRoadFeatures,
  RoadFeature,
  LocalityFeature,
  CityBoundary,
  CountryBoundary,
  StateBoundary,
} from './offlineGeoDatabase';
import { OfflineLocationData, GeoLocationResult } from '../types';

/**
 * Calculates Great-Circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the shortest geodesic distance from a point to a line segment in meters.
 */
function distancePointToSegmentMeters(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  // Approximate planar projection for local segments (< 5 km)
  const avgLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const metersPerDegLat = 111132.954;
  const metersPerDegLon = 111412.84 * Math.cos(avgLat);

  const px = (pLon - aLon) * metersPerDegLon;
  const py = (pLat - aLat) * metersPerDegLat;
  const bx = (bLon - aLon) * metersPerDegLon;
  const by = (bLat - aLat) * metersPerDegLat;

  const segmentLengthSq = bx * bx + by * by;
  if (segmentLengthSq === 0) {
    return Math.sqrt(px * px + py * py);
  }

  // Projection scalar t on segment AB
  let t = (px * bx + py * by) / segmentLengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bx;
  const projY = t * by;
  const dx = px - projX;
  const dy = py - projY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds the nearest road by evaluating all road segments in the offline database.
 */
function findNearestRoad(
  lat: number,
  lon: number,
  allRoads: RoadFeature[]
): { road: RoadFeature | null; distanceMeters: number } {
  let nearestRoad: RoadFeature | null = null;
  let minDistance = Infinity;

  for (const road of allRoads) {
    const coords = road.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const [aLat, aLon] = coords[i];
      const [bLat, bLon] = coords[i + 1];
      const dist = distancePointToSegmentMeters(lat, lon, aLat, aLon, bLat, bLon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestRoad = road;
      }
    }
    // Also check distance to individual point vertices
    for (const [vLat, vLon] of coords) {
      const dist = calculateHaversineDistanceMeters(lat, lon, vLat, vLon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestRoad = road;
      }
    }
  }

  return { road: nearestRoad, distanceMeters: minDistance };
}

/**
 * Finds the nearest locality/neighborhood in the offline database.
 */
function findNearestLocality(
  lat: number,
  lon: number,
  localities: LocalityFeature[]
): { locality: LocalityFeature | null; distanceMeters: number } {
  let nearest: LocalityFeature | null = null;
  let minDistance = Infinity;

  for (const loc of localities) {
    const dist = calculateHaversineDistanceMeters(lat, lon, loc.lat, loc.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }

  return { locality: nearest, distanceMeters: minDistance };
}

/**
 * Finds the nearest city in the offline database.
 */
function findNearestCity(
  lat: number,
  lon: number,
  cities: CityBoundary[]
): { city: CityBoundary | null; distanceMeters: number } {
  let nearest: CityBoundary | null = null;
  let minDistance = Infinity;

  for (const city of cities) {
    const dist = calculateHaversineDistanceMeters(lat, lon, city.lat, city.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return { city: nearest, distanceMeters: minDistance };
}

/**
 * Determines Country and State based on point containment and bounding boxes.
 */
function findCountryAndState(lat: number, lon: number): { country: string; state: string } {
  let matchedCountry = 'Unknown';
  let matchedState = 'Unknown';

  // Find country
  let minCountryDist = Infinity;
  for (const country of OFFLINE_COUNTRIES) {
    const { minLat, minLon, maxLat, maxLon } = country.bbox;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      matchedCountry = country.name;
      break;
    }
    const dist = calculateHaversineDistanceMeters(lat, lon, country.centroid.lat, country.centroid.lon);
    if (dist < minCountryDist) {
      minCountryDist = dist;
      matchedCountry = country.name;
    }
  }

  // Find state within country or globally
  let minStateDist = Infinity;
  for (const state of OFFLINE_STATES) {
    const { minLat, minLon, maxLat, maxLon } = state.bbox;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      matchedState = state.name;
      break;
    }
    const dist = calculateHaversineDistanceMeters(lat, lon, state.centroid.lat, state.centroid.lon);
    if (dist < minStateDist && dist < 500000) { // within 500km
      minStateDist = dist;
      matchedState = state.name;
    }
  }

  return { country: matchedCountry, state: matchedState };
}

/**
 * Performs 100% offline reverse-geocoding against the bundled & IndexedDB spatial datasets.
 */
export async function reverseGeocodeOffline(coords: {
  latitude: number;
  longitude: number;
  accuracy: number;
}): Promise<OfflineLocationData> {
  const { latitude, longitude, accuracy } = coords;

  // Retrieve bundled roads + custom IndexedDB roads
  const customRoads = await getCustomRoadFeatures();
  const allRoads = [...OFFLINE_ROADS, ...customRoads];

  // 1. Resolve nearest road (threshold: 3000m)
  const nearestRoadResult = findNearestRoad(latitude, longitude, allRoads);
  const roadMatch = nearestRoadResult.road && nearestRoadResult.distanceMeters <= 3000 ? nearestRoadResult.road : null;

  // 2. Resolve nearest locality (threshold: 5000m)
  const nearestLocalityResult = findNearestLocality(latitude, longitude, OFFLINE_LOCALITIES);
  const localityMatch = nearestLocalityResult.locality && nearestLocalityResult.distanceMeters <= 5000 ? nearestLocalityResult.locality : null;

  // 3. Resolve nearest city (threshold: 80km)
  const nearestCityResult = findNearestCity(latitude, longitude, OFFLINE_CITIES);
  const cityMatch = nearestCityResult.city && nearestCityResult.distanceMeters <= 80000 ? nearestCityResult.city : null;

  // 4. Resolve State and Country
  const adminMatch = findCountryAndState(latitude, longitude);

  // Synthesize administrative hierarchy
  const country = roadMatch?.country || localityMatch?.country || cityMatch?.country || adminMatch.country || 'India';
  const state = roadMatch?.state || localityMatch?.state || cityMatch?.state || adminMatch.state || 'West Bengal';
  const city = roadMatch?.city || localityMatch?.city || cityMatch?.name || 'Kolkata';
  const locality = roadMatch?.locality || localityMatch?.name || (cityMatch ? `${cityMatch.name} Central` : undefined);
  const road = roadMatch?.name;

  // Formulate standardized address
  const addressParts: string[] = [];
  if (road) addressParts.push(road);
  if (locality && locality !== road && (!road || !locality.toLowerCase().includes(road.toLowerCase()))) {
    addressParts.push(locality);
  }
  if (city && city !== locality) addressParts.push(city);
  if (state && state !== city) addressParts.push(state);
  if (country) addressParts.push(country);

  const formattedAddress = addressParts.join(', ');
  const distanceToFeatureMeters = roadMatch ? nearestRoadResult.distanceMeters : (localityMatch ? nearestLocalityResult.distanceMeters : 0);

  // Confidence calculation based on proximity to known road/locality
  const confidence = roadMatch
    ? Math.max(0.7, 1 - nearestRoadResult.distanceMeters / 3000)
    : localityMatch
    ? 0.75
    : 0.5;

  return {
    latitude,
    longitude,
    accuracy: Math.round(accuracy),
    road,
    locality,
    city,
    state,
    country,
    formattedAddress,
    confidence: Number(confidence.toFixed(2)),
    distanceToFeatureMeters: Math.round(distanceToFeatureMeters),
    source: 'offline-spatial-db',
  };
}

/**
 * Formats a conversational, natural spoken response for JARVIS matching the user brief.
 * Includes GPS accuracy tolerance and distance calibration.
 */
export function formatJarvisLocationSpeech(location: OfflineLocationData): string {
  const { road, locality, city, state, country, accuracy, distanceToFeatureMeters } = location;

  const formattedAccuracy = Math.round(accuracy);
  const parts: string[] = [];
  if (road) parts.push(road);
  if (locality && locality !== road && (!road || !locality.toLowerCase().includes(road.toLowerCase()))) {
    parts.push(locality);
  }
  if (city) parts.push(city);
  if (state && state !== city) parts.push(state);
  if (country) parts.push(country);

  const placeString = parts.join(', ');

  // Exact street proximity (< 30m)
  if (road && distanceToFeatureMeters <= 30 && accuracy <= 30) {
    return `You are at ${placeString}. Your GPS accuracy is approximately ${formattedAccuracy} metres.`;
  }

  // Near known road (< 500m)
  if (road && distanceToFeatureMeters <= 500) {
    return `You are near ${placeString}. Your GPS accuracy is approximately ${formattedAccuracy} metres.`;
  }

  // Locality / City level
  if (locality) {
    return `You are in ${locality}, ${city}, ${state}, ${country}. Your GPS accuracy is approximately ${formattedAccuracy} metres.`;
  }

  return `You are in ${city}, ${state}, ${country}. Your GPS accuracy is approximately ${formattedAccuracy} metres.`;
}

/**
 * Requests device GPS coordinates through navigator.geolocation with high accuracy.
 */
export function acquireDeviceCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    const nav = typeof window !== 'undefined' ? (window.navigator || navigator) : null;
    if (!nav || !nav.geolocation) {
      const err = new Error('Geolocation is not supported by your browser.');
      (err as any).code = 'NOT_SUPPORTED';
      return reject(err);
    }

    nav.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 15,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Complete Jarvis Location Pipeline:
 * 1. Acquires coordinates via browser Geolocation API (latitude, longitude, accuracy).
 * 2. If internet is on: conducts background search to find road name, city, state, and country.
 * 3. If internet is off: returns ONLY the latitude and longitude.
 * 4. Handles all hardware errors with natural voice responses.
 */
/**
 * Probes internet reachability to accurately distinguish online vs offline mode.
 */
export async function isInternetActive(): Promise<boolean> {
  const nav = typeof window !== 'undefined' ? (window.navigator || navigator) : (typeof navigator !== 'undefined' ? navigator : null);
  if (!nav || nav.onLine === false) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export async function determineUserLocation(): Promise<GeoLocationResult> {
  try {
    const coords = await acquireDeviceCoordinates();
    const hasInternet = await isInternetActive();

    const latStr = coords.latitude.toFixed(5);
    const lonStr = coords.longitude.toFixed(5);
    const accMeters = Math.round(coords.accuracy);

    // If internet is OFF: return ONLY the lat and long as requested!
    if (!hasInternet) {
      const speechText = `You are at latitude ${latStr} degrees, longitude ${lonStr} degrees. Your GPS accuracy is approximately ${accMeters} metres. Internet is currently off, returning only latitude and longitude.`;

      const offlineOnlyData: OfflineLocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: accMeters,
        city: '',
        state: '',
        country: '',
        formattedAddress: `Latitude: ${latStr}°, Longitude: ${lonStr}° (Internet Off)`,
        confidence: 0.99,
        distanceToFeatureMeters: 0,
        source: 'offline-spatial-db',
      };

      return {
        success: true,
        location: offlineOnlyData,
        speechText,
      };
    }

    // If internet is ON: conduct background search to find the name of the road, city, state, and country
    let locationData: OfflineLocationData | null = null;

    try {
      locationData = await reverseGeocodeOnline(coords);
    } catch {
      console.log('[JARVIS Location] Online search error, falling back to local dataset.');
    }

    if (!locationData) {
      locationData = await reverseGeocodeOffline(coords);
    }

    const { road, locality, city, state, country } = locationData;
    const parts: string[] = [];
    if (road) parts.push(road);
    if (locality && locality !== road && (!road || !locality.toLowerCase().includes(road.toLowerCase()))) {
      parts.push(locality);
    }
    if (city) parts.push(city);
    if (state && state !== city) parts.push(state);
    if (country) parts.push(country);

    const addressResolved = parts.join(', ');
    const speechText = `You are at latitude ${latStr} degrees, longitude ${lonStr} degrees. Location: ${addressResolved}. Your GPS accuracy is approximately ${accMeters} metres.`;

    return {
      success: true,
      location: locationData,
      speechText,
    };
  } catch (err: any) {
    let speechText = 'I was unable to determine your current location, sir.';
    let errorType: GeoLocationResult['error'] = 'position_unavailable';

    if (err.code === 1 || err.name === 'PermissionDeniedError' || err.code === 'PERMISSION_DENIED') {
      errorType = 'permission_denied';
      speechText =
        'I was unable to retrieve your coordinates, sir. Geolocation permission was denied by the browser. Please allow location access in your device settings.';
    } else if (err.code === 2 || err.code === 'POSITION_UNAVAILABLE') {
      errorType = 'position_unavailable';
      speechText =
        'Location telemetry is currently unavailable from your device sensors, sir. Please ensure your GPS or location hardware is switched on.';
    } else if (err.code === 3 || err.code === 'TIMEOUT') {
      errorType = 'timeout';
      speechText =
        'Satellite acquisition timed out, sir. Please verify that your device has line-of-sight with GPS satellites or active location sensors.';
    } else if (err.code === 'NOT_SUPPORTED') {
      errorType = 'not_supported';
      speechText = 'Geolocation hardware is not supported on this browser or platform, sir.';
    }

    return {
      success: false,
      speechText,
      error: errorType,
    };
  }
}

/**
 * Recognizes natural language prompts regarding the user's current physical location.
 */
export function isLocationQuery(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('where am i') ||
    p.includes('what is my location') ||
    p.includes('tell me where i am') ||
    p.includes('where are we') ||
    p.includes('my location') ||
    p.includes('current location') ||
    p.includes('gps location') ||
    p.includes('where i am') ||
    p.includes('find my location') ||
    p.includes('get my location') ||
    p.includes('locate me') ||
    p.includes('lat and long') ||
    p.includes('latitude and longitude') ||
    p.includes('coordinates') ||
    p === 'gps' ||
    p.includes('user location')
  );
}

/**
 * Optional Separate Online Mode:
 * If internet is available AND the user requests online precision,
 * queries free OpenStreetMap Nominatim (strictly separate from offline mode).
 */
export async function reverseGeocodeOnline(coords: {
  latitude: number;
  longitude: number;
  accuracy: number;
}): Promise<OfflineLocationData | null> {
  const nav = typeof window !== 'undefined' ? (window.navigator || navigator) : (typeof navigator !== 'undefined' ? navigator : null);
  if (!nav || !nav.onLine) {
    return null;
  }

  // 1. Try BigDataCloud Free Client Reverse Geocoding (Zero keys, no CORS issue, fast)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || 'Local Area';
      const state = data.principalSubdivision || '';
      const country = data.countryName || '';
      const locality = data.locality && data.locality !== city ? data.locality : undefined;

      let road: string | undefined = undefined;
      if (Array.isArray(data.localityInfo?.informative)) {
        const roadItem = data.localityInfo.informative.find(
          (item: any) => (item.description?.includes('road') || item.description?.includes('street') || item.order >= 8) && item.name
        );
        if (roadItem && roadItem.name) road = roadItem.name;
      }

      const parts: string[] = [];
      if (road) parts.push(road);
      if (locality && locality !== road) parts.push(locality);
      if (city && city !== locality) parts.push(city);
      if (state && state !== city) parts.push(state);
      if (country) parts.push(country);

      if (city || state || country) {
        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: Math.round(coords.accuracy),
          road,
          locality,
          city,
          state,
          country,
          formattedAddress: parts.join(', '),
          confidence: 0.98,
          distanceToFeatureMeters: 5,
          source: 'online-fallback',
        };
      }
    }
  } catch {}

  // 2. Try OpenStreetMap Nominatim Free Reverse Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address || {};

    const road = addr.road || addr.pedestrian || addr.suburb || undefined;
    const locality = addr.neighbourhood || addr.suburb || addr.city_district || undefined;
    const city = addr.city || addr.town || addr.village || addr.county || 'Local Area';
    const state = addr.state || addr.region || '';
    const country = addr.country || '';

    const parts: string[] = [];
    if (road) parts.push(road);
    if (locality && locality !== road) parts.push(locality);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy),
      road,
      locality,
      city,
      state,
      country,
      formattedAddress: parts.join(', '),
      confidence: 0.99,
      distanceToFeatureMeters: 5,
      source: 'online-fallback',
    };
  } catch {
    return null;
  }
}

