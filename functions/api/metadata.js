// 抓取目标网页的 <title> 与 <meta name="description">，用于无 AI 时自动填写书签信息
import { getCorsHeaders, jsonResponse } from './_kvAdapter.js';

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
  }

  const target = new URL(request.url).searchParams.get('url');
  if (!target) {
    return jsonResponse({ error: 'url parameter required' }, 400, corsHeaders);
  }

  let targetUrl;
  try {
    targetUrl = new URL(target.startsWith('http') ? target : `https://${target}`);
  } catch (e) {
    return jsonResponse({ error: 'invalid url' }, 400, corsHeaders);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return jsonResponse({ error: `fetch failed: ${res.status}` }, 502, corsHeaders);
    }

    // 只取前 200KB 足够解析 head
    const reader = res.body.getReader();
    let received = 0;
    const chunks = [];
    while (received < 200000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
    }
    reader.cancel();

    const html = new TextDecoder('utf-8', { fatal: false }).concat(new Uint8Array(chunks));
    const headEnd = html.toLowerCase().indexOf('</head>');
    const head = headEnd >= 0 ? html.slice(0, headEnd) : html.slice(0, 200000);

    // title
    let title = '';
    const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) title = decodeEntities(titleMatch[1]);

    // meta description: name=description 优先，其次 og:description
    let description = '';
    const metaRe = /<meta[^>]+>/gi;
    let m;
    while ((m = metaRe.exec(head)) !== null) {
      const tag = m[0];
      const name = (tag.match(/name\s*=\s*["']([^"']+)["']/i) || tag.match(/property\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
      if (name.toLowerCase() === 'description' || name.toLowerCase() === 'og:description') {
        const content = (tag.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
        if (content) {
          description = decodeEntities(content);
          if (name.toLowerCase() === 'description') break;
        }
      }
    }

    return jsonResponse({ title, description }, 200, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=86400',
    });
  } catch (e) {
    return jsonResponse({ error: 'fetch failed', detail: String(e) }, 502, corsHeaders);
  }
}
