# @tap/web

Next.js 16 app: business card pages (`/c/[slug]` + `/c/[slug]/vcard`), the landing page a phone without
the app sees when it taps a sticker (`/t/[tagId]`), a browser sticker writer (`/write`, Web NFC), and the
`.well-known` files that let iOS/Android open sticker links in the app.

```bash
pnpm web            # dev server
pnpm --filter @tap/web build
```

Set `NEXT_PUBLIC_SITE_URL`, `APPLE_TEAM_ID`, and `ANDROID_SHA256_CERT_FINGERPRINT` when deploying.
