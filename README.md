# Genç Teknoloji

Turkcell dijital satış noktası web sitesi ve ERP dashboard (Next.js static export, GitHub Pages).

## Kurulum

```bash
cp .env.example .env
npm install
npm run dev
```

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Production deploy için GitHub Actions secrets olarak tanımlayın.

## Komutlar

```bash
npm run dev      # geliştirme
npm run build    # static export → out/
npm run lint     # eslint
npm run clean    # build cache temizliği
```
