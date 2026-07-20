export async function fetchStacUrl(url: string) {
  // Force absolute URL fetch, bypassing dev-server routing
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    redirect: "follow",
    cache: "no-cache",
    headers: {
      "Accept": "application/json",
    }
  });

  const text = await res.text();

  // Detect HTML fallback
  if (text.trim().startsWith("<")) {
    console.error("HTML received instead of JSON from:", url);
    console.error("Response snippet:", text.slice(0, 200));
    throw new Error(`Received HTML instead of JSON from ${url}`);
  }

  return JSON.parse(text);
}

