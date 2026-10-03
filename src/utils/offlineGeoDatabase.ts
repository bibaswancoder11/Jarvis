/**
 * Sovereign Offline Geographic Database
 * 
 * Provides an open-source, bundled spatial dataset of countries, states,
 * cities, urban localities, and street networks for 100% offline reverse geocoding.
 * Includes IndexedDB persistent storage for loading custom local OpenStreetMap slices.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoBoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface CountryBoundary {
  code: string;
  name: string;
  bbox: GeoBoundingBox;
  centroid: GeoPoint;
}

export interface StateBoundary {
  name: string;
  countryCode: string;
  bbox: GeoBoundingBox;
  centroid: GeoPoint;
}

export interface CityBoundary {
  name: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

export interface LocalityFeature {
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  radiusMeters: number;
}

export interface RoadFeature {
  id: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  type: 'arterial' | 'avenue' | 'residential' | 'highway' | 'boulevard' | 'street';
  // List of coordinate pairs representing road polyline / nodes
  coordinates: Array<[number, number]>; // [lat, lon]
}

// 1. GLOBAL COUNTRIES DATASET (Centroids & Bounding Boxes)
export const OFFLINE_COUNTRIES: CountryBoundary[] = [
  {
    code: 'IN',
    name: 'India',
    bbox: { minLat: 6.75, minLon: 68.16, maxLat: 35.67, maxLon: 97.40 },
    centroid: { lat: 20.5937, lon: 78.9629 },
  },
  {
    code: 'US',
    name: 'United States',
    bbox: { minLat: 24.52, minLon: -124.78, maxLat: 49.38, maxLon: -66.95 },
    centroid: { lat: 37.0902, lon: -95.7129 },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    bbox: { minLat: 49.95, minLon: -7.57, maxLat: 58.64, maxLon: 1.76 },
    centroid: { lat: 55.3781, lon: -3.4360 },
  },
  {
    code: 'CA',
    name: 'Canada',
    bbox: { minLat: 41.67, minLon: -141.00, maxLat: 83.11, maxLon: -52.62 },
    centroid: { lat: 56.1304, lon: -106.3468 },
  },
  {
    code: 'AU',
    name: 'Australia',
    bbox: { minLat: -43.63, minLon: 113.33, maxLat: -10.66, maxLon: 153.64 },
    centroid: { lat: -25.2744, lon: 133.7751 },
  },
  {
    code: 'DE',
    name: 'Germany',
    bbox: { minLat: 47.27, minLon: 5.86, maxLat: 55.05, maxLon: 15.04 },
    centroid: { lat: 51.1657, lon: 10.4515 },
  },
  {
    code: 'FR',
    name: 'France',
    bbox: { minLat: 41.33, minLon: -5.14, maxLat: 51.08, maxLon: 9.56 },
    centroid: { lat: 46.2276, lon: 2.2137 },
  },
  {
    code: 'JP',
    name: 'Japan',
    bbox: { minLat: 24.04, minLon: 122.93, maxLat: 45.52, maxLon: 153.98 },
    centroid: { lat: 36.2048, lon: 138.2529 },
  },
  {
    code: 'SG',
    name: 'Singapore',
    bbox: { minLat: 1.13, minLon: 103.60, maxLat: 1.47, maxLon: 104.04 },
    centroid: { lat: 1.3521, lon: 103.8198 },
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    bbox: { minLat: 22.63, minLon: 51.58, maxLat: 26.08, maxLon: 56.38 },
    centroid: { lat: 23.4241, lon: 53.8478 },
  },
];

// 2. MAJOR STATES & PROVINCES
export const OFFLINE_STATES: StateBoundary[] = [
  // India
  {
    name: 'West Bengal',
    countryCode: 'IN',
    bbox: { minLat: 21.50, minLon: 85.80, maxLat: 27.20, maxLon: 89.88 },
    centroid: { lat: 22.9868, lon: 87.8550 },
  },
  {
    name: 'Maharashtra',
    countryCode: 'IN',
    bbox: { minLat: 15.60, minLon: 72.60, maxLat: 22.03, maxLon: 80.90 },
    centroid: { lat: 19.7515, lon: 75.7139 },
  },
  {
    name: 'Delhi',
    countryCode: 'IN',
    bbox: { minLat: 28.40, minLon: 76.84, maxLat: 28.88, maxLon: 77.35 },
    centroid: { lat: 28.7041, lon: 77.1025 },
  },
  {
    name: 'Karnataka',
    countryCode: 'IN',
    bbox: { minLat: 11.59, minLon: 74.05, maxLat: 18.45, maxLon: 78.58 },
    centroid: { lat: 15.3173, lon: 75.7139 },
  },
  {
    name: 'Tamil Nadu',
    countryCode: 'IN',
    bbox: { minLat: 8.08, minLon: 76.24, maxLat: 13.57, maxLon: 80.34 },
    centroid: { lat: 11.1271, lon: 78.6569 },
  },
  {
    name: 'Telangana',
    countryCode: 'IN',
    bbox: { minLat: 15.83, minLon: 77.23, maxLat: 19.91, maxLon: 81.32 },
    centroid: { lat: 18.1124, lon: 79.0193 },
  },
  {
    name: 'Gujarat',
    countryCode: 'IN',
    bbox: { minLat: 20.08, minLon: 68.16, maxLat: 24.71, maxLon: 74.47 },
    centroid: { lat: 22.2587, lon: 71.1924 },
  },
  // United States
  {
    name: 'California',
    countryCode: 'US',
    bbox: { minLat: 32.53, minLon: -124.41, maxLat: 42.01, maxLon: -114.13 },
    centroid: { lat: 36.7783, lon: -119.4179 },
  },
  {
    name: 'New York',
    countryCode: 'US',
    bbox: { minLat: 40.50, minLon: -79.76, maxLat: 45.02, maxLon: -71.86 },
    centroid: { lat: 40.7128, lon: -74.0060 },
  },
  {
    name: 'Texas',
    countryCode: 'US',
    bbox: { minLat: 25.84, minLon: -106.65, maxLat: 36.50, maxLon: -93.51 },
    centroid: { lat: 31.9686, lon: -99.9018 },
  },
  {
    name: 'Washington',
    countryCode: 'US',
    bbox: { minLat: 45.54, minLon: -124.85, maxLat: 49.00, maxLon: -116.92 },
    centroid: { lat: 47.7511, lon: -120.7401 },
  },
  // United Kingdom
  {
    name: 'Greater London',
    countryCode: 'GB',
    bbox: { minLat: 51.28, minLon: -0.51, maxLat: 51.69, maxLon: 0.33 },
    centroid: { lat: 51.5074, lon: -0.1278 },
  },
];

// 3. MAJOR CITIES DATASET
export const OFFLINE_CITIES: CityBoundary[] = [
  // India
  { name: 'Kolkata', state: 'West Bengal', country: 'India', countryCode: 'IN', lat: 22.5726, lon: 88.3639, radiusKm: 28 },
  { name: 'Howrah', state: 'West Bengal', country: 'India', countryCode: 'IN', lat: 22.5958, lon: 88.2636, radiusKm: 18 },
  { name: 'Siliguri', state: 'West Bengal', country: 'India', countryCode: 'IN', lat: 26.7271, lon: 88.3953, radiusKm: 15 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', countryCode: 'IN', lat: 19.0760, lon: 72.8777, radiusKm: 35 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', countryCode: 'IN', lat: 18.5204, lon: 73.8567, radiusKm: 25 },
  { name: 'New Delhi', state: 'Delhi', country: 'India', countryCode: 'IN', lat: 28.6139, lon: 77.2090, radiusKm: 30 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', countryCode: 'IN', lat: 12.9716, lon: 77.5946, radiusKm: 32 },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', countryCode: 'IN', lat: 17.3850, lon: 78.4867, radiusKm: 30 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', countryCode: 'IN', lat: 13.0827, lon: 80.2707, radiusKm: 28 },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', countryCode: 'IN', lat: 23.0225, lon: 72.5714, radiusKm: 25 },

  // United States
  { name: 'San Francisco', state: 'California', country: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194, radiusKm: 18 },
  { name: 'San Jose', state: 'California', country: 'United States', countryCode: 'US', lat: 37.3382, lon: -121.8863, radiusKm: 25 },
  { name: 'Los Angeles', state: 'California', country: 'United States', countryCode: 'US', lat: 34.0522, lon: -118.2437, radiusKm: 45 },
  { name: 'New York City', state: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060, radiusKm: 35 },
  { name: 'Austin', state: 'Texas', country: 'United States', countryCode: 'US', lat: 30.2672, lon: -97.7431, radiusKm: 25 },
  { name: 'Seattle', state: 'Washington', country: 'United States', countryCode: 'US', lat: 47.6062, lon: -122.3321, radiusKm: 25 },

  // United Kingdom
  { name: 'London', state: 'Greater London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lon: -0.1278, radiusKm: 30 },

  // Japan & International
  { name: 'Tokyo', state: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503, radiusKm: 40 },
  { name: 'Paris', state: 'Île-de-France', country: 'France', countryCode: 'FR', lat: 48.8566, lon: 2.3522, radiusKm: 25 },
  { name: 'Singapore', state: 'Central Region', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lon: 103.8198, radiusKm: 20 },
  { name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lon: 55.2708, radiusKm: 30 },
  { name: 'Sydney', state: 'New South Wales', country: 'Australia', countryCode: 'AU', lat: -33.8688, lon: 151.2093, radiusKm: 35 },
];

// 4. URBAN LOCALITIES & NEIGHBORHOODS
export const OFFLINE_LOCALITIES: LocalityFeature[] = [
  // Kolkata Localities
  { name: 'Park Street Area', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5510, lon: 88.3524, radiusMeters: 1200 },
  { name: 'Chowringhee', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5580, lon: 88.3510, radiusMeters: 1000 },
  { name: 'Esplanade', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5645, lon: 88.3522, radiusMeters: 1000 },
  { name: 'Camac Street', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5480, lon: 88.3540, radiusMeters: 800 },
  { name: 'Ballygunge', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5280, lon: 88.3650, radiusMeters: 1500 },
  { name: 'Alipore', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5330, lon: 88.3320, radiusMeters: 1500 },
  { name: 'Salt Lake (Bidhannagar)', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5800, lon: 88.4200, radiusMeters: 3000 },
  { name: 'Sector V', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5780, lon: 88.4320, radiusMeters: 1500 },
  { name: 'New Town Action Area I', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5850, lon: 88.4600, radiusMeters: 2500 },
  { name: 'Gariahat', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5186, lon: 88.3644, radiusMeters: 1000 },
  { name: 'Shyambazar', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.6025, lon: 88.3725, radiusMeters: 1200 },
  { name: 'College Street', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5744, lon: 88.3639, radiusMeters: 800 },

  // San Francisco Localities
  { name: 'Financial District', city: 'San Francisco', state: 'California', country: 'United States', lat: 37.7946, lon: -122.4000, radiusMeters: 1200 },
  { name: 'SoMa (South of Market)', city: 'San Francisco', state: 'California', country: 'United States', lat: 37.7785, lon: -122.4056, radiusMeters: 1800 },
  { name: 'Mission District', city: 'San Francisco', state: 'California', country: 'United States', lat: 37.7599, lon: -122.4148, radiusMeters: 1500 },
  { name: 'Union Square', city: 'San Francisco', state: 'California', country: 'United States', lat: 37.7879, lon: -122.4075, radiusMeters: 700 },

  // New York Localities
  { name: 'Manhattan Midtown', city: 'New York City', state: 'New York', country: 'United States', lat: 40.7549, lon: -73.9840, radiusMeters: 1800 },
  { name: 'Lower Manhattan (Financial Dist.)', city: 'New York City', state: 'New York', country: 'United States', lat: 40.7075, lon: -74.0090, radiusMeters: 1200 },

  // London Localities
  { name: 'Westminster', city: 'London', state: 'Greater London', country: 'United Kingdom', lat: 51.4975, lon: -0.1357, radiusMeters: 1500 },
  { name: 'City of London', city: 'London', state: 'Greater London', country: 'United Kingdom', lat: 51.5155, lon: -0.0922, radiusMeters: 1200 },
];

// 5. ROAD & STREET NETWORK (Offline Spatial Polyline Segments)
export const OFFLINE_ROADS: RoadFeature[] = [
  // --- Kolkata Streets ---
  {
    id: 'kol-road-01',
    name: 'Park Street',
    locality: 'Park Street Area',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'arterial',
    coordinates: [
      [22.5510, 88.3524], // Chowringhee junction
      [22.5518, 88.3562], // Camac St junction
      [22.5526, 88.3610], // Loudon St junction
      [22.5535, 88.3650], // Mullick Bazar / AJC Bose Road crossing
    ],
  },
  {
    id: 'kol-road-02',
    name: 'Camac Street',
    locality: 'Park Street Area',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'avenue',
    coordinates: [
      [22.5518, 88.3562], // Park St junction
      [22.5480, 88.3540], // Middle Camac St
      [22.5435, 88.3518], // AJC Bose Road junction
    ],
  },
  {
    id: 'kol-road-03',
    name: 'Chowringhee Road',
    locality: 'Chowringhee',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'arterial',
    coordinates: [
      [22.5645, 88.3522], // Esplanade
      [22.5580, 88.3510], // Indian Museum
      [22.5510, 88.3524], // Park Street Crossing
      [22.5440, 88.3490], // Exide Crossing
    ],
  },
  {
    id: 'kol-road-04',
    name: 'Shakespeare Sarani',
    locality: 'Park Street Area',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'arterial',
    coordinates: [
      [22.5440, 88.3490], // Exide
      [22.5445, 88.3560], // Camac St / Shakespeare Sarani
      [22.5452, 88.3640], // Mullick Bazar
    ],
  },
  {
    id: 'kol-road-05',
    name: 'AJC Bose Road',
    locality: 'Ballygunge',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'highway',
    coordinates: [
      [22.5435, 88.3430], // Racecourse
      [22.5440, 88.3490], // Exide
      [22.5435, 88.3518], // Camac St
      [22.5450, 88.3650], // Mullick Bazar
      [22.5470, 88.3730], // Park Circus 7-point crossing
    ],
  },
  {
    id: 'kol-road-06',
    name: 'College Street',
    locality: 'College Street',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'avenue',
    coordinates: [
      [22.5680, 88.3620], // Bowbazar
      [22.5744, 88.3639], // Calcutta University / Coffee House
      [22.5790, 88.3660], // MG Road Crossing
    ],
  },
  {
    id: 'kol-road-07',
    name: 'Major Arterial Road (Biswa Bangla Sarani)',
    locality: 'New Town Action Area I',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'highway',
    coordinates: [
      [22.5720, 88.4500], // Salt Lake bypass
      [22.5850, 88.4600], // New Town Gate
      [22.5950, 88.4720], // Eco Park
    ],
  },
  {
    id: 'kol-road-08',
    name: 'Gariahat Road',
    locality: 'Gariahat',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'arterial',
    coordinates: [
      [22.5280, 88.3650], // Ballygunge Phari
      [22.5186, 88.3644], // Gariahat Crossing
      [22.5100, 88.3650], // Golpark
    ],
  },

  // --- San Francisco Streets ---
  {
    id: 'sf-road-01',
    name: 'Market Street',
    locality: 'Financial District',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    type: 'boulevard',
    coordinates: [
      [37.7955, -122.3937], // Ferry Building
      [37.7897, -122.4011], // 1st / Montgomery
      [37.7850, -122.4070], // 4th / Powell
      [37.7760, -122.4180], // 9th / Civic Center
    ],
  },
  {
    id: 'sf-road-02',
    name: 'Mission Street',
    locality: 'Mission District',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    type: 'arterial',
    coordinates: [
      [37.7800, -122.4110], // 8th St
      [37.7650, -122.4190], // 16th Mission
      [37.7520, -122.4185], // 24th Mission
    ],
  },

  // --- New York Streets ---
  {
    id: 'nyc-road-01',
    name: 'Broadway',
    locality: 'Manhattan Midtown',
    city: 'New York City',
    state: 'New York',
    country: 'United States',
    type: 'boulevard',
    coordinates: [
      [40.7580, -73.9855], // Times Square
      [40.7505, -73.9880], // Herald Square
      [40.7420, -73.9890], // Flatiron
    ],
  },
  {
    id: 'nyc-road-02',
    name: '5th Avenue',
    locality: 'Manhattan Midtown',
    city: 'New York City',
    state: 'New York',
    country: 'United States',
    type: 'avenue',
    coordinates: [
      [40.7740, -73.9653], // Central Park East
      [40.7610, -73.9750], // Rockefeller Center
      [40.7484, -73.9857], // Empire State Building
    ],
  },

  // --- London Streets ---
  {
    id: 'lon-road-01',
    name: 'Oxford Street',
    locality: 'Westminster',
    city: 'London',
    state: 'Greater London',
    country: 'United Kingdom',
    type: 'arterial',
    coordinates: [
      [51.5135, -0.1585], // Marble Arch
      [51.5145, -0.1500], // Bond Street
      [51.5155, -0.1415], // Oxford Circus
      [51.5165, -0.1300], // Tottenham Court Road
    ],
  },
];

// --- IndexedDB Cache for Custom Regional OSM Datasets ---
const DB_NAME = 'JarvisOfflineSpatialDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_osm_features';

export function openOfflineSpatialDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Stores custom GeoJSON / OSM road features in IndexedDB for 100% offline access.
 */
export async function saveCustomRoadFeatures(roads: RoadFeature[]): Promise<boolean> {
  const db = await openOfflineSpatialDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      roads.forEach((road) => store.put(road));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Loads custom roads stored in IndexedDB.
 */
export async function getCustomRoadFeatures(): Promise<RoadFeature[]> {
  const db = await openOfflineSpatialDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}
