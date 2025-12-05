/**
 * URL utility functions for handling base URLs in development and production
 */

/**
 * Get the base URL for the application
 * Works in both development and production environments
 * @param req - Optional request object for server-side URL detection
 * @returns The base URL without trailing slash
 */
export function getBaseUrl(req?: { headers: { host?: string; 'x-forwarded-proto'?: string; 'x-forwarded-host'?: string } }): string {
  // 1. First try environment variable (preferred)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // 2. For client-side (browser)
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // 3. For server-side with request object
  if (req && req.headers) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';

    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // 4. Try to detect from Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 5. Try to detect from other common hosting environments
  if (process.env.RAILWAY_STATIC_URL) {
    return process.env.RAILWAY_STATIC_URL.replace(/\/$/, '');
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }

  // 6. For VPS/Docker deployments, try to detect from common environment variables
  if (process.env.DOMAIN) {
    const protocol = process.env.SSL === 'true' || process.env.HTTPS === 'true' ? 'https' : 'http';
    return `${protocol}://${process.env.DOMAIN}`;
  }

  if (process.env.HOST && process.env.HOST !== '0.0.0.0' && process.env.HOST !== 'localhost') {
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const port = process.env.PORT && process.env.PORT !== '80' && process.env.PORT !== '443' ? `:${process.env.PORT}` : '';
    return `${protocol}://${process.env.HOST}${port}`;
  }

  // 7. Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the base URL specifically for sitemap generation
 * This function tries to use production-friendly detection methods
 * @param host - Optional host string from request headers
 * @returns The base URL for sitemap
 */
export function getSitemapBaseUrl(host?: string): string {
  // 1. If host is provided (from request headers), use it
  if (host) {
    const protocol = process.env.HTTPS === 'true' || process.env.SSL === 'true' ? 'https' : 'http';
    // Check if host already includes protocol
    if (host.startsWith('http')) {
      return host.replace(/\/$/, '');
    }
    return `${protocol}://${host}`;
  }

  console.log('🗺️ Sitemap URL Detection - Environment variables:', {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    DOMAIN: process.env.DOMAIN,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    SSL: process.env.SSL,
    HTTPS: process.env.HTTPS,
    NODE_ENV: process.env.NODE_ENV
  });

  // For sitemap, we prefer production URLs
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    console.log('🗺️ Using NEXT_PUBLIC_SITE_URL for sitemap:', url);
    return url;
  }

  // Try Vercel URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('🗺️ Using VERCEL_URL for sitemap:', url);
    return url;
  }

  // Try other hosting platforms
  if (process.env.RAILWAY_STATIC_URL) {
    const url = process.env.RAILWAY_STATIC_URL.replace(/\/$/, '');
    console.log('🗺️ Using RAILWAY_STATIC_URL for sitemap:', url);
    return url;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
    console.log('🗺️ Using RENDER_EXTERNAL_URL for sitemap:', url);
    return url;
  }

  // For VPS deployments, try to detect from common environment variables
  if (process.env.DOMAIN) {
    const protocol = process.env.SSL === 'true' || process.env.HTTPS === 'true' ? 'https' : 'http';
    const url = `${protocol}://${process.env.DOMAIN}`;
    console.log('🗺️ Using DOMAIN for sitemap:', url);
    return url;
  }

  // Try Coolify-specific environment variables
  if (process.env.COOLIFY_URL) {
    const url = process.env.COOLIFY_URL.replace(/\/$/, '');
    console.log('🗺️ Using COOLIFY_URL for sitemap:', url);
    return url;
  }

  // Try common VPS environment variables
  if (process.env.APP_URL) {
    const url = process.env.APP_URL.replace(/\/$/, '');
    console.log('🗺️ Using APP_URL for sitemap:', url);
    return url;
  }

  if (process.env.PUBLIC_URL) {
    const url = process.env.PUBLIC_URL.replace(/\/$/, '');
    console.log('🗺️ Using PUBLIC_URL for sitemap:', url);
    return url;
  }

  // For production environments, try to construct URL from available info
  if (process.env.NODE_ENV === 'production') {
    // Check if we have any hostname info that's not localhost/0.0.0.0
    const hostname = process.env.HOSTNAME || process.env.HOST;
    if (hostname && hostname !== '0.0.0.0' && hostname !== 'localhost' && !hostname.includes('localhost')) {
      const protocol = process.env.HTTPS === 'true' || process.env.SSL === 'true' ? 'https' : 'http';
      const port = process.env.PORT && process.env.PORT !== '80' && process.env.PORT !== '443' ? `:${process.env.PORT}` : '';
      const url = `${protocol}://${hostname}${port}`;
      console.log('🗺️ Using constructed URL from hostname for sitemap:', url);
      return url;
    }

    // If we're in production but can't detect URL, warn but fallback to localhost or empty
    // Do NOT use a hardcoded domain that might be incorrect
    console.warn('⚠️ Production environment detected but no valid URL found for sitemap!');
    console.warn('⚠️ Please set NEXT_PUBLIC_SITE_URL environment variable.');
  }

  if (process.env.HOST && process.env.HOST !== '0.0.0.0' && process.env.HOST !== 'localhost') {
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const port = process.env.PORT && process.env.PORT !== '80' && process.env.PORT !== '443' ? `:${process.env.PORT}` : '';
    const url = `${protocol}://${process.env.HOST}${port}`;
    console.log('🗺️ Using HOST for sitemap:', url);
    return url;
  }

  // Last resort: localhost for development
  console.warn('⚠️ Sitemap falling back to localhost - no production URL detected!');
  return 'http://localhost:3000';
}

