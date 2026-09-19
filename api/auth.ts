// Vercel 认证接口
// 含 TOTP 两步验证（RFC 6238）
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKV, getCorsHeaders, generateSecureToken, calcExpiryTtl, verifyAuth } from './_kvHelper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const corsHeaders = getCorsHeaders();

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const kv = getKV();
    const body = req.body as any;

    // ==================== TOTP 管理操作（需要有效 Token） ====================
    if (body.action === 'totp-setup' || body.action === 'totp-activate' || body.action === 'totp-disable') {
      const token = req.headers['x-auth-password'] as string;
      const isAdmin = await verifyAuth(token);
      if (!isAdmin) {
        return res.status(401).json({ error: '请先登录' });
      }

      if (body.action === 'totp-setup') {
        const secret = generateTotpSecret();
        await kv.set('totp_pending', secret);
        const otpauth = `otpauth://totp/F-Nav:admin?secret=${secret}&issuer=F-Nav&algorithm=SHA1&digits=6&period=30`;
        return res.status(200).json({ success: true, secret, otpauth });
      }

      if (body.action === 'totp-activate') {
        const pending = await kv.get('totp_pending');
        if (!pending) {
          return res.status(400).json({ error: '请先生成密钥' });
        }
        const ok = await verifyTotp(pending, String(body.code || '').trim());
        if (!ok) {
          return res.status(401).json({ error: '动态验证码错误，请检查验证器时间后重试' });
        }
        const recovery = generateRecoveryCode();
        await kv.set('totp_secret', pending);
        await kv.set('totp_recovery', recovery);
        await kv.del('totp_pending');
        return res.status(200).json({ success: true, recovery });
      }

      if (body.action === 'totp-disable') {
        await kv.del('totp_secret');
        await kv.del('totp_recovery');
        await kv.del('totp_pending');
        return res.status(200).json({ success: true });
      }
    }

    // ==================== 普通登录 ====================
    const { password, totp } = body;

    if (!process.env.PASSWORD) {
      console.error('Environment variable PASSWORD is not set');
      return res.status(500).json({ error: '服务器未配置管理员密码' });
    }

    if (password !== process.env.PASSWORD) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 两步验证：若已启用 TOTP，必须校验动态码或恢复码
    const totpSecret = await kv.get('totp_secret');
    if (totpSecret) {
      const code = String(totp || '').trim();
      const recovery = await kv.get('totp_recovery');
      if (recovery && code.toLowerCase() === recovery.toLowerCase()) {
        // 恢复码登录：一次性有效，自动关闭两步验证
        await kv.del('totp_secret');
        await kv.del('totp_recovery');
      } else if (await verifyTotp(totpSecret, code)) {
        // 动态码正确
      } else {
        return res.status(401).json({ error: '动态验证码错误或已过期' });
      }
    }

    // 清理旧 Token
    try {
      const oldToken = await kv.get('last_token');
      if (oldToken) {
        await kv.del(`auth_token:${oldToken}`);
      }
    } catch (e) {
      console.warn('Failed to clean old token:', e);
    }

    const token = generateSecureToken();

    let expirationTtl = 24 * 60 * 60;
    try {
      const configData = await kv.get('config');
      if (configData) {
        const config = typeof configData === 'string' ? JSON.parse(configData) : configData;
        const expiry = config.website?.passwordExpiry;
        if (expiry) {
          expirationTtl = calcExpiryTtl(expiry) || 24 * 60 * 60;
        }
      }
    } catch (e) {
      console.warn('Failed to read expiry config:', e);
    }

    await kv.set('last_auth_time', Date.now().toString());
    if (expirationTtl) {
      await kv.set(`auth_token:${token}`, 'valid', { ex: expirationTtl });
      await kv.set('last_token', token, { ex: expirationTtl });
    } else {
      await kv.set(`auth_token:${token}`, 'valid');
      await kv.set('last_token', token);
    }

    return res.status(200).json({ success: true, token, message: '认证成功' });

  } catch (err: any) {
    console.error('Auth API error:', err);
    return res.status(500).json({ error: '认证请求失败', details: err.message });
  }
}

// ==================== TOTP (RFC 6238) 工具函数 ====================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Uint8Array {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of String(str).replace(/=+$/g, '').toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** 生成 20 字节随机 TOTP 密钥（base32） */
function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** 生成恢复码，格式 fnav-xxxx-xxxx-xxxx */
function generateRecoveryCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `fnav-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/** 计算指定计数器的 6 位 TOTP 码 */
async function totpCodeAt(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 1000000).padStart(6, '0');
}

/** 校验 TOTP 码（允许 ±1 个 30 秒窗口的时钟偏差） */
async function verifyTotp(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.now() / 30000);
  for (let c = counter - 1; c <= counter + 1; c++) {
    if ((await totpCodeAt(secret, c)) === code) return true;
  }
  return false;
}
