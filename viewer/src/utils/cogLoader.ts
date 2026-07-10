import { fromUrl, GeoTIFF, GeoTIFFImage } from "geotiff";
import proj4 from "proj4";

// Dynamic Proj4 projection generator for common coordinate systems (UTM, Web Mercator, WGS84)
export function getProj4String(epsgCode: number): string | null {
  if (epsgCode === 4326) return "+proj=longlat +datum=WGS84 +no_defs";
  if (epsgCode === 3857 || epsgCode === 900913) {
    return "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs";
  }
  // UTM North: EPSG 32601 to 32660
  if (epsgCode >= 32601 && epsgCode <= 32660) {
    const zone = epsgCode - 32600;
    return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
  }
  // UTM South: EPSG 32701 to 32760
  if (epsgCode >= 32701 && epsgCode <= 32760) {
    const zone = epsgCode - 32700;
    return `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`;
  }
  return null;
}

// Built-in beautiful colormaps for single-band COGs (elevation, NDVI, etc.)
export const COLORMAPS: Record<string, (val: number) => [number, number, number]> = {
  viridis: (t) => {
    // Viridis colors approximation
    const r = Math.round(Math.max(0, Math.min(255, 255 * (0.267 - 0.482 * t + 4.908 * t * t - 10.96 * t * t * t + 7.15 * t * t * t * t))));
    const g = Math.round(Math.max(0, Math.min(255, 255 * (0.004 + 1.41 * t + 0.28 * t * t - 2.12 * t * t * t + 1.425 * t * t * t * t))));
    const b = Math.round(Math.max(0, Math.min(255, 255 * (0.329 + 1.38 * t + 1.2 * t * t - 4.9 * t * t * t + 3.01 * t * t * t * t))));
    return [r, g, b];
  },
  terrain: (t) => {
    // Terrain: Blue (water) -> Green (land) -> Yellow (hills) -> Brown (mountains) -> White (snow)
    if (t < 0.1) return [30, 60, 150]; // Deep water
    if (t < 0.25) return [50, 100, 200]; // Water
    if (t < 0.45) return [46, 125, 50]; // Green land
    if (t < 0.7) return [197, 180, 120]; // Sandy hills
    if (t < 0.9) return [120, 80, 40]; // Mountains
    return [250, 250, 250]; // Snow
  },
  magma: (t) => {
    const r = Math.round(Math.max(0, Math.min(255, 255 * (t < 0.4 ? t * 1.5 : 0.6 + (t - 0.4) * 0.66))));
    const g = Math.round(Math.max(0, Math.min(255, 255 * (t < 0.5 ? t * t * 1.2 : t))));
    const b = Math.round(Math.max(0, Math.min(255, 255 * (t < 0.3 ? 0.2 + t * 2 : 0.8 - (t - 0.3) * 0.8))));
    return [r, g, b];
  },
  greyscale: (t) => {
    const v = Math.round(t * 255);
    return [v, v, v];
  },
  elevation: (t) => {
    // Custom elevation map
    if (t < 0.2) return [0, 100, 80];
    if (t < 0.5) return [100, 180, 100];
    if (t < 0.8) return [210, 180, 140];
    return [250, 250, 250];
  }
};

export interface CogMetadata {
  url: string;
  epsg: number;
  nativeBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  wgs84Bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  noDataValue: number | null;
  bandsCount: number;
  width: number;
  height: number;
}

export class ClientCog {
  tiff!: GeoTIFF;
  metadata!: CogMetadata;
  private epsgProjName!: string;

  private constructor() {}

