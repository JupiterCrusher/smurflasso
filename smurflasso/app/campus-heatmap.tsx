'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { resolveLocationCoordinate } from './location-coordinates';

export interface HeatmapEntry {
  location: string;
}

interface HeatmapProperties {
  location: string;
  count: number;
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    openStreetMap: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'openStreetMap',
      type: 'raster' as const,
      source: 'openStreetMap',
      paint: {
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.38,
        'raster-saturation': -0.72,
        'raster-contrast': 0.12,
      },
    },
  ],
};

export default function CampusHeatmap({ entries }: { entries: HeatmapEntry[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapError, setMapError] = useState(false);

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !geoJson.features.length) return;
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
        dragRotate: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        map.addSource('incidents', { type: 'geojson', data: geoJson });
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
              0, 'rgba(23,105,224,0)',
              0.1, 'rgba(23,105,224,0.72)',
              0.28, 'rgba(50,149,255,0.84)',
              0.48, 'rgba(255,183,71,0.9)',
              0.68, 'rgba(244,91,22,0.96)',
              1, 'rgba(255,67,11,1)',
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
            'circle-color': '#f45b16',
            'circle-opacity': 0.72,
            'circle-stroke-color': '#ffe4d5',
            'circle-stroke-width': 1,
          },
        });

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 10,
          className: 'heatmap-popup',
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
        if (event.error) setMapError(true);
      });
    }).catch(() => setMapError(true));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [geoJson]);

  return (
    <div className="campus-map-wrap">
      <div
        ref={containerRef}
        className="campus-map"
        role="img"
        aria-label={`Interactive campus incident heatmap showing ${mappedCount} mapped records`}
      />
      {mapError ? (
        <div className="campus-map__error">The basemap could not be loaded. Incident filters and the log remain available below.</div>
      ) : null}
      <div className="heat-legend" aria-label="Heatmap density from lower to higher">
        <span>Lower</span>
        <span className="heat-legend__ramp" />
        <span>Higher</span>
      </div>
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
