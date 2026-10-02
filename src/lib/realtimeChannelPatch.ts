import { supabase } from "@/integrations/supabase/client";

/**
 * Root fix for "cannot add `postgres_changes` callbacks ... after `subscribe()`".
 * supabase.channel(name) returns the SAME channel instance when a channel with that
 * topic already exists (e.g. a component mounted twice, StrictMode, fast remounts).
 * Calling .on() on that already-subscribed channel throws and crashes the page.
 * We give every channel a unique topic suffix so each subscriber gets its own instance.
 * This app only uses postgres_changes listeners, so unique topics are safe.
 */
const PATCH_FLAG = "__ashUniqueChannelPatched";
const client = supabase as unknown as Record<string, unknown> & {
  channel: (name: string, opts?: unknown) => unknown;
};

if (!client[PATCH_FLAG]) {
  const original = client.channel.bind(supabase);
  let counter = 0;
  client.channel = (name: string, opts?: unknown) => {
    counter += 1;
    const unique = `${name}::${Date.now().toString(36)}-${counter}`;
    return original(unique, opts as never);
  };
  client[PATCH_FLAG] = true;
}

export {};
