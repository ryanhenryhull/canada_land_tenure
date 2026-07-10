import React, { useState } from "react";
import { Layers, ChevronLeft, Info, Eye, ExternalLink } from "lucide-react";
import { GeospatialLayer } from "../types";
import { ClientCog } from "../utils/cogLoader";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";

interface SidebarProps {
  layers: GeospatialLayer[];
  setLayers: React.Dispatch<React.SetStateAction<GeospatialLayer[]>>;
  mapInstance: maplibregl.Map | null;
}

export default function Sidebar({
  layers,
  setLayers,
  mapInstance
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [infoExpandedId, setInfoExpandedId] = useState<string | null>(null);
  const [loadingMetadataId, setLoadingMetadataId] = useState<string | null>(null);

  // Toggle visibility and lazy-load settings/metadata if needed
  const toggleLayerVisibility = async (layer: GeospatialLayer) => {
    // Lazy-load PMTiles vector layers metadata if checking for the first time
    if (!layer.visible && layer.type === "pmtiles" && (!layer.pmtilesSettings?.vectorLayers || layer.pmtilesSettings.vectorLayers.length === 0)) {
      setLoadingMetadataId(layer.id);
      try {
        const p = new pmtiles.PMTiles(layer.url);
        const metadata = await p.getMetadata() as any;
        const vectorLayers = metadata?.vector_layers || [];
        
        const styleLayers = vectorLayers.map((vl: any, idx: number) => {
          const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
          const type = vl.id.includes("water") || vl.id.includes("river") ? "fill" : 
                       (vl.id.includes("building") || vl.id.includes("land") ? "fill" : "line");
          return {
            id: vl.id,
            type,
            sourceLayer: vl.id,
            color: colors[idx % colors.length]
          };
        });

        setLayers(prev => prev.map(l => {
          if (l.id === layer.id) {
            return {
              ...l,
              visible: true,
              pmtilesSettings: {
                vectorLayers: styleLayers
              }
            };
          }
          return l;
        }));

        // Zoom to bounds automatically
        if (layer.bounds) {
          zoomToLayer(layer);
        }
      } catch (err) {
        console.error("Failed to parse PMTiles vector layers:", err);
      } finally {
        setLoadingMetadataId(null);
      }
    } else {
      // Standard visibility toggle
      setLayers(prev => prev.map(l => {
        if (l.id === layer.id) {
          const nextVisible = !l.visible;
          return { ...l, visible: nextVisible };
        }
        return l;
      }));

      // Zoom to layer bounds if activating and bounds exist
      if (!layer.visible && layer.bounds) {
        zoomToLayer(layer);
      }
    }
  };

  // Zoom to layer bounds on the map
  const zoomToLayer = (layer: GeospatialLayer) => {
    if (!mapInstance) return;

    if (layer.bounds) {
      mapInstance.fitBounds(layer.bounds, { padding: 60, duration: 1500 });
      return;
    }

    // Try dynamic bounds discovery if it is a COG
    if (layer.type === "cog") {
      ClientCog.create(layer.url).then(clientCog => {
        const b = clientCog.metadata.wgs84Bounds;
        setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, bounds: b } : l));
        mapInstance.fitBounds(b, { padding: 60, duration: 1500 });
      }).catch(err => {
        console.error("Zoom to COG bounds failed:", err);
      });
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  const handleCogSettingChange = (layerId: string, updates: Partial<NonNullable<GeospatialLayer["cogSettings"]>>) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.cogSettings) {
        return {
          ...l,
          cogSettings: { ...l.cogSettings, ...updates }
        };
      }
      return l;
    }));
  };

  const handleVectorColorChange = (layerId: string, subLayerId: string, color: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.pmtilesSettings?.vectorLayers) {
        const updatedV = l.pmtilesSettings.vectorLayers.map(v => 
          v.id === subLayerId ? { ...v, color } : v
        );
        return {
          ...l,
          pmtilesSettings: { vectorLayers: updatedV }
        };
      }
      return l;
    }));
  };

  return (
    <>
      {/* Mini toggle button in top left when sidebar is collapsed */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-4 z-50 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
          id="btn-sidebar-open"
          title="Open Layers"
        >
          <Layers className="h-5 w-5" />
        </button>
      )}

      {/* Main Sidebar Container */}
      <div 
        id="control-sidebar"
        className={`absolute top-4 left-4 z-40 w-96 max-h-[calc(100vh-2rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Header - Simple & Minimal */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Layers</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
            id="btn-sidebar-close"
            title="Collapse Panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* List of layers */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {layers.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-850 text-slate-400">
              <p className="text-xs font-medium text-slate-400">No layers discovered</p>
              <p className="text-[10px] text-slate-500 mt-1">Please wait or check your STAC catalog URL.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {layers.map(layer => {
                const isInfoActive = infoExpandedId === layer.id;
                const isLoadingMetadata = loadingMetadataId === layer.id;

                return (
                  <div 
                    key={layer.id} 
                    className={`border rounded-xl transition-all ${
                      layer.visible 
                        ? "border-blue-500/40 bg-slate-950/60" 
                        : "border-slate-850/80 bg-slate-950/20 hover:bg-slate-950/40"
                    }`}
                  >
                    {/* Layer Item Row */}
                    <div className="p-3 flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <label className="relative flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={layer.visible}
                            disabled={isLoadingMetadata}
                            onChange={() => toggleLayerVisibility(layer)}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 bg-slate-800 border border-slate-700 peer-checked:bg-blue-600 peer-checked:border-blue-500 rounded-md flex items-center justify-center transition-all peer-focus:ring-2 peer-focus:ring-blue-500/30">
                            {layer.visible && <Eye className="h-3.5 w-3.5 text-white" />}
                            {!layer.visible && <div className="w-1.5 h-1.5 rounded-full bg-transparent" />}
                          </div>
                        </label>

                        {/* Text Label */}
                        <div className="min-w-0 flex-1" onClick={() => toggleLayerVisibility(layer)}>
                          <span className="text-xs font-medium text-slate-200 block truncate cursor-pointer hover:text-white" title={layer.name}>
                            {layer.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block truncate">
                            {layer.type.toUpperCase()} • {layer.url.split("/").pop()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1">
                        {isLoadingMetadata && (
                          <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mr-1" />
                        )}

                        <button 
                          onClick={() => setInfoExpandedId(isInfoActive ? null : layer.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isInfoActive ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                          title="View Info"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Opacity Control - Only visible when layer is active */}
                    {layer.visible && (
                      <div className="px-3 pb-3 pt-0.5 border-t border-slate-850 bg-slate-950/30 space-y-1">
                        <div className="flex justify-between text-[9px] font-medium text-slate-400">
                          <span>Opacity</span>
                          <span>{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    )}

                    {/* Small Info Box */}
                    {isInfoActive && (
                      <div className="p-3 bg-slate-950 border-t border-slate-850 space-y-3 rounded-b-xl text-slate-300 text-[11px]">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Description</span>
                          <p className="text-slate-400 leading-relaxed font-sans max-h-24 overflow-y-auto pr-1">
                            {layer.description || "No description provided."}
                          </p>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-slate-900">
                          <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Cloud Data URL</span>
                          <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[10px] font-mono text-slate-400 overflow-x-auto">
                            <span className="truncate flex-1 select-all">{layer.url}</span>
                            <a 
                              href={layer.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        {/* Custom Settings for COG */}
                        {layer.type === "cog" && layer.cogSettings && (
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Raster Settings</span>
                            
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400 font-medium">Colormap</span>
                              <select 
                                value={layer.cogSettings.colormapName || "viridis"}
                                onChange={(e) => handleCogSettingChange(layer.id, { colormapName: e.target.value })}
                                className="text-xs border border-slate-800 rounded px-1.5 py-1 bg-slate-900 text-slate-300 focus:outline-none focus:border-blue-500"
                              >
                                <option value="viridis">Viridis</option>
                                <option value="terrain">Terrain</option>
                                <option value="magma">Magma</option>
                                <option value="elevation">Elevation</option>
                                <option value="greyscale">Greyscale</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-medium text-slate-400">
                                <span>Stretch Min</span>
                                <span>{layer.cogSettings.minVal}</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="1000"
                                value={layer.cogSettings.minVal}
                                onChange={(e) => handleCogSettingChange(layer.id, { minVal: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-medium text-slate-400">
                                <span>Stretch Max</span>
                                <span>{layer.cogSettings.maxVal}</span>
                              </div>
                              <input 
                                type="range"
                                min="100"
                                max="5000"
                                value={layer.cogSettings.maxVal}
                                onChange={(e) => handleCogSettingChange(layer.id, { maxVal: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Custom Settings for PMTiles */}
                        {layer.type === "pmtiles" && layer.pmtilesSettings?.vectorLayers && layer.pmtilesSettings.vectorLayers.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Vector Sub-layers</span>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                              {layer.pmtilesSettings.vectorLayers.map(vl => (
                                <div key={vl.id} className="flex items-center justify-between bg-slate-900/40 p-1.5 rounded border border-slate-850">
                                  <span className="font-mono text-[9px] text-slate-400 truncate">{vl.sourceLayer}</span>
                                  <input 
                                    type="color"
                                    value={vl.color}
                                    onChange={(e) => handleVectorColorChange(layer.id, vl.id, e.target.value)}
                                    className="w-4 h-4 rounded cursor-pointer border border-slate-850 p-0 bg-transparent"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
