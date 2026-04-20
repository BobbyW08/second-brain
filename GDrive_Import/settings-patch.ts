// src/routes/_authenticated/settings.tsx
// Patch — add the Google Drive section below the Google Calendar section.
// Only showing the additions; the rest of the file is unchanged from Ticket 12-A.
//
// 1. Add to imports:
import { DriveImportSection } from '@/components/settings/DriveImportSection'

// 2. Inside the JSX, after the Google Calendar <section>:

/*
  <Separator />

  <DriveImportSection
    userId={user.id}
    googleConnected={!!profile?.google_refresh_token}
  />
*/

// ============================================================
// Also add the Drive scope to the signInWithOAuth call so
// that imported folders can actually be read by the server fn.
// Update the existing Google connect button handler:
// ============================================================

async function handleConnectGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive.readonly',
      ].join(' '),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',   // force refresh token on every connect
      },
    },
  })
}

// ============================================================
// And add two new env vars to .env.local:
// ============================================================

/*
  # Google OAuth client credentials (for server-side token refresh)
  GOOGLE_CLIENT_ID=[your-google-client-id]
  GOOGLE_CLIENT_SECRET=[your-google-client-secret]
*/

// These are the same credentials from your Google Cloud Console project.
// The client ID is already used by Supabase Auth — copy it here too so
// the server-side refresh logic in driveImport.ts can call the token endpoint.
