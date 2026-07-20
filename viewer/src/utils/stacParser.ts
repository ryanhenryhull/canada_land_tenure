import { StacCatalogNode, StacCollection, StacItem, StacAsset } from "../types";
import { fetchStacUrl } from "./fetchStacUrl";

// Convert absolute or relative href to fully qualified URL based on base URL
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
