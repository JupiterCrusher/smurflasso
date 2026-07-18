export type CampusCoordinate = [longitude: number, latitude: number];

const PLACES: Record<string, CampusCoordinate> = {
  administration: [-116.2048, 43.6037],
  'albertsons library': [-116.2033, 43.6042],
  'albertsons stadium': [-116.1960, 43.6027],
  'albertsons stadium south parking lot': [-116.1962, 43.6011],
  'appleton tennis center': [-116.2006, 43.6035],
  'brady garage': [-116.2084, 43.6052],
  'caven williams': [-116.1970, 43.6042],
  chaffee: [-116.1989, 43.6046],
  'chaffee hall': [-116.1989, 43.6046],
  'clearwater suites': [-116.2082, 43.6041],
  'city center plaza': [-116.2035, 43.6152],
  'driscoll hall': [-116.2009, 43.6041],
  education: [-116.2061, 43.6058],
  'grant west parking lot': [-116.1966, 43.6003],
  'hawthorn house': [-116.2021, 43.5993],
  'heights bike racks': [-116.2112, 43.6040],
  jasper: [-116.2086, 43.6038],
  'jasper hall': [-116.2086, 43.6038],
  juniper: [-116.2026, 43.5993],
  'keiser hall': [-116.2001, 43.6041],
  'liberal arts parking lot': [-116.2034, 43.6033],
  'lincoln garage': [-116.2017, 43.6003],
  'lincoln townhomes': [-116.2021, 43.5991],
  'main campus': [-116.2028, 43.6034],
  'mec bike rack west side': [-116.1987, 43.6001],
  'micron engineering center': [-116.1983, 43.6000],
  'morrison center': [-116.2074, 43.6068],
  'morrison center parking lot': [-116.2074, 43.6068],
  'morrison center surface parking lot': [-116.2074, 43.6068],
  'on campus': [-116.2028, 43.6034],
  'on campus residence hall': [-116.2028, 43.6034],
  'on campus student housing': [-116.2028, 43.6034],
  'opaline school': [-116.1940, 43.6034],
  osprey: [-116.2119, 43.6063],
  'outside bleymaier': [-116.1954, 43.6039],
  'outside taylor hall': [-116.2006, 43.6044],
  'raptor research parking lot': [-116.2107, 43.6089],
  'rec center': [-116.2005, 43.6003],
  'recreation center': [-116.2005, 43.6003],
  sawtooth: [-116.2034, 43.6014],
  'sawtooth hall': [-116.2034, 43.6014],
  science: [-116.2061, 43.6058],
  'selway suites': [-116.2092, 43.6045],
  'special events center': [-116.2022, 43.6026],
  'square jasper': [-116.2086, 43.6038],
  stadium: [-116.1960, 43.6027],
  'student union': [-116.2015, 43.6021],
  substation: [-116.2099, 43.6048],
  syringa: [-116.2022, 43.6042],
  'syringa hall': [-116.2022, 43.6042],
  'syringa hall bike rack': [-116.2022, 43.6042],
  'taylor hall': [-116.2006, 43.6044],
  'towers dorm': [-116.2081, 43.6075],
  'towers hall': [-116.2081, 43.6075],
  'towers hall bike rack': [-116.2081, 43.6075],
  'village apartments': [-116.2107, 43.6034],
  yanke: [-116.1958, 43.6018],
};

const INTERSECTIONS: Record<string, CampusCoordinate> = {
  '8 main': [-116.2035, 43.6156],
  '8th main': [-116.2035, 43.6156],
  '9 front': [-116.2061, 43.6147],
  '9 royal': [-116.2097, 43.6084],
  '9th royal': [-116.2097, 43.6084],
  'beacon euclid': [-116.1974, 43.5984],
  'beacon lincoln': [-116.2023, 43.5984],
  'boise beacon': [-116.2048, 43.5981],
  'boise protest': [-116.2048, 43.5981],
  'broadway university': [-116.1936, 43.6010],
  'capitol broad': [-116.2045, 43.6127],
  'capitol front': [-116.2038, 43.6135],
  'capitol grove': [-116.2030, 43.6143],
  'capitol main': [-116.2023, 43.6150],
  'capitol myrtle': [-116.2053, 43.6120],
  'capitol university': [-116.2114, 43.6055],
  'cesar chavez broadway': [-116.1936, 43.6026],
  'denver university': [-116.1948, 43.6010],
  'front 9': [-116.2061, 43.6147],
  'grove capitol': [-116.2030, 43.6143],
  'idaho 8': [-116.2027, 43.6164],
  'juanita potter': [-116.2073, 43.6017],
  'lincoln belmont': [-116.2023, 43.5997],
  'lusk royal': [-116.2116, 43.6089],
  'main 8': [-116.2035, 43.6156],
  'main 8th': [-116.2035, 43.6156],
  'main capitol': [-116.2023, 43.6150],
  'myrtle capitol': [-116.2053, 43.6120],
  'protest boise': [-116.2048, 43.5981],
  'royal 9': [-116.2097, 43.6084],
  'royal capitol': [-116.2089, 43.6082],
  'theatre ln cesar chavez': [-116.2013, 43.6048],
  'university broadway': [-116.1936, 43.6010],
  'university bronco lane': [-116.1971, 43.6010],
  'university chrisway': [-116.2071, 43.6039],
};

const ADDRESSES: Record<string, CampusCoordinate> = {
  '101 capitol': [-116.2031, 43.6149],
  '445 capitol': [-116.2053, 43.6120],
  '765 idaho': [-116.2025, 43.6160],
  '770 main': [-116.2024, 43.6156],
  '777 main': [-116.2035, 43.6152],
  '800 blk main': [-116.2035, 43.6156],
  '827 main': [-116.2042, 43.6151],
  '1009 oakland': [-116.2062, 43.6007],
  '1100 blk of s lincoln': [-116.2022, 43.5996],
  '1300 blk capitol': [-116.2114, 43.6055],
  '1309 w chrisway': [-116.2080, 43.6042],
  '1711 theater': [-116.2015, 43.6037],
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
  if (normalized === 'spec') return PLACES['special events center'];
  if (normalized.includes('univeristy') && normalized.includes('capitol') && normalized.includes('earle')) {
    return [-116.2078, 43.6047];
  }
  if (normalized.includes('university') && normalized.includes('broadway')) return INTERSECTIONS['university broadway'];
  if (normalized.includes('front') && normalized.includes('9')) return INTERSECTIONS['front 9'];
  if (normalized.includes('main') && normalized.includes('capitol')) return INTERSECTIONS['main capitol'];
  if (normalized.includes('main') && (normalized.includes('8') || normalized.includes('8th'))) return INTERSECTIONS['main 8'];

  return null;
}
