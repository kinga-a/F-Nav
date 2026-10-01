// 调试接口（需要认证）
// 支持 EdgeOne Pages / Cloudflare Workers
// [安全] VULN-10：仅在 ENVIRONMENT === 'development' 时启用，避免生产环境暴露 env 键名情报

import { getKV, getCorsHeaders, verifyAuth, jsonResponse, getAuthToken } from './_kvAdapter.js';

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(env, request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // [安全] 生产环境一律不提供调试信息
  const isDev = env?.ENVIRONMENT === 'development' || env?.NODE_ENV === 'development';
  if (!isDev) {
    return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
  }

  // 认证检查（通过 query param 或标准鉴权头）
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || getAuthToken(request);

  const isAuthenticated = await verifyAuth({
    providedPassword: token,
    serverPassword: env.PASSWORD,
    kv: getKV(env),
  });

  if (!isAuthenticated) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  // 返回调试信息
  const result = {
    message: 'Debug Info',
    envKeys: {},
    kvStatus: 'Unknown',
  };

  try {
    if (env) {
      for (const key in env) {
        const value = env[key];
        result.envKeys[key] = typeof value === 'string' ? 'String (Hidden)' : typeof value;
      }
    }

    try {
      const kv = getKV(env);
      // 测试 KV 可读
      await kv.get('__ping__');
      result.kvStatus = 'OK';
    } catch (e) {
      result.kvStatus = 'Error';
    }

    return jsonResponse(result, 200, corsHeaders);

  } catch (e) {
    // [安全] VULN-04：不向客户端泄漏内部异常详情
    const requestId = crypto.randomUUID();
    console.error(`Debug API error [${requestId}]:`, e);
    return jsonResponse({
      error: 'Exception in debug function',
      requestId,
    }, 500, corsHeaders);
  }
}
