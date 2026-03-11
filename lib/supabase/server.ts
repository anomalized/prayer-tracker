import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // if the environment variables are missing (e.g. during a build on Vercel
  // before the vars are configured), return a harmless stub so pages can
  // prerender without crashing. real functionality will only work once the
  // variables are provided in production.
  if (!supabaseUrl || !supabaseAnonKey) {
    const noop = async () => ({ data: null, error: null });
    return {
      auth: { getUser: noop, getSession: noop },
      from: () => ({ select: noop, insert: noop, update: noop, delete: noop }),
      // add any additional methods your code might call, all no‑ops
    } as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}