import React, { useState, useEffect } from "react";
import MapViewer from "./components/MapViewer";
import Sidebar from "./components/Sidebar";
import { GeospatialLayer } from "./types";
import { recursivelyDiscoverLayers } from "./utils/stacDiscoverer";
import { Search, Loader2, AlertCircle } from "lucide-react";
import maplibregl from "maplibre-gl";

export default function App() {
  const basemapUrl = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  const defaultUrl = "https://pub-5ac3c27e0001486290fb4f649e61b4a8.r2.dev/STAC/stac/catalog.json";
  const [layers, setLayers] = useState<GeospatialLayer[]>([]);
  const [stacUrl, setStacUrl] = useState<string>(defaultUrl);
  const [inputUrl, setInputUrl] = useState<string>(defaultUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  // Load default STAC catalog on mount
  useEffect(() => {
    handleLoadCatalog(stacUrl);
  }, []);

  const handleLoadCatalog = async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setLayers([]); // Reset previous layers
    
    try {
      new URL(url);

      const discovered = await recursivelyDiscoverLayers(
        url, 
        (progressLayers) => {
          setLayers(progressLayers);
        },
        50 // Concurrent traversal max requests
      );

      if (discovered.length === 0) {
        setError("STAC Catalog parsed successfully, but no direct COG (.tif) or PMTiles vector layers were discovered. Please check CORS configuration on your cloud storage.");
      }
    } catch (err: any) {
      console.error("Error loading STAC catalog:", err);
      setError(err?.message || "Failed to fetch or parse STAC catalog. Please verify the URL and CORS headers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setStacUrl(inputUrl.trim());
      handleLoadCatalog(inputUrl.trim());
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden font-sans bg-slate-950 text-white">
      
      {/* 1. Main Full-Screen Map canvas */}
      <main className="w-full h-full absolute inset-0 z-0">
        <MapViewer 
          layers={layers}
          basemapUrl={basemapUrl}
          onMapInstance={setMapInstance}
          onSelectFeature={setSelectedFeature}
          selectedFeature={selectedFeature}
        />
      </main>

      {/* 2. Floating Top-Center Search Bar overlay (Extremely simple, no analyze button) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          <form onSubmit={handleSubmit} className="relative shadow-2xl">
            <div className="relative flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter STAC catalog.json URL..."
                className="w-full bg-transparent border-none py-3 pl-10 pr-10 text-xs text-slate-100 placeholder-slate-500 outline-none font-sans"
              />
              {isLoading && (
                <div className="absolute right-3">
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                </div>
              )}
            </div>
          </form>

          {/* Error display below the search */}
          {error && (
            <div className="bg-red-950/90 backdrop-blur-md border border-red-900/50 rounded-xl p-3 text-[11px] text-red-300 flex items-start gap-2 shadow-xl animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block text-red-200">Catalog Error</span>
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Collapsible Control Sidebar Overlay (Only Layers list) */}
      <Sidebar 
        layers={layers}
        setLayers={setLayers}
        mapInstance={mapInstance}
      />
    </div>
  );
}
