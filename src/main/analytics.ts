import { app } from 'electron';
import https from 'https';
import crypto from 'crypto';
import Store from 'electron-store';

// Umami configuration
const UMAMI_WEBSITE_ID = '83ac1cf1-b9f4-400a-a093-66c93b1ee9a2';
const UMAMI_ENDPOINT = 'https://analytics.helsky-labs.com/api/send';

// Store for persisting anonymous ID
const analyticsStore = new Store<{ anonymousId: string }>({
  name: 'analytics',
  defaults: {
    anonymousId: '',
  },
});

// Generate or retrieve anonymous device ID
function getAnonymousId(): string {
  let id = analyticsStore.get('anonymousId');
  if (!id) {
    // Generate a random anonymous ID and persist it
    id = crypto.randomBytes(8).toString('hex');
    analyticsStore.set('anonymousId', id);
  }
  return id;
}

interface TrackEventOptions {
  name: string;
  data?: Record<string, string | number | boolean>;
}

/**
 * Track an event to Umami analytics
 * Follows Umami's tracking API format
 */
export async function trackEvent({ name, data }: TrackEventOptions): Promise<void> {
  try {
    const payload = {
      payload: {
        hostname: 'tokencentric.app',
        language: app.getLocale(),
        referrer: '',
        screen: '1920x1080', // Default screen size
        title: 'Tokencentric',
        url: `/${name}`,
        website: UMAMI_WEBSITE_ID,
        name: name,
        data: data || {},
      },
      type: 'event',
    };

    const postData = JSON.stringify(payload);
    const url = new URL(UMAMI_ENDPOINT);

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': `Tokencentric/${app.getVersion()} (${process.platform})`,
            'X-Client-Id': getAnonymousId(),
          },
        },
        (res) => {
          // We don't need to process the response
          res.on('data', () => {});
          res.on('end', () => resolve());
        }
      );

      req.on('error', (error) => {
        // Silently fail - analytics should never break the app
        console.debug('Analytics error (non-critical):', error.message);
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve();
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.debug('Analytics error (non-critical):', error);
  }
}

/**
 * Track a page view (for app sections)
 */
export async function trackPageView(pageName: string): Promise<void> {
  return trackEvent({ name: `view_${pageName}` });
}