  static async create(url: string): Promise<ClientCog> {
    const cog = new ClientCog();
    cog.tiff = await fromUrl(url);
    const count = await cog.tiff.getImageCount();
    const primaryImage = await cog.tiff.getImage(0);

    // Read geokeys to determine the projection
    const geoKeys = primaryImage.getGeoKeys();
    let epsg = 4326;
    if (geoKeys) {
      if (geoKeys.ProjectedCSTypeGeoKey) {
        epsg = geoKeys.ProjectedCSTypeGeoKey;
      } else if (geoKeys.GeographicTypeGeoKey) {
        epsg = geoKeys.GeographicTypeGeoKey;
      }
    }

    const nativeBounds = primaryImage.getBoundingBox() as [number, number, number, number];
    const noDataValue = primaryImage.getGDALNoData();

    // Set up projection definitions
    cog.epsgProjName = `EPSG:${epsg}`;
    const projDef = getProj4String(epsg);
    if (projDef) {
      proj4.defs(cog.epsgProjName, projDef);
    }

    // Convert bounds to WGS84 (MapLibre standard)
    const toWgs84 = (x: number, y: number): [number, number] => {
      if (epsg === 4326) return [x, y];
      try {
        return proj4(cog.epsgProjName, "EPSG:4326", [x, y]);
      } catch (e) {
        console.warn(`Projection failed for EPSG:${epsg}, falling back to identity`, e);
        return [x, y];
      }
    };

    const bottomLeft = toWgs84(nativeBounds[0], nativeBounds[1]);
    const topRight = toWgs84(nativeBounds[2], nativeBounds[3]);

    const wgs84Bounds: [number, number, number, number] = [
      Math.min(bottomLeft[0], topRight[0]),
      Math.min(bottomLeft[1], topRight[1]),
      Math.max(bottomLeft[0], topRight[0]),
      Math.max(bottomLeft[1], topRight[1]),
    ];

    cog.metadata = {
      url,
      epsg,
      nativeBounds,
      wgs84Bounds,
      noDataValue,
      bandsCount: primaryImage.getSamplesPerPixel(),
      width: primaryImage.getWidth(),
      height: primaryImage.getHeight(),
    };

    return cog;
  }

  // Project lat/lng coordinate back to COG's native projection
  projectFromWgs84(lng: number, lat: number): [number, number] {
    if (this.metadata.epsg === 4326) return [lng, lat];
    return proj4("EPSG:4326", this.epsgProjName, [lng, lat]);
  }

  // Project native coordinate to WGS84
  projectToWgs84(x: number, y: number): [number, number] {
    if (this.metadata.epsg === 4326) return [x, y];
    return proj4(this.epsgProjName, "EPSG:4326", [x, y]);
  }

