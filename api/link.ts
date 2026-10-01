// Vercel 链接添加接口
// [安全] 标准 Authorization 鉴权头 + 错误信息脱敏
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKV, getCorsHeaders, verifyAuth, getAuthToken, jsonResponse } from './_kvHelper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'] || '').end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Method Not Allowed' }, corsHeaders);
  }

  const providedPassword = getAuthToken(req) || '';
  const isAuthenticated = await verifyAuth(providedPassword);

  if (!isAuthenticated) {
    return jsonResponse(res, 401, { error: 'Unauthorized' }, corsHeaders);
  }

  try {
    const kv = getKV();
    const newLinkData = req.body;

    if (!newLinkData.title || !newLinkData.url) {
      return res.status(400).json({ error: 'Missing title or url' });
    }

    const catsStr = await kv.get('cate_config');
    const categories = catsStr ? (typeof catsStr === 'string' ? JSON.parse(catsStr) : catsStr) : [];

    let targetCatId = '';
    let targetCatName = '';

    if (newLinkData.categoryId) {
      const explicitCat = categories.find((c: any) => c.id === newLinkData.categoryId);
      if (explicitCat) {
        targetCatId = explicitCat.id;
        targetCatName = explicitCat.name;
      }
    }

    if (!targetCatId && categories.length > 0) {
      const keywords = ['收集', '未分类', 'inbox', 'temp', 'later'];
      const match = categories.find((c: any) =>
        keywords.some((k: string) => c.name.toLowerCase().includes(k))
      );
      if (match) {
        targetCatId = match.id;
        targetCatName = match.name;
      } else {
        const common = categories.find((c: any) => c.id === 'common');
        if (common) {
          targetCatId = 'common';
          targetCatName = common.name;
        } else {
          targetCatId = categories[0].id;
          targetCatName = categories[0].name;
        }
      }
    }

    if (!targetCatId) {
      targetCatId = 'common';
      targetCatName = '默认';
    }

    const newLink = {
      id: Date.now().toString(),
      title: newLinkData.title,
      url: newLinkData.url,
      description: newLinkData.description || '',
      categoryId: targetCatId,
      createdAt: Date.now(),
      pinned: false,
      icon: newLinkData.icon || undefined,
    };

    // 读取该分类的现有链接 (分 key 存储)
    const existingStr = await kv.get(`links:${targetCatId}`);
    const existing = existingStr ? (typeof existingStr === 'string' ? JSON.parse(existingStr) : existingStr) : [];

    const updatedLinks = [newLink, ...existing];
    await kv.set(`links:${targetCatId}`, JSON.stringify(updatedLinks));

    return jsonResponse(res, 200, {
      success: true,
      link: newLink,
      categoryName: targetCatName,
    }, corsHeaders);

  } catch (err: any) {
    // [安全] VULN-04：不向客户端泄漏内部异常详情
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
    console.error(`Link API error [${requestId}]:`, err);
    return jsonResponse(res, 500, { error: '服务暂时不可用', requestId }, corsHeaders);
  }
}

