'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap, Popup } from 'maplibre-gl';
import { resolveLocationCoordinate } from './location-coordinates';

export interface HeatmapEntry {
  location: string;
}

interface HeatmapProperties {
  location: string;
  count: number;
}

const BASEMAP_SOURCE = 'openStreetMap';

const BASEMAP = {
  type: 'raster' as const,
  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  tileSize: 256,
  attribution: '© OpenStreetMap contributors',
};

const BASEMAP_LAYER = {
  id: BASEMAP_SOURCE,
  type: 'raster' as const,
  source: BASEMAP_SOURCE,
  paint: {
    'raster-brightness-min': 0,
    'raster-brightness-max': 1,
    'raster-saturation': -0.34,
    'raster-contrast': -0.07,
  },
};

const MAP_STYLE = {
  version: 8 as const,
  sources: { [BASEMAP_SOURCE]: BASEMAP },
  layers: [BASEMAP_LAYER],
};

export default function CampusHeatmap({ entries, loading }: { entries: HeatmapEntry[]; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ map: MapLibreMap; popup: Popup } | null>(null);
  const [mapError, setMapError] = useState(false);
  const [tileStatus, setTileStatus] = useState<'ready' | 'failed' | 'retrying'>('ready');

  const { geoJson, mappedCount } = useMemo(() => {
    const grouped = new Map<string, { coordinates: [number, number]; count: number }>();
    let placed = 0;

    for (const entry of entries) {
      const coordinates = resolveLocationCoordinate(entry.location);
      if (!coordinates) continue;
      placed += 1;
      const existing = grouped.get(entry.location);
      if (existing) existing.count += 1;
      else grouped.set(entry.location, { coordinates, count: 1 });
    }

    const collection: FeatureCollection<Point, HeatmapProperties> = {
      type: 'FeatureCollection',
      features: Array.from(grouped.entries()).map(([location, value]) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: value.coordinates },
        properties: { location, count: value.count },
      })),
    };

    return { geoJson: collection, mappedCount: placed };
  }, [entries]);

  const dataRef = useRef(geoJson);
  useEffect(() => {
    dataRef.current = geoJson;
    mapRef.current?.popup.remove();
    mapRef.current?.map.getSource<GeoJSONSource>('incidents')?.setData(geoJson);
  }, [geoJson]);

  useEffect(() => {
    let cancelled = false;

    void import('maplibre-gl').then((module) => {
      if (cancelled || !containerRef.current) return;
      const maplibregl = module.default;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [-116.2026, 43.6042],
        zoom: 14.25,
        minZoom: 12.5,
        maxZoom: 18,
        attributionControl: false,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 10,
        className: 'heatmap-popup',
      });
      mapRef.current = { map, popup };
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      // The inline style is ready before the remote tiles finish loading.
      map.once('styledata', () => {
        map.addSource('incidents', { type: 'geojson', data: dataRef.current });
        map.addLayer({
          id: 'incident-heat',
          type: 'heatmap',
          source: 'incidents',
          maxzoom: 18,
          paint: {
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'count'],
              1, 0.38,
              4, 0.72,
              8, 1,
              15, 1,
            ],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              12, 1.25,
              15, 2.15,
              18, 2.8,
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              12, 18,
              15, 34,
              18, 54,
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(245,212,138,0)',
              0.14, 'rgba(245,212,138,0.68)',
              0.32, 'rgba(244,170,81,0.82)',
              0.53, 'rgba(222,112,48,0.9)',
              0.76, 'rgba(177,66,37,0.96)',
              1, 'rgba(119,44,31,1)',
            ],
            'heatmap-opacity': 0.92,
          },
        });
        map.addLayer({
          id: 'incident-points',
          type: 'circle',
          source: 'incidents',
          minzoom: 15.5,
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['get', 'count'],
              1, 3,
              15, 7,
            ],
            'circle-color': '#a64324',
            'circle-opacity': 0.72,
            'circle-stroke-color': '#ffe4d5',
            'circle-stroke-width': 1,
          },
        });

        map.on('click', 'incident-points', (event) => {
          const feature = event.features?.[0];
          if (!feature || feature.geometry.type !== 'Point') return;
          const location = String(feature.properties?.location || 'Campus location');
          const count = Number(feature.properties?.count || 0);
          const coordinates = feature.geometry.coordinates.slice() as [number, number];
          popup
            .setLngLat(coordinates)
            .setHTML(`<strong>${location.replace(/[<>&"']/g, '')}</strong><span>${count} ${count === 1 ? 'incident' : 'incidents'}</span>`)
            .addTo(map);
        });
        map.on('mouseenter', 'incident-points', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'incident-points', () => { map.getCanvas().style.cursor = ''; });
      });

      map.on('error', (event) => {
        if ('sourceId' in event && event.sourceId === BASEMAP_SOURCE) {
          setTileStatus('failed');
        } else {
          console.error(event.error);
          setMapError(true);
        }
      });
      map.on('idle', () => {
        setTileStatus((current) => current === 'retrying' ? 'ready' : current);
      });
    }).catch((error) => {
      if (cancelled) return;
      console.error(error);
      setMapError(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.map.remove();
      mapRef.current = null;
    };
  }, []);

  function retryTiles() {
    const map = mapRef.current?.map;
    if (!map) return;
    setTileStatus('retrying');
    // Start fresh so MapLibre does not try to draw failed tiles as they reload.
    map.removeLayer(BASEMAP_SOURCE);
    map.removeSource(BASEMAP_SOURCE);
    map.addSource(BASEMAP_SOURCE, BASEMAP);
    map.addLayer(BASEMAP_LAYER, 'incident-heat');
  }

  return (
    <div className="campus-map-wrap">
      <div
        ref={containerRef}
        className="campus-map"
        role="region"
        aria-label={`Interactive campus heatmap with ${mappedCount} of ${entries.length} records mapped`}
      />
      {mapError ? (
        <div className="campus-map__error" role="status">The campus map could not load. You can still search the incident log below.</div>
      ) : (
        <div className="campus-map__notices">
          {tileStatus !== 'ready' && (
            <div className="campus-map__notice">
              <span role="status">{tileStatus === 'retrying' ? 'Reloading map tiles…' : 'Map tiles failed to load.'}</span>
              <button type="button" onClick={retryTiles} disabled={tileStatus === 'retrying'}>Retry tiles</button>
            </div>
          )}
          {!loading && mappedCount === 0 && (
            <div className="campus-map__notice" role="status">No matching incidents have mapped locations.</div>
          )}
        </div>
      )}
      {mappedCount > 0 && (
        <div className="heat-legend" role="img" aria-label="Incident density, low to high">
          <strong>Incident density</strong>
          <span className="heat-legend__ramp" />
          <span>Low</span>
          <span>High</span>
        </div>
      )}
      <a
        className="map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}
