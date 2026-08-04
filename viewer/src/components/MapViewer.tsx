import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import * as pmtiles from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { GeospatialLayer } from "../types";
import { ClientCog } from "../utils/cogLoader";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { BitmapLayer } from "@deck.gl/layers";

// Register PMTiles protocol globally
if (typeof window !== "undefined") {
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
}

interface MapViewerProps {
  layers: GeospatialLayer[];
  basemapUrl: string;
  onMapInstance: (map: maplibregl.Map) => void;
  onSelectFeature: (feature: any | null) => void;
  selectedFeature: any | null;
}

// Global cache for loaded COG objects to prevent redundant file header fetching
const cogCache = new Map<string, ClientCog>();

export default function MapViewer({
  layers,
  basemapUrl,
  onMapInstance,
  onSelectFeature,
  selectedFeature
}: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layersRef = useRef<GeospatialLayer[]>(layers);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const renderedCogsRef = useRef<Map<string, {
    canvas: HTMLCanvasElement;
    bounds: [number, number, number, number];
    opacity: number;
    viewportKey?: string;
    settingsKey?: string;
  }>>(new Map());

  // Keep layers ref updated for use inside callbacks
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  // Handle map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapUrl,
      center: [-96.81, 56.13], // Centered on Canada
      zoom: 3.5,
      maxZoom: 19,
      pitchWithRotate: true,
      dragRotate: true,
      projection: 'globe' // set to globe view, easy maplibre support.
    });

    mapRef.current = map;
    onMapInstance(map);

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

    // Initialize deck.gl overlay
    const overlay = new MapboxOverlay({
      layers: []
    });
    map.addControl(overlay as any);
    deckOverlayRef.current = overlay;

    map.on("style.load", () => {
      setIsStyleLoaded(true);
    });

    // Handle vector feature clicking
    map.on("click", (e) => {
      const currentLayers = layersRef.current;
      const activePmtilesLayers = currentLayers
        .filter(l => l.type === "pmtiles" && l.visible)
        .flatMap(l => l.pmtilesSettings?.vectorLayers?.map(vStyle => `layer-${l.id}-${vStyle.id}`) || []);

      if (activePmtilesLayers.length === 0) {
        onSelectFeature(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: activePmtilesLayers
      });

      if (features.length > 0) {
        const feat = features[0];
        onSelectFeature({
          layerId: feat.layer.id.split("-")[1], // Extract layer source ID
          sourceLayer: feat.sourceLayer,
          properties: feat.properties,
          lngLat: [e.lngLat.lng, e.lngLat.lat]
        });
      } else {
        onSelectFeature(null);
      }
    });

    // Update cursor when hovering over vector features
    map.on("mousemove", (e) => {
      const currentLayers = layersRef.current;
      const activePmtilesLayers = currentLayers
        .filter(l => l.type === "pmtiles" && l.visible)
        .flatMap(l => l.pmtilesSettings?.vectorLayers?.map(vStyle => `layer-${l.id}-${vStyle.id}`) || []);

      if (activePmtilesLayers.length === 0) {
        map.getCanvas().style.cursor = "";
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: activePmtilesLayers
      });
      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
    });

    // Core COG rendering loop triggered on map moves
    const handleMoveEnd = () => {
      const currentLayers = layersRef.current;
      currentLayers.forEach(l => {
        if (l.type === "cog" && l.visible) {
          updateCogLayer(map, l);
        }
      });
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      if (deckOverlayRef.current) {
        try {
          map.removeControl(deckOverlayRef.current as any);
        } catch (e) {
          console.warn("Could not remove deck overlay control", e);
        }
        deckOverlayRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle basemap changes dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleLoaded) return;

    setIsStyleLoaded(false);
    map.setStyle(basemapUrl);
    
    map.once("style.load", () => {
      setIsStyleLoaded(true);
    });
  }, [basemapUrl]);

  // Synchronize custom layers onto the map whenever they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleLoaded) return;

    layers.forEach(async (layer) => {
      if (layer.type === "pmtiles") {
        await syncPmtilesLayer(map, layer);
      } else if (layer.type === "cog") {
        await syncCogLayer(map, layer);
      }
    });

    // Remove any layers that are no longer in our state
    const currentStyle = map.getStyle();
    if (currentStyle && currentStyle.sources) {
      Object.keys(currentStyle.sources).forEach(sourceId => {
        if (sourceId.startsWith("source-")) {
          const origId = sourceId.replace("source-", "");
          const stillExists = layers.some(l => l.id === origId);
          if (!stillExists) {
            removeLayerSource(map, origId);
          }
        }
      });
    }

    // Clean up any removed COG layers from deck
    let deckUpdated = false;
    renderedCogsRef.current.forEach((val, id) => {
      const stillExists = layers.some(l => l.id === id);
      if (!stillExists) {
        renderedCogsRef.current.delete(id);
        deckUpdated = true;
      }
    });
    if (deckUpdated) {
      updateDeckLayers();
    }
  }, [layers, isStyleLoaded]);

  // Handle on-map popup for the selected feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (selectedFeature && selectedFeature.lngLat) {
      const keys = Object.keys(selectedFeature.properties);
      const rowsHtml = keys.length > 0 
        ? keys.map(k => `
            <div class="flex justify-between border-b border-gray-100 py-1 text-xs gap-4">
              <span class="font-semibold text-gray-500">${k}</span>
              <span class="text-right text-gray-800 break-all">${selectedFeature.properties[k]}</span>
            </div>
          `).join("")
        : `<div class="text-gray-400 italic text-xs">No attributes</div>`;

      const content = `
        <div class="p-2 font-sans max-w-sm max-h-64 overflow-y-auto">
          <div class="font-bold text-xs text-blue-600 mb-1">
            Layer: ${selectedFeature.sourceLayer}
          </div>
          ${rowsHtml}
        </div>
      `;

      popupRef.current = new maplibregl.Popup({ closeButton: true, className: "custom-maplibre-popup" })
        .setLngLat(selectedFeature.lngLat)
        .setHTML(content)
        .addTo(map);

      popupRef.current.on("close", () => {
        onSelectFeature(null);
      });
    }
  }, [selectedFeature]);

  const updateDeckLayers = () => {
    const overlay = deckOverlayRef.current;
    if (!overlay) return;

    const deckLayers: any[] = [];

    layersRef.current.forEach(layer => {
      if (layer.type === "cog" && layer.visible) {
        const rendered = renderedCogsRef.current.get(layer.id);
        if (rendered && rendered.canvas) {
            deckLayers.push(
              new BitmapLayer({
                id: `deck-cog-${layer.id}`,
                image: rendered.canvas,
                bounds: rendered.bounds,
                opacity: layer.opacity,
                textureParameters: {
                  0x2800: 0x2600, // TEXTURE_MAG_FILTER: NEAREST
                  0x2801: 0x2600, // TEXTURE_MIN_FILTER: NEAREST
                },
                updateTriggers: {
                  image: [rendered.canvas]
                }
              })
            );
        }
      }
    });

    overlay.setProps({ layers: deckLayers });
  };

  // COG Layer Synchronization
  const syncCogLayer = async (map: maplibregl.Map, layer: GeospatialLayer) => {
    if (!layer.visible) {
      renderedCogsRef.current.delete(layer.id);
      updateDeckLayers();
      return;
    }
    await updateCogLayer(map, layer);
  };

  // Render/Update the COG viewport client-side
  const updateCogLayer = async (map: maplibregl.Map, layer: GeospatialLayer) => {
    let clientCog = cogCache.get(layer.id);
    if (!clientCog) {
      try {
        clientCog = await ClientCog.create(layer.url);
        cogCache.set(layer.id, clientCog);
      } catch (err) {
        console.error(`Failed to initialize COG client for layer ${layer.id}:`, err);
        return;
      }
    }

    const bounds = map.getBounds();
    const viewport: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];

    // Create unique cache keys for viewport (rounded for precision stability) and cogSettings
    const viewportKey = viewport.map(c => c.toFixed(5)).join(",");
    const settingsKey = JSON.stringify({
      colormapName: layer.cogSettings?.colormapName,
      minVal: layer.cogSettings?.minVal,
      maxVal: layer.cogSettings?.maxVal,
      bands: layer.cogSettings?.bands,
      activeForestIndexId: layer.cogSettings?.activeForestIndexId,
      bandMapping: layer.cogSettings?.bandMapping
    });

    const rendered = renderedCogsRef.current.get(layer.id);
    if (rendered && rendered.viewportKey === viewportKey && rendered.settingsKey === settingsKey) {
      // Avoid re-rendering if only opacity or layer state changed, and apply instantly
      if (rendered.opacity !== layer.opacity) {
        rendered.opacity = layer.opacity;
        updateDeckLayers();
      }
      return;
    }

    const result = await clientCog.renderViewport(viewport, {
      colormapName: layer.cogSettings?.colormapName,
      minVal: layer.cogSettings?.minVal,
      maxVal: layer.cogSettings?.maxVal,
      bands: layer.cogSettings?.bands,
      activeForestIndexId: layer.cogSettings?.activeForestIndexId,
      bandMapping: layer.cogSettings?.bandMapping
    });

    if (!result) {
      renderedCogsRef.current.delete(layer.id);
    } else {
      renderedCogsRef.current.set(layer.id, {
        canvas: result.canvas,
        bounds: result.bounds,
        opacity: layer.opacity,
        viewportKey,
        settingsKey
      });
    }

    updateDeckLayers();
  };

  // PMTiles Vector Layer Synchronization
  //// changes made below to allow sublayer visibility toggling.

  const syncPmtilesLayer = async (map: maplibregl.Map, layer: GeospatialLayer) => {
    const sourceId = `source-${layer.id}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "vector",
        url: `pmtiles://${layer.url}`
      });
    }

    layer.pmtilesSettings?.vectorLayers?.forEach((vStyle) => {
      const layerId = `layer-${layer.id}-${vStyle.id}`;
      const visibility = (layer.visible && vStyle.visible !== false) ? "visible" : "none";


      ////

      if (!map.getLayer(layerId)) {
        if (vStyle.type === "fill") {
          map.addLayer({
            id: layerId,
            source: sourceId,
            "source-layer": vStyle.sourceLayer,
            type: "fill",
            paint: {
              "fill-color": vStyle.color,
              "fill-opacity": layer.opacity
            },
            layout: {
              visibility
            }
          });
        } else if (vStyle.type === "line") {
          map.addLayer({
            id: layerId,
            source: sourceId,
            "source-layer": vStyle.sourceLayer,
            type: "line",
            paint: {
              "line-color": vStyle.color,
              "line-width": 1.5,
              "line-opacity": layer.opacity
            },
            layout: {
              visibility
            }
          });
        } else if (vStyle.type === "circle") {
          map.addLayer({
            id: layerId,
            source: sourceId,
            "source-layer": vStyle.sourceLayer,
            type: "circle",
            paint: {
              "circle-color": vStyle.color,
              "circle-radius": 4,
              "circle-opacity": layer.opacity
            },
            layout: {
              visibility
            }
          });
        }
      } else {
        // Layer already exists, update settings
        map.setLayoutProperty(layerId, "visibility", visibility);
        
        if (vStyle.type === "fill") {
          map.setPaintProperty(layerId, "fill-color", vStyle.color);
          map.setPaintProperty(layerId, "fill-opacity", layer.opacity);
        } else if (vStyle.type === "line") {
          map.setPaintProperty(layerId, "line-color", vStyle.color);
          map.setPaintProperty(layerId, "line-opacity", layer.opacity);
        } else if (vStyle.type === "circle") {
          map.setPaintProperty(layerId, "circle-color", vStyle.color);
          map.setPaintProperty(layerId, "circle-opacity", layer.opacity);
        }
      }
    });
  };

  // Remove layer and source safely from MapLibre
  const removeLayerSource = (map: maplibregl.Map, layerId: string) => {
    // Find all layers referencing this source
    const currentStyle = map.getStyle();
    if (currentStyle && currentStyle.layers) {
      currentStyle.layers.forEach(l => {
        if (l.id === `layer-${layerId}` || l.id.startsWith(`layer-${layerId}-`)) {
          map.removeLayer(l.id);
        }
      });
    }

    const sourceId = `source-${layerId}`;
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  };

  return (
    <div id="map-container" className="w-full h-full relative bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
