import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORES = ['votes', 'sessions', 'ratelimit'];

function html(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
     <style>body{font-family:ui-sans-serif,system-ui;background:#0A0A0F;color:#E5E7EB;padding:40px;max-width:560px;margin:auto}
     h1{font-size:20px;margin:0 0 16px}code{background:#1A1A24;padding:2px 6px;border-radius:4px;color:#A78BFA}
     a{color:#06B6D4}</style></head><body>${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const confirm = url.searchParams.get('confirm');

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return html('Yapılandırma eksik', `<h1>ADMIN_TOKEN ayarlanmamış</h1>
      <p>Netlify → Project → Project configuration → Environment variables ekranından <code>ADMIN_TOKEN</code> ekle.</p>`, 500);
  }
  if (!token || token !== expected) {
    return html('Yetkisiz', `<h1>403 — Token geçersiz</h1>`, 403);
  }

  if (confirm !== '1') {
    const resetUrl = `${url.pathname}?token=${encodeURIComponent(token)}&confirm=1`;
    return html('Onay bekleniyor', `<h1>Tüm oy verilerini silmek üzeresin</h1>
      <p>Aşağıdaki tüm store'lardaki her key silinecek:</p>
      <ul><li><code>votes</code> — tüm sayaçlar</li><li><code>sessions</code> — dedup işaretleri</li><li><code>ratelimit</code> — IP limitleri</li></ul>
      <p>Geri alınamaz.</p>
      <p><a href="${resetUrl}"><strong>Onaylıyorum, sıfırla →</strong></a></p>`);
  }

  const summary: Record<string, number> = {};
  for (const name of STORES) {
    const store = getStore({ name, consistency: 'strong' });
    let deleted = 0;
    // list() paginates automatically when using the async iterator
    const { blobs } = await store.list();
    for (const item of blobs) {
      await store.delete(item.key);
      deleted++;
    }
    summary[name] = deleted;
  }

  const rows = Object.entries(summary)
    .map(([k, v]) => `<li><code>${k}</code>: ${v} key silindi</li>`)
    .join('');

  return html('Sıfırlandı', `<h1>✅ Tüm oy verileri sıfırlandı</h1>
    <ul>${rows}</ul>
    <p><a href="/">Ana sayfaya dön</a></p>`);
};

export const config = {
  path: '/.netlify/functions/admin-reset',
};
