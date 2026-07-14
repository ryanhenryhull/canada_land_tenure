import { GeospatialLayer } from "../types";
import { parseStacNode, resolveUrl } from "./stacParser";

// Robust recursive STAC discovery function
export async function recursivelyDiscoverLayers(
  url: string,
  onProgress?: (layers: GeospatialLayer[]) => void,
  maxRequests = 80
): Promise<GeospatialLayer[]> {
  const discovered: GeospatialLayer[] = [];
  const visited = new Set<string>();
  let requestCount = 0;

  async function traverse(currentUrl: string) {
    // Standardize URL to prevent duplicate visits of identical endpoints
    const normalizedUrl = currentUrl.trim();
    if (visited.has(normalizedUrl)) return;
    visited.add(normalizedUrl);

    if (requestCount >= maxRequests) return;
    requestCount++;

    try {
      const node = await parseStacNode(normalizedUrl);
      
      // Look for assets in this node
      if (node.assets) {
        Object.entries(node.assets).forEach(([key, asset]) => {
          if (!asset || !asset.href) return;
          const href = resolveUrl(normalizedUrl, asset.href);
          
          const lowerHref = href.toLowerCase();
          const lowerType = (asset.type || "").toLowerCase();
          const lowerKey = key.toLowerCase();

          // Liberal case-insensitive matching for COG (GeoTIFF)
          const isTiff = lowerHref.endsWith(".tif") || 
                         lowerHref.endsWith(".tiff") || 
                         lowerHref.includes(".tif?") || 
                         lowerHref.includes(".tiff?") ||
                         lowerType.includes("geotiff") || 
                         lowerType.includes("tiff") ||
                         lowerKey.includes("cog") ||
                         lowerKey.includes("geotiff");

          // Liberal case-insensitive matching for PMTiles vector/raster
          const isPmtiles = lowerHref.endsWith(".pmtiles") || 
                            lowerHref.includes(".pmtiles?") ||
                            lowerHref.includes("pmtiles") ||
                            lowerType.includes("pmtiles") ||
                            lowerKey.includes("pmtiles");

          if (isTiff) {
            const layerId = `stac-cog-${node.id}-${key}`;
            if (!discovered.some(l => l.id === layerId)) {
              discovered.push({
                id: layerId,
                name: asset.title || `${node.title || node.id} - ${key}`,
                type: "cog",
                url: href,
                visible: false,
                opacity: 0.8,
                bounds: node.geometry ? getBboxFromGeometry(node.geometry) : undefined,
                description: asset.description || node.description || `Format: ${asset.type || "GeoTIFF"}`,
                cogSettings: {
                  bands: [1],
                  minVal: 0,
                  maxVal: 255,
                  colormapName: "viridis"
                }
              } as any);
              if (onProgress) onProgress([...discovered]);
            }
          } else if (isPmtiles) {
            const layerId = `stac-pmtiles-${node.id}-${key}`;
            if (!discovered.some(l => l.id === layerId)) {
              discovered.push({
                id: layerId,
                name: asset.title || `${node.title || node.id} - ${key}`,
                type: "pmtiles",
                url: href,
                visible: false,
                opacity: 0.9,
                bounds: node.geometry ? getBboxFromGeometry(node.geometry) : undefined,
                description: asset.description || node.description || "PMTiles Vector Archive",
                pmtilesSettings: { // Ryan note: something needs to populate this below!! let's try
                  vectorLayers: [{
                      id: key,
                      sourceLayer: "aboriginal_lands_canada_legislative_boundaries", // changed to sourceLayer from sourcelayer.
                      type: "fill",
                      color: "#3388ff"
                  }]
                }
              } as any);
              if (onProgress) onProgress([...discovered]);
            }
          }
        });
      }

      // Traverse children/items concurrently/asynchronously to avoid blocking
      if (node.children && node.children.length > 0) {
        const childUrls = node.children.map(c => c.href);
        // Let's run traversals in parallel/concurrently to make it extremely responsive and fast
        await Promise.all(
          childUrls.slice(0, 15).map(async (childUrl) => {
            if (requestCount < maxRequests) {
              await traverse(childUrl);
            }
          })
        );
      }
    } catch (e) {
      console.error(`Error traversing STAC node at ${normalizedUrl}:`, e);
    }
  }

  await traverse(url);
  return discovered;
}

function getBboxFromGeometry(geometry: any): [number, number, number, number] | undefined {
  if (!geometry) return undefined;
  let coords = geometry.coordinates;
  if (geometry.type === "Polygon") {
    coords = coords[0];
  } else if (geometry.type === "MultiPolygon") {
    coords = coords[0][0];
  }
  
  if (Array.isArray(coords) && coords.length > 0) {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    coords.forEach((c: any) => {
      if (Array.isArray(c)) {
        const [lng, lat] = c;
        if (typeof lng === "number" && typeof lat === "number") {
          if (lng < minLng) minLng = lng;
          if (lat < minLat) minLat = lat;
          if (lng > maxLng) maxLng = lng;
          if (lat > maxLat) maxLat = lat;
        }
      }
    });
    if (minLng !== Infinity) {
      return [minLng, minLat, maxLng, maxLat];
    }
  }
  return undefined;
}
