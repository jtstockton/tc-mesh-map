import { geohash8, parseLocation } from '../content/shared.js'

async function getElevation(lat, lon) {
  try {
    const apiUrl = `https://api.opentopodata.org/v1/ned10m?locations=${lat},${lon}`;
    const resp = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await resp.json();
    return data.results[0].elevation;
  } catch (e) {
    console.log(`Error getting elevation for [${lat},${lon}]. ${e}`);
    return null;
  }
}

export async function onRequest(context) {
  const request = context.request;
  const data = await request.json();
  
  // TODO: Pass in geohash directly.
  const [lat, lon] = parseLocation(data.lat, data.lon);
  const hash = geohash8(lat, lon);
  const time = Date.now();
  const id = data.id.toLowerCase();
  const name = data.name;
  let elevation = data.elevation ?? null;

  if (elevation === null) {
    // Get the existing elevation if any.
    const row = await context.env.DB
      .prepare("SELECT elevation FROM repeaters WHERE id = ? AND hash = ?")
      .bind(id, hash)
      .first();

    elevation = row?.elevation ?? await getElevation(lat, lon);
  }

  await context.env.DB
    .prepare(`
      INSERT OR REPLACE INTO repeaters
        (id, hash, time, name, elevation)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(id, hash, time, name, elevation)
    .run();

  return new Response('OK');
}
