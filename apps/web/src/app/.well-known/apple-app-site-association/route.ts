import { IOS_BUNDLE_ID } from "@/lib/site";

/**
 * Lets iOS open https://<host>/t/* in the app instead of Safari (universal links).
 * Set APPLE_TEAM_ID in the environment; the app's associatedDomains must list this host.
 */
export function GET() {
  const teamId = process.env.APPLE_TEAM_ID ?? "TEAMID";
  const body = {
    applinks: {
      details: [{ appIDs: [`${teamId}.${IOS_BUNDLE_ID}`], components: [{ "/": "/t/*" }] }],
    },
  };
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
