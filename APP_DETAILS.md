# Memory Space — Full Application Details

## 1. Product overview

Memory Space is a shared-memory web application intended to help people preserve moments, share experiences within spaces, plan future activities, and revisit memories through organized views and collections.

The application is built as a web app. The exact functionality a user can access depends on their authentication state, membership in a space, database policies, configured environment variables, and the status of connected integrations.

## 2. Technology stack

- **Framework:** Next.js App Router
- **UI:** React and TypeScript
- **Styling:** Tailwind CSS
- **Backend services:** Supabase
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **Media storage:** Supabase Storage
- **External integration:** Google Drive-related API routes are present
- **Development tools:** Node.js, npm, TypeScript, ESLint

The project has successfully completed a production build with Next.js 16.4.1 in the current development environment.

## 3. Main application areas

### Home and spaces
The dashboard provides the main entry point. My spaces is intended for organizing memories and activities into separate shared spaces. Membership and role checks control access to space content.

### Memories and Timeline
Memories store written moments and related details. Timeline provides a chronological way to revisit content.

### Albums and media
Albums organize photo memories. Media attachments are associated with memories and spaces. Signed URLs are used for private media access where implemented.

### Memory Jar
Memory Jar stores messages or notes for later revisiting. Available opening-date behavior depends on the configured record and UI options.

### Voice Memories
Voice Memories supports audio-related memory features in the application. Audio has different storage needs from text and photos, so storage limits and policies should be reviewed when deploying.

### Calendar and planning
Calendar supports dated events such as birthdays, anniversaries, meetings, celebrations, and other events. Future plans helps organize activities intended for the future.

### Daily Prompts
Daily Prompts presents questions intended to encourage reflection and sharing.

### Time Capsules
Time Capsules are designed for saving content to revisit in the future, subject to the available opening-date behavior.

### Yearbook and Scrapbook
These areas help users revisit and organize saved memories. Confirm the current export options in the app before promising a particular output format or media type.

### Memory Map
Memory Map uses location details associated with memories when those details are available. Location access and map rendering depend on the relevant UI and configuration.

### Gratitude Jar and Group Polls
Gratitude Jar is for appreciation messages. Group Polls allows members to create polls and vote according to the configured permissions.

### Storage
The Storage area provides storage-related information. The actual limits and external storage behavior should be verified against the deployed configuration and current UI.

### Help & About
Help & About contains a searchable Help & Guide, quick FAQs, a welcome tutorial that can be replayed, and a Contact support card.

## 4. Authentication, spaces, and access control

The project uses Supabase authentication. Space membership and roles are represented in database structures such as:

- `spaces`
- `space_members`
- `memories`
- `memory_media`

The membership role model includes owner, admin, and member roles. Database helper functions and Row Level Security policies are used to enforce access where configured.

Invitation links should only be shared with intended participants. Verify every RLS policy before deployment, especially policies for space membership, invitations, media, and user-generated content.

## 5. Database objects known to the project

The project has used the following database objects in development:

- `spaces`
- `space_members`
- `memories`
- `memory_media`
- `calendar_events`
- `memory_jar`
- `profiles`
- Invitation-related RPC functions such as `create_space_invitation`, `accept_space_invitation`, and `revoke_space_invitation`
- Membership helper functions such as `is_space_member` and `is_space_admin_or_owner`

This list is based on the project’s development history and is not a substitute for inspecting the current Supabase schema and migrations.

## 6. Media and storage notes

Previously checked development bucket configuration included:

- `memory-media`: private; 10 MiB file-size limit; JPEG, PNG, and WebP allowed
- `voice-memories`: private; 25 MiB file-size limit

Confirm the live Supabase configuration before relying on these values. Bucket names, file limits, MIME restrictions, and storage policies must agree with the code.

The application has explored Google Drive as an optional way to handle larger media collections. Google Drive-related API routes exist, but a route being present does not guarantee that OAuth, uploads, downloads, cleanup, or folder browsing are ready for production. Test each flow with valid credentials before enabling it for users.

## 7. API routes

Google Drive-related routes present in the current build include routes for:

- OAuth initiation/callback
- Folder operations
- Upload and download tests
- Voice upload, retrieval, and cleanup

A storage-usage API route is also present. Consult the route source files for the actual request parameters, authorization checks, and response schemas. Test endpoints should not be treated as production APIs without review.

## 8. Profile and user experience

The app has profile-related UI and profile data fields such as display name, nickname, bio, and avatar URL. The current UI should be tested to confirm that the profile form, avatar storage, and header/dropdown display all work together correctly.

The welcome tutorial is intended to appear for a user who has not completed it. Completion is remembered in browser local storage using a key associated with the signed-in user. Clearing browser storage may cause the tutorial to appear again on that browser.

## 9. Help and support

Support email: **dangerofficial6578@gmail.com**

The app provides an email link with the subject prefilled as “Memory Space Support.” Selecting the link opens the user’s configured email application; it does not send an email automatically.

## 10. Local development

From the project directory:

```powershell
npm install
npm run dev
```

Open the local URL printed by Next.js, commonly `http://localhost:3000`.

To verify a production build:

```powershell
npm run build
```

To run the production server after building:

```powershell
npm run start
```

## 11. Configuration and deployment checklist

Before deploying:

1. Configure Supabase URL and client key in environment variables.
2. Configure authentication redirect URLs for the deployment domain.
3. Review SQL migrations and enable the required RLS policies.
4. Confirm that storage buckets are private where intended.
5. Check bucket names, MIME types, file-size limits, and signed-URL expiration.
6. Configure Google OAuth secrets and callback URLs only if using Drive features.
7. Ensure secrets and `.env.local` are not committed to Git.
8. Test signup, login, logout, invitation acceptance, space membership, and access boundaries.
9. Test media upload, preview, playback, and deletion.
10. Test Help & About, the tutorial, and support email links.
11. Run `npm run build`.
12. Test the deployed app with non-owner and non-admin accounts before inviting real users.

## 12. Privacy and reliability considerations

- Use least-privilege access for space membership and database operations.
- Keep private storage buckets private.
- Do not expose service-role keys or OAuth tokens to browser code.
- Validate user input and uploaded file types/sizes on the server as well as in the UI.
- Handle failed uploads and partial deletion carefully.
- Explain storage limits to users before they upload large collections.
- Keep a tested backup and recovery plan for important user data.

## 13. Scope and limitations

This document describes the application based on the current project structure and known development history. It does not claim that every integration or every menu item is production-ready. For definitive behavior, inspect the current source code, database migrations, Supabase settings, environment variables, and deployment configuration.