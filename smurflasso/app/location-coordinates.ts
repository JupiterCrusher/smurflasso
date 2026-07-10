export type CampusCoordinate = [longitude: number, latitude: number];

const PLACES: Record<string, CampusCoordinate> = {
  administration: [-116.2048, 43.6037],
  'albertsons library': [-116.2033, 43.6042],
  'albertsons stadium': [-116.1984, 43.6028],
  'appleton tennis center': [-116.2057, 43.5984],
  'brady garage': [-116.2065, 43.6025],
  'caven williams': [-116.2002, 43.6011],
  chaffee: [-116.2067, 43.6075],
  'chaffee hall': [-116.2067, 43.6075],
  'clearwater suites': [-116.2038, 43.6074],
  'city center plaza': [-116.1993, 43.6155],
  'driscoll hall': [-116.2078, 43.6044],
  education: [-116.2051, 43.6041],
  'grant west parking lot': [-116.2008, 43.6051],
  'hawthorn house': [-116.2078, 43.6061],
  'heights bike racks': [-116.2061, 43.6081],
  jasper: [-116.2074, 43.6071],
  'jasper hall': [-116.2074, 43.6071],
  juniper: [-116.2047, 43.6066],
  'keiser hall': [-116.2034, 43.6034],
  'liberal arts parking lot': [-116.2059, 43.6047],
  'lincoln garage': [-116.2001, 43.5992],
  'lincoln townhomes': [-116.2004, 43.5958],
  'main campus': [-116.2028, 43.6034],
  'mec bike rack west side': [-116.2017, 43.6031],
  'micron engineering center': [-116.2014, 43.6032],
  'morrison center': [-116.2041, 43.6014],
  'morrison center parking lot': [-116.2047, 43.6009],
  'morrison center surface parking lot': [-116.2047, 43.6009],
  'on campus': [-116.2028, 43.6034],
  'on campus residence hall': [-116.2055, 43.6065],
  'on campus student housing': [-116.2055, 43.6065],
  osprey: [-116.2056, 43.6069],
  'outside bleymaier': [-116.2071, 43.6034],
  'outside taylor hall': [-116.2044, 43.6051],
  'raptor research parking lot': [-116.1907, 43.6027],
  'rec center': [-116.1988, 43.6001],
  'recreation center': [-116.1988, 43.6001],
  sawtooth: [-116.2054, 43.6061],
  'sawtooth hall': [-116.2054, 43.6061],
  science: [-116.2022, 43.6045],
  'selway suites': [-116.2062, 43.6073],
  'square jasper': [-116.2074, 43.6071],
  stadium: [-116.1984, 43.6028],
  'student union': [-116.2009, 43.6024],
  substation: [-116.1934, 43.6016],
  syringa: [-116.2042, 43.6072],
  'syringa hall': [-116.2042, 43.6072],
  'syringa hall bike rack': [-116.2042, 43.6072],
  'taylor hall': [-116.2044, 43.6051],
  'towers dorm': [-116.2051, 43.6049],
  'towers hall': [-116.2051, 43.6049],
  'towers hall bike rack': [-116.2051, 43.6049],
  'village apartments': [-116.1922, 43.6037],
};

const INTERSECTIONS: Record<string, CampusCoordinate> = {
  '8 main': [-116.2035, 43.6162],
  '8th main': [-116.2035, 43.6162],
  '9 front': [-116.2055, 43.6148],
  '9 royal': [-116.2107, 43.6058],
  '9th royal': [-116.2107, 43.6058],
  'beacon euclid': [-116.1986, 43.5987],
  'beacon lincoln': [-116.2004, 43.5988],
  'boise beacon': [-116.1997, 43.5977],
  'broadway university': [-116.1937, 43.6026],
  'capitol broad': [-116.2071, 43.6119],
  'capitol front': [-116.2037, 43.6142],
  'capitol grove': [-116.2034, 43.6134],
  'capitol main': [-116.2029, 43.6159],
  'capitol myrtle': [-116.2049, 43.6121],
  'capitol university': [-116.2072, 43.6038],
  'cesar chavez broadway': [-116.1938, 43.6058],
  'denver university': [-116.1974, 43.6019],
  'front 9': [-116.2055, 43.6148],
  'grove capitol': [-116.2034, 43.6134],
  'idaho 8': [-116.2035, 43.6172],
  'juanita potter': [-116.1961, 43.5961],
  'lincoln belmont': [-116.2004, 43.5963],
  'lusk royal': [-116.2102, 43.6052],
  'main 8': [-116.2035, 43.6162],
  'main 8th': [-116.2035, 43.6162],
  'main capitol': [-116.2029, 43.6159],
  'myrtle capitol': [-116.2049, 43.6121],
  'protest boise': [-116.1997, 43.5977],
  'royal 9': [-116.2107, 43.6058],
  'royal capitol': [-116.2075, 43.6052],
  'theatre ln cesar chavez': [-116.2049, 43.6024],
  'university broadway': [-116.1937, 43.6026],
  'university bronco lane': [-116.1987, 43.6022],
  'university chrisway': [-116.2091, 43.6046],
};

const ADDRESSES: Record<string, CampusCoordinate> = {
  '101 capitol': [-116.2014, 43.6178],
  '445 capitol': [-116.2032, 43.6148],
  '765 idaho': [-116.2032, 43.6171],
  '770 main': [-116.2029, 43.6161],
  '777 main': [-116.2028, 43.6161],
  '800 blk main': [-116.2034, 43.6161],
  '827 main': [-116.2040, 43.6160],
  '1009 oakland': [-116.2096, 43.6032],
  '1100 blk of s lincoln': [-116.2003, 43.5984],
  '1300 blk capitol': [-116.2080, 43.6070],
  '1309 w chrisway': [-116.2087, 43.6047],
  '1711 theater': [-116.2049, 43.6024],
};

function normalizeLocation(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function resolveLocationCoordinate(location: string): CampusCoordinate | null {
  const normalized = normalizeLocation(location);
  if (!normalized || normalized === 'theft larceny') return null;
  if (PLACES[normalized]) return PLACES[normalized];
  if (INTERSECTIONS[normalized]) return INTERSECTIONS[normalized];
  if (ADDRESSES[normalized]) return ADDRESSES[normalized];

  if (normalized.includes('albertson') && normalized.includes('stad')) return PLACES['albertsons stadium'];
  if (normalized.includes('morrison center')) return PLACES['morrison center parking lot'];
  if (normalized.includes('lincoln townhomes')) return PLACES['lincoln townhomes'];
  if (normalized.includes('syringa')) return PLACES['syringa hall'];
  if (normalized.includes('towers')) return PLACES['towers hall'];
  if (normalized.includes('sawtooth')) return PLACES['sawtooth hall'];
  if (normalized.includes('jasper')) return PLACES['jasper hall'];
  if (normalized.includes('brady garage')) return PLACES['brady garage'];
  if (normalized.includes('appleton tennis')) return PLACES['appleton tennis center'];
  if (normalized.includes('university') && normalized.includes('broadway')) return INTERSECTIONS['university broadway'];
  if (normalized.includes('front') && normalized.includes('9')) return INTERSECTIONS['front 9'];
  if (normalized.includes('main') && normalized.includes('capitol')) return INTERSECTIONS['main capitol'];
  if (normalized.includes('main') && (normalized.includes('8') || normalized.includes('8th'))) return INTERSECTIONS['main 8'];

  return null;
}