/**
 * Get the base URL for email templates and notifications
 * This ensures emails always have proper production URLs
 * @returns The base URL for email links
 */
export function getEmailBaseUrl(): string {
  // For emails, we absolutely need production URLs
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using NEXT_PUBLIC_SITE_URL for email URLs:', url);
    }
    return url;
  }

  // Try Vercel URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using VERCEL_URL for email URLs:', url);
    }
    return url;
  }

  // Try other hosting platforms
  if (process.env.RAILWAY_STATIC_URL) {
    const url = process.env.RAILWAY_STATIC_URL.replace(/\/$/, '');
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using RAILWAY_STATIC_URL for email URLs:', url);
    }
    return url;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using RENDER_EXTERNAL_URL for email URLs:', url);
    }
    return url;
  }

  // For VPS deployments
  if (process.env.DOMAIN) {
    const protocol = process.env.SSL === 'true' || process.env.HTTPS === 'true' ? 'https' : 'http';
    const url = `${protocol}://${process.env.DOMAIN}`;
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using DOMAIN for email URLs:', url);
    }
    return url;
  }

  // Skip 0.0.0.0 as it's not a valid public URL
  if (process.env.HOST && process.env.HOST !== '0.0.0.0' && process.env.HOST !== 'localhost') {
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const port = process.env.PORT && process.env.PORT !== '80' && process.env.PORT !== '443' ? `:${process.env.PORT}` : '';
    const url = `${protocol}://${process.env.HOST}${port}`;
    if (process.env.NODE_ENV === 'production') {
      console.log('🔗 Using HOST for email URLs:', url);
    }
    return url;
  }

  // Warn if we're falling back to localhost in what might be production
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Using localhost URL in production environment. Please set NEXT_PUBLIC_SITE_URL or DOMAIN environment variable.');
    console.warn('⚠️  Available environment variables:', {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      DOMAIN: process.env.DOMAIN,
      HOST: process.env.HOST,
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    });
  }

  return 'http://localhost:3000';
}

/**
 * Create a full URL by combining base URL with a path
 * @param path - The path to append (with or without leading slash)
 * @param req - Optional request object for server-side detection
 * @returns Full URL
 */
export function createUrl(path: unknown, req?: { headers: { host?: string; 'x-forwarded-proto'?: string; 'x-forwarded-host'?: string } }): string {
  const baseUrl = getBaseUrl(req);
  const p = typeof path === 'string' ? path : String(path ?? '')
  const cleanPath = p.charAt(0) === '/' ? p : `/${p}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Create a full URL for email templates
 * @param path - The path to append
 * @returns Full URL for email
 */
export function createEmailUrl(path: unknown): string {
  const baseUrl = getEmailBaseUrl();
  const p = typeof path === 'string' ? path : String(path ?? '')
  const cleanPath = p.charAt(0) === '/' ? p : `/${p}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Create a full URL for sitemap
 * @param path - The path to append
 * @param host - Optional host string from request headers
 * @returns Full URL for sitemap
 */
export function createSitemapUrl(path: unknown, host?: string): string {
  const baseUrl = getSitemapBaseUrl(host);
  const p = typeof path === 'string' ? path : String(path ?? '')
  const cleanPath = p.charAt(0) === '/' ? p : `/${p}`;
  return `${baseUrl}${cleanPath}`;
}