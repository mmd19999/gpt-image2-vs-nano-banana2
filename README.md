# GPT Image 2 vs Nano Banana 2

Körlemesine AI görsel karşılaştırma sitesi. 20 matchup, 2 model, canlı leaderboard — tamamen Netlify (Functions + Blobs) üzerinde çalışır.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS 3** (custom dark theme, gradient accents)
- **Framer Motion** — sayfa ve oy reveal animasyonları
- **React Router v6** — 3 sayfa (/, /oyla, /sonuc)
- **html-to-image** — paylaşılabilir sonuç kartı (PNG)
- **@netlify/blobs + @netlify/functions** — oyların kalıcı saklanması

## Dosya yapısı

```
.
├─ public/
│  ├─ images/
│  │  ├─ matchups/      # 1-gpt.webp, 1-banana.webp, ... 20-*.webp
│  │  └─ references/    # img1.webp ... img6.webp
│  └─ favicon.svg
├─ src/
│  ├─ components/       # Layout, CategoryBadge, ScoreBar, AspectImage
│  ├─ data/matchups.ts  # 20 matchup tanımı (prompt, kategori, referanslar)
│  ├─ lib/
│  │  ├─ api.ts         # /.netlify/functions çağrıları
│  │  └─ session.ts     # localStorage session + dedup + random pozisyon
│  ├─ pages/            # Leaderboard, Vote, Results
│  ├─ types.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
├─ netlify/functions/
│  ├─ vote.ts           # Oy kaydeder (Blobs + session dedup + IP rate limit)
│  └─ leaderboard.ts    # Tüm sayaçları okur
├─ netlify.toml
└─ package.json
```

## Blob şeması

3 ayrı store kullanılır:

- **`votes`** — sayaçlar
  - `totals` → `{ gpt, banana, tie, skip }` (global)
  - `c/<kategori>` → kategori bazında aynı yapı
  - `m/<id>` → matchup bazında aynı yapı
- **`sessions`** — `<sessionId>/<matchupId>` → `{ choice, ts }` (dedup işareti)
- **`ratelimit`** — `<ipHash>` → `{ windowStart, count }` (saatte 25 oy limiti)

Her oy submit'inde:
1. Session marker var mı kontrol edilir (varsa 409 döner)
2. IP hash'le rate limit kontrolü (aşıldıysa 429)
3. Session marker yazılır
4. Matchup + kategori + global sayaçlar atomic olmadan ama hızlıca increment edilir
5. Rate limit sayacı güncellenir

## Yerel geliştirme

```bash
npm install
npm run dev              # Vite (frontend-only, API mock yok)
# VEYA:
npx netlify dev          # Functions + Blobs dahil tam local stack
```

> **Not:** Blobs gerçek anlamda `netlify dev` altında çalışır; sadece `vite dev` kullanırsan API çağrıları network error döner ama UI yine de çalışır (leaderboard "henüz oy yok" gösterir).

## Production build

```bash
npm run build            # dist/ klasörüne çıktı üretir
```

## Deploy

```bash
npm install -g netlify-cli          # yüklü değilse
netlify login                       # Netlify hesabına bağlan
netlify init                        # Siteyi ilk defa kurarken (site oluşturur)
netlify deploy --prod               # Production deploy
```

Netlify Blobs ve Functions otomatik olarak ayağa kalkar — ekstra konfigürasyon gerekmez.

## Kararlar (default'tan sapmalar)

- **5.banana.png** dosyası yanlış isimlendirilmişti (nokta yerine tire olmalıydı); otomatik olarak `5-banana.webp` adıyla yeniden adlandırdım.
- **Matchup 7'nin banana görseli eksik** — UI'da `bananaMissing: true` flag'iyle zarif bir "görsel eksik" plakası gösteriliyor; sol/sağ o slot'a denk düşerse o yöndeki oy butonu devre dışı kalır (kullanıcı yine de "ikisi de iyi" veya "kararsız" seçebilir ya da diğer seçeneği işaretleyebilir).
- **Görseller WebP quality 85, max width 1600px** — toplam 46 dosya ~9.4 MB'a düştü.
- **`--noCheck` build'de** aktif (`tsc -b --noCheck`) — tip kontrolü ayrı `npx tsc --noEmit` ile yapılıyor, build hızlı kalıyor.
- **Rate limit** saatte 25 oy (20 matchup + marj); determined bypass yapılabilir ama normal kullanıcı sayfa yenilemeyle oylayamaz.
- **Oy reveal**: 2.2 saniye sonra otomatik bir sonraki matchup'a geçiş.
- **Klavye kısayolları**: `1`, `2`, `3`, `4`.

## Değiştirilmeyen kurallar

- ✅ Oy verilmeden model ismi gizli
- ✅ Sol/sağ her kullanıcı için rastgele (localStorage'da per-matchup sabit)
- ✅ Sadece Netlify Blobs kullanıldı, harici DB yok
