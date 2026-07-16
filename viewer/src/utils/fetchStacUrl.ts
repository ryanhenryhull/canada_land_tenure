export async function fetchStacUrl(url: string) {
  const res = await fetch(url);

  const text = await res.text();

  // If the response starts with "<", it's HTML, not JSON
  if (text.trim().startsWith("<")) {
    throw new Error(`Received HTML instead of JSON from ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("JSON parse error at:", url);
    console.error("Response was:", text.slice(0, 200));
    throw err;
  }
}

