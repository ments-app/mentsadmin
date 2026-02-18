// Shared website scraper utility
// Fetches a URL and returns cleaned plain-text (truncated to ~2500 chars)

export async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    const normalised = url.startsWith('http') ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(normalised, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MentsAdmin/1.0; +https://ments.app)',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Extract useful meta & text from the HTML
    const parts: string[] = [];

    // <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) parts.push(`Title: ${clean(titleMatch[1])}`);

    // meta description
    const metaDesc = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    );
    if (metaDesc) parts.push(`Meta description: ${clean(metaDesc[1])}`);

    // og:description
    const ogDesc = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
    );
    if (ogDesc && (!metaDesc || clean(ogDesc[1]) !== clean(metaDesc[1]))) {
      parts.push(`OG description: ${clean(ogDesc[1])}`);
    }

    // og:title
    const ogTitle = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
    );
    if (ogTitle) parts.push(`OG title: ${clean(ogTitle[1])}`);

    // Keywords
    const keywords = html.match(
      /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i
    );
    if (keywords) parts.push(`Keywords: ${clean(keywords[1])}`);

    // Extract visible body text (strip scripts, styles, tags)
    let bodyText = '';
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyText = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (bodyText) {
      // Take the first ~1500 chars of body text as context
      parts.push(`Page content: ${bodyText.slice(0, 1500)}`);
    }

    const result = parts.join('\n');
    return result.length > 0 ? result.slice(0, 2500) : null;
  } catch {
    return null;
  }
}

export function clean(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/&[a-z]+;/gi, ' ').trim();
}
