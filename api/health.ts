export default {
  async fetch() {
    return Response.json({
      ok: true,
      service: "portfolio-api",
      timestamp: new Date().toISOString(),
    });
  },
};
