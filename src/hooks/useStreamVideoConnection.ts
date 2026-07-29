import { useAuth, useUser } from "@clerk/expo";
import { StreamVideoClient, type User } from "@stream-io/video-react-native-sdk";
import { useEffect, useState } from "react";

import { fetchStreamToken, streamApiKey } from "@/lib/stream";

/**
 * Creates and owns the single Stream Video client for the signed-in Clerk
 * user. Mounted once near the app root (see StreamVideoProvider) — never per
 * screen. The Stream user id always comes from the caller's own Clerk
 * session (verified server-side in /api/stream/token), so this hook only
 * ever connects as the currently signed-in user.
 */
export function useStreamVideoConnection() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      // No reset needed here: initial state is already `undefined`, and the
      // sign-in -> sign-out transition is handled by the previous effect
      // run's own cleanup below (disconnectUser + setClient(undefined)).
      return;
    }

    let cancelled = false;
    let current: StreamVideoClient | undefined;

    (async () => {
      const tokenProvider = () => fetchStreamToken(getToken).then((session) => session.token);
      const token = await tokenProvider();
      if (cancelled) return;

      const streamUser: User = {
        id: user.id,
        name: user.fullName ?? user.username ?? user.id,
        image: user.imageUrl,
      };

      current = StreamVideoClient.getOrCreateInstance({
        apiKey: streamApiKey,
        user: streamUser,
        token,
        tokenProvider,
      });
      setClient(current);
    })().catch((err) => console.error("Failed to connect Stream Video client", err));

    return () => {
      cancelled = true;
      current?.disconnectUser().catch((err) => console.error(err));
      setClient(undefined);
    };
    // Clerk's `useUser()`/`useAuth()` return new `user`/`getToken` references
    // on every internal Clerk resource emit (e.g. its periodic token
    // refresh), not just on real sign-in/sign-out. Depending on those directly
    // would tear down and reconnect the Stream client - and flash this
    // provider's loading screen - on every one of those ticks. `user.id` only
    // changes on an actual identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id]);

  return client;
}
