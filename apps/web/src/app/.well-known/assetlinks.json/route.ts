import { ANDROID_PACKAGE } from "@/lib/site";

/**
 * Lets Android open https://<host>/t/* in the app without the chooser (verified app links).
 * Set ANDROID_SHA256_CERT_FINGERPRINT to the signing certificate fingerprint.
 */
export function GET() {
  const fingerprint =
    process.env.ANDROID_SHA256_CERT_FINGERPRINT ??
    "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00";
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
