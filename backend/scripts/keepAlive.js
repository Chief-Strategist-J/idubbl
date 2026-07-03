// Pings the backend's own /health endpoint so Render's free-tier instance
// never sits idle long enough to spin down. Run on a schedule (see
// render.yaml cron job), not as a long-lived process.
const url = `${process.env.SELF_URL || 'https://idubbl-backend.onrender.com'}/health`;

const res = await fetch(url);
console.log(`Keep-alive ping ${url} -> ${res.status}`);
