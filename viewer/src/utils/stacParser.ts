import { StacCatalogNode, StacCollection, StacItem, StacAsset } from "../types";

export async function fetchStacUrl(url: string): Promise<any> {
  const isExternal = url.startsWith("http") && !url.includes(window.location.host);
  const fetchUrl = isExternal ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch STAC metadata: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

// Ryan notes: changed this function to prevent incorrect html/json r2 fetching
// Convert absolute or relative href to fully qualified URL based on base URL
//export function resolveUrl(baseUrl: string, relativeUrl: string): string {
//  try {
//    return new URL(relativeUrl, baseUrl).toString();
//  } catch (e) {
//    return relativeUrl;
//  }
//}

export function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    console.warn("Bad STAC href:", href, "base:", base);
    return href;
  }
}


export interface ParsedStacNode {
  id: string;
  type: 'catalog' | 'collection' | 'item';
  title: string;
  description: string;
  url: string;
  children: Array<{
    rel: string;
    href: string;
    title: string;
    type?: string;
  }>;
  assets?: Record<string, StacAsset>;
  geometry?: any;
  properties?: Record<string, any>;
}

export async function parseStacNode(url: string): Promise<ParsedStacNode> {
  const data = await fetchStacUrl(url);
  
  const type = data.type === 'Feature' ? 'item' : (data.extent ? 'collection' : 'catalog');
  const id = data.id || 'root';
  const title = data.title || data.id || 'STAC Node';
  const description = data.description || '';

  const children: Array<{ rel: string; href: string; title: string; type?: string }> = [];

  if (Array.isArray(data.links)) {
    data.links.forEach((link: any) => {
      if (['child', 'item', 'collection'].includes(link.rel)) {
        children.push({
          rel: link.rel,
          href: resolveUrl(url, link.href),
          title: link.title || link.id || `${link.rel} (${link.href.split('/').pop()})`,
          type: link.type
        });
      }
    });
  }

  return {
    id,
    type,
    title,
    description,
    url,
    children,
    assets: data.assets,
    geometry: data.geometry,
    properties: data.properties
  };
}
