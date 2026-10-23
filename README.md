# Memory Space

Memory Space is a shared-memory web application for saving moments, organizing memories, planning activities, and revisiting meaningful experiences together.

## Main features

- Authentication and private shared spaces
- Space memberships and invitation links
- Memories and timeline
- Photo albums and media attachments
- Memory Jar and Voice Memories
- Calendar, future plans, and daily prompts
- Time Capsules
- Yearbook and Scrapbook
- Memory Map
- Gratitude Jar and Group Polls
- Storage information and Google Drive-related integration routes
- Searchable Help & Guide and first-time tutorial
- Contact support: dangerofficial6578@gmail.com

Features and actions available to a user depend on the current app configuration, permissions, and connected services.

## Technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase authentication, database, and storage
- Node.js and npm

## Requirements

Install a compatible Node.js version and npm. This project has been developed with Node.js 24 and npm 11.

## Run locally

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create or update `.env.local` with the Supabase project URL and public/anonymous client key required by the app.

3. Start the development server:

   ```powershell
   npm run dev
   ```

4. Open the local URL printed in the terminal, usually `http://localhost:3000`.

## Production build

```powershell
npm run build
npm run start
```

## Useful scripts

- `npm run dev` — start the development server
- `npm run build` — compile and type-check the production build
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Supabase setup

The app uses Supabase for authentication and application data. Review the SQL migrations and policies in the repository before setting up a new Supabase project. Configure authentication redirect URLs for the local and deployed application URLs.

Storage buckets and policies must match the bucket names, access patterns, and file restrictions used by the code. Do not make private media buckets public just to bypass access errors.

## Environment variables and security

- Keep `.env.local` on your machine.
- Never commit service-role keys, OAuth client secrets, access tokens, or refresh tokens.
- Use server-side environment variables for privileged operations.
- Review Row Level Security (RLS) policies before deployment.
- Treat invitation URLs and OAuth credentials as sensitive.
- Check `.gitignore` before committing project files.

## Google Drive

Google Drive-related API routes are present in the project. Their availability depends on OAuth credentials, callback configuration, permissions, and the implementation state of each route. Configure and test the integration before relying on it in production.

## Support

For help with Memory Space, email [dangerofficial6578@gmail.com](mailto:dangerofficial6578@gmail.com?subject=Memory%20Space%20Support).

## Project documentation

See [APP_DETAILS.md](./APP_DETAILS.md) for the fuller feature inventory, architecture notes, storage details, and deployment checklist.