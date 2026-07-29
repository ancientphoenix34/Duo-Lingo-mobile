import { getStreamServerClient, requireClerkUserId, streamApiKey } from "@/lib/stream-server";

// Mints a short-lived Stream Video user token for the calling Clerk user.
// Wired as the client's `tokenProvider` — called once on connect and again
// whenever the token nears expiry.
export async function GET(request: Request) {
  const userId = await requireClerkUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const streamClient = getStreamServerClient();
  const token = streamClient.generateUserToken({
    user_id: userId,
    validity_in_seconds: 60 * 60 * 4,
  });

  return Response.json({ apiKey: streamApiKey, token, userId });
}
