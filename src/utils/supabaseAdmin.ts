import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Server-only Supabase client using the service role key.
 * Bypasses Row Level Security — use ONLY in createServerFn handlers.
 * Never import this in client-side components or browser-executed code.
 *
 * Required because TanStack Start server functions run on Nitro without a
 * user JWT attached to the request, so the anon-key client has auth.uid() = null
 * and RLS blocks all user-specific reads/writes.
 */
export const supabaseAdmin = createClient<Database>(
	// VITE_SUPABASE_URL is inlined by Vite for both client and server bundles.
	import.meta.env.VITE_SUPABASE_URL || "http://localhost",
	// SUPABASE_SERVICE_ROLE_KEY has no VITE_ prefix — available at Node runtime only.
	process.env.SUPABASE_SERVICE_ROLE_KEY || "",
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);
