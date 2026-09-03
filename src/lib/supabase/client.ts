import { createBrowserClient } from "@supabase/ssr";

export type CreateBrowserClientOptions = {
  url: string;
  anonKey: string;
};

export function createClient({ url, anonKey }: CreateBrowserClientOptions) {
  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