  // Render a specific viewport intersection to a canvas
  async renderViewport(
    viewportWgs84: [number, number, number, number], // [west, south, east, north]
    options: {
      colormapName?: string;
      minVal?: number;
      maxVal?: number;
      bands?: number[];
    } = {}
  ): Promise<{ canvas: HTMLCanvasElement; bounds: [number, number, number, number] } | null> {
    const { wgs84Bounds, nativeBounds, width: fullWidth, height: fullHeight, noDataValue, bandsCount } = this.metadata;

    // 1. Calculate the intersection of the viewport with the COG boundary (in WGS84)
    const west = Math.max(viewportWgs84[0], wgs84Bounds[0]);
    const south = Math.max(viewportWgs84[1], wgs84Bounds[1]);
    const east = Math.min(viewportWgs84[2], wgs84Bounds[2]);
    const north = Math.min(viewportWgs84[3], wgs84Bounds[3]);

    // Check if there is an actual overlap
    if (west >= east || south >= north) {
      return null;
    }

    const overlapWgs84: [number, number, number, number] = [west, south, east, north];

    // 2. Project overlap corners to COG native coordinates
    const nativeMin = this.projectFromWgs84(west, south);
    const nativeMax = this.projectFromWgs84(east, north);

    // Keep bounds properly oriented in native space
    const nativeOverlapXMin = Math.min(nativeMin[0], nativeMax[0]);
    const nativeOverlapXMax = Math.max(nativeMin[0], nativeMax[0]);
    const nativeOverlapYMin = Math.min(nativeMin[1], nativeMax[1]);
    const nativeOverlapYMax = Math.max(nativeMin[1], nativeMax[1]);

    // 3. Map native coordinates to pixel positions of the FULL image
    const [nMinX, nMinY, nMaxX, nMaxY] = nativeBounds;
    const totalNativeWidth = nMaxX - nMinX;
    const totalNativeHeight = nMaxY - nMinY;

    // pixelLeft, pixelRight, pixelTop, pixelBottom
    const pLeft = Math.max(0, Math.floor(((nativeOverlapXMin - nMinX) / totalNativeWidth) * fullWidth));
    const pRight = Math.min(fullWidth, Math.ceil(((nativeOverlapXMax - nMinX) / totalNativeWidth) * fullWidth));

    // Note: TIFF coordinate system has y=0 at top
    const pTop = Math.max(0, Math.floor(((nMaxY - nativeOverlapYMax) / totalNativeHeight) * fullHeight));
    const pBottom = Math.min(fullHeight, Math.ceil(((nMaxY - nativeOverlapYMin) / totalNativeHeight) * fullHeight));

    const pixelWindowWidth = pRight - pLeft;
    const pixelWindowHeight = pBottom - pTop;

    if (pixelWindowWidth <= 0 || pixelWindowHeight <= 0) {
      return null;
    }

    // 4. Select the best overview image index
    const imageCount = await this.tiff.getImageCount();
    let bestImageIndex = 0;
    const targetSize = 512; // Render target size to balance resolution and speed

    for (let i = 0; i < imageCount; i++) {
      const img = await this.tiff.getImage(i);
      const scale = img.getWidth() / fullWidth;
      const overviewWindowWidth = pixelWindowWidth * scale;
      if (overviewWindowWidth >= targetSize) {
        bestImageIndex = i;
      } else {
        break; // Stop when the overview is too low resolution
      }
    }

    const renderImage = await this.tiff.getImage(bestImageIndex);
    const scale = renderImage.getWidth() / fullWidth;

    // 5. Compute window coordinates for the selected overview level
    const overviewWidth = renderImage.getWidth();
    const overviewHeight = renderImage.getHeight();

    const overviewWindow = [
      Math.max(0, Math.floor(pLeft * scale)),
      Math.max(0, Math.floor(pTop * scale)),
      Math.min(overviewWidth, Math.ceil(pRight * scale)),
      Math.min(overviewHeight, Math.ceil(pBottom * scale)),
    ];

    const wWidth = overviewWindow[2] - overviewWindow[0];
    const wHeight = overviewWindow[3] - overviewWindow[1];

    if (wWidth <= 0 || wHeight <= 0) {
      return null;
    }

    // 6. Read rasters for the window
    let rasters;
    try {
      rasters = await renderImage.readRasters({
        window: overviewWindow,
      });
    } catch (err) {
      console.error("Error reading COG rasters:", err);
      return null;
    }

    // 7. Render pixels onto a canvas
    const canvas = document.createElement("canvas");
    canvas.width = wWidth;
    canvas.height = wHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imgData = ctx.createImageData(wWidth, wHeight);
    const data = imgData.data;

    // Handle planar configuration & bands
    const isPlanar = Array.isArray(rasters);
    const bands = options.bands || (bandsCount >= 3 ? [1, 2, 3] : [1]);

    // Gather band typed arrays
    let rBand: any, gBand: any, bBand: any;
    if (isPlanar) {
      const rasterArr = rasters as any[];
      rBand = rasterArr[Math.min(bands[0] - 1, rasterArr.length - 1)];
      gBand = bands[1] !== undefined ? rasterArr[Math.min(bands[1] - 1, rasterArr.length - 1)] : rBand;
      bBand = bands[2] !== undefined ? rasterArr[Math.min(bands[2] - 1, rasterArr.length - 1)] : rBand;
    } else {
      // Interleaved chunky pixels
      const singleArr = rasters as any;
      // We will slice/extract bands inside the loop for Chunky configurations
    }

    // Min/Max statistics for scaling
    let minVal = options.minVal;
    let maxVal = options.maxVal;

    // Auto-calculate min/max if not provided
    if (minVal === undefined || maxVal === undefined) {
      let min = Infinity;
      let max = -Infinity;

      if (isPlanar) {
        const checkArray = rBand;
        for (let j = 0; j < checkArray.length; j++) {
          const val = checkArray[j];
          if (noDataValue !== null && val === noDataValue) continue;
          if (isNaN(val)) continue;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      } else {
        const checkArray = rasters as any;
        for (let j = 0; j < checkArray.length; j += bandsCount) {
          const val = checkArray[j];
          if (noDataValue !== null && val === noDataValue) continue;
          if (isNaN(val)) continue;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }

      if (min === Infinity) {
        min = 0;
        max = 255;
      } else if (min === max) {
        max = min + 1;
      }

      minVal = minVal !== undefined ? minVal : min;
      maxVal = maxVal !== undefined ? maxVal : max;
    }

    const range = maxVal - minVal || 1;
    const colormap = COLORMAPS[options.colormapName || "viridis"] || COLORMAPS.viridis;

    // Fill ImageData
    for (let iY = 0; iY < wHeight; iY++) {
      for (let iX = 0; iX < wWidth; iX++) {
        const pixelIdx = iY * wWidth + iX;
        const dataIdx = pixelIdx * 4;

        let r = 0, g = 0, b = 0, a = 255;
        let isNoData = false;

        if (isPlanar) {
          const valR = rBand[pixelIdx];
          const valG = gBand ? gBand[pixelIdx] : valR;
          const valB = bBand ? bBand[pixelIdx] : valR;

          // Check nodata
          if (noDataValue !== null && (valR === noDataValue || isNaN(valR))) {
            isNoData = true;
          } else {
            if (bands.length >= 3) {
              // RGB scale to [0-255]
              r = Math.round(Math.max(0, Math.min(255, ((valR - minVal) / range) * 255)));
              g = Math.round(Math.max(0, Math.min(255, ((valG - minVal) / range) * 255)));
              b = Math.round(Math.max(0, Math.min(255, ((valB - minVal) / range) * 255)));
            } else {
              // Single band: Apply colormap
              const norm = Math.max(0, Math.min(1, (valR - minVal) / range));
              const rgb = colormap(norm);
              r = rgb[0];
              g = rgb[1];
              b = rgb[2];
            }
          }
        } else {
          // Chunky configuration
          const chunkyArr = rasters as any;
          const srcIdx = pixelIdx * bandsCount;
          const valR = chunkyArr[srcIdx + Math.min(bands[0] - 1, bandsCount - 1)];

          if (noDataValue !== null && (valR === noDataValue || isNaN(valR))) {
            isNoData = true;
          } else {
            if (bands.length >= 3) {
              const valG = chunkyArr[srcIdx + Math.min((bands[1] || 2) - 1, bandsCount - 1)];
              const valB = chunkyArr[srcIdx + Math.min((bands[2] || 3) - 1, bandsCount - 1)];

              r = Math.round(Math.max(0, Math.min(255, ((valR - minVal) / range) * 255)));
              g = Math.round(Math.max(0, Math.min(255, ((valG - minVal) / range) * 255)));
              b = Math.round(Math.max(0, Math.min(255, ((valB - minVal) / range) * 255)));
            } else {
              const norm = Math.max(0, Math.min(1, (valR - minVal) / range));
              const rgb = colormap(norm);
              r = rgb[0];
              g = rgb[1];
              b = rgb[2];
            }
          }
        }

        if (isNoData) {
          data[dataIdx] = 0;
          data[dataIdx + 1] = 0;
          data[dataIdx + 2] = 0;
          data[dataIdx + 3] = 0; // Transparent
        } else {
          data[dataIdx] = r;
          data[dataIdx + 1] = g;
          data[dataIdx + 2] = b;
          data[dataIdx + 3] = a;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      canvas,
      bounds: overlapWgs84,
    };
  }
}
