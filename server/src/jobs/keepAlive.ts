/**
 * Keep-Alive Service for Render Free Tier
 * Render spins down free web services after 15 minutes of inactivity.
 * This background job pings the service's public URL every 14 minutes
 * to register inbound traffic with Render's router and prevent idling.
 */

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes (Render idle timeout is 15 minutes)

export const startKeepAliveJob = () => {
  // Render automatically populates RENDER_EXTERNAL_URL in production (e.g., https://my-service.onrender.com)
  const serviceUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;

  if (!serviceUrl) {
    console.log(
      "[KeepAlive] No RENDER_EXTERNAL_URL or SERVER_URL found. Self-pinging is disabled (normal for local development)."
    );
    return;
  }

  const pingUrl = `${serviceUrl.replace(/\/$/, "")}/health`;
  console.log(`[KeepAlive] Service active. Auto-pinging ${pingUrl} every 14 minutes.`);

  // Initial ping after 30 seconds of starting up
  const initialTimeout = setTimeout(() => pingHealth(pingUrl), 30 * 1000);
  if (initialTimeout.unref) {
    initialTimeout.unref();
  }

  // Recurring ping every 14 minutes
  const intervalId = setInterval(() => {
    pingHealth(pingUrl);
  }, PING_INTERVAL_MS);

  if (intervalId.unref) {
    intervalId.unref();
  }
};

async function pingHealth(url: string) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`[KeepAlive] Ping successful at ${new Date().toISOString()} (status: ${res.status})`);
    } else {
      console.warn(`[KeepAlive] Ping responded with status ${res.status} at ${new Date().toISOString()}`);
    }
  } catch (error: any) {
    console.error(`[KeepAlive] Ping error:`, error?.message || error);
  }
}
