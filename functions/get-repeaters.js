export async function onRequest(context) {
  const { results } = await context.env.DB
    .prepare("SELECT * FROM repeaters")
    .all()

  return Response.json(results);
}
