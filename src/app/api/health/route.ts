// Lightweight liveness probe for the container HEALTHCHECK and the compose
// `service_healthy` gate. Static and dependency-free so it stays cheap to hit
// on a short interval — a 200 here just means the server process is up.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "ok" });
}
