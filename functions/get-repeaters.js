export async function onRequest(context) {
  const store = context.env.REPEATERS;
  const results = [];
  let cursor = null;

  do {
    const repeaters = await store.list({ cursor: cursor });
    cursor = repeaters.cursor ?? null;
    repeaters.keys.forEach(r => {
      results.push({
        key: r.name,
        id: r.metadata.id,
        name: r.metadata.name,
        lat: r.metadata.lat,
        lon: r.metadata.lon,
        elev: r.metadata.elev,
        time: r.metadata.time
      });
    });
  } while (cursor !== null)

  return Response.json(results);
}
