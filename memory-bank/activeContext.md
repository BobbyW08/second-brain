# Active Context — Second Brain

## Current Ticket

**Ticket 1-A: Invite-only signup gate** — IN PROGRESS

## Last Completed Ticket

**Ticket 0-C: Configure Google OAuth scopes**
- Added Google sign-in button to login page with calendar scope, offline access, consent prompt
- Created /auth/callback route: exchanges OAuth code, saves provider_refresh_token to profiles
- routeTree.gen.ts updated (will auto-regenerate on next dev server start)
- Template saved to coding_templates/supabase/google-token-storage.ts

## Next 3 Tickets Queued

1. **Ticket 1-A: Invite-only signup gate**
2. **Ticket 1-B: App shell layout**
3. **Ticket 1-C: User settings page**
   - Add calendar scope in Supabase dashboard
   - Add offline access + prompt consent to signInWithOAuth
   - Extract provider_refresh_token in auth callback → save to profiles
   - Test full Google OAuth flow

3. **Ticket 1-A: Invite-only signup gate**
   - shouldCreateUser: false on OAuth
   - /admin/invite page (admin email check only)
   - generateLink invite flow
   - Test: non-invited email blocked

## Session Instructions for Cline

At the start of every Cline session, read this file and techContext.md first. Then ask Claude Code (terminal) to break the current ticket into atomic sub-tasks before writing any code.

At the end of every session, ask Claude Code to update this file with the new active ticket.
