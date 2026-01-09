# Instagram OAuth Setup Guide

## Error: "Invalid Request: Request parameters are invalid: Invalid platform app"

This error occurs when your Instagram app in Meta Developer Console is not properly configured.

## Required Environment Variables

Make sure these are set in your `.env` file:

```env
AUTH_INSTAGRAM_ID=your_instagram_app_id
AUTH_INSTAGRAM_SECRET=your_instagram_app_secret
NEXTAUTH_URL=http://localhost:3000  # For local dev, or your production URL
```

## Meta Developer Console Configuration Steps

### 1. Add Website Platform

1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Select your Instagram app
3. Go to **Settings** → **Basic**
4. Scroll down to **Platform** section**
5. Click **Add Platform** → Select **Website**
6. Enter your **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 2. Configure OAuth Redirect URIs

1. In your app settings, go to **Products** → **Instagram Basic Display** (or **Instagram Graph API**)
2. Find **Valid OAuth Redirect URIs** section
3. Add these URIs:
   - `http://localhost:3000/api/auth/callback/instagram` (for local dev)
   - `https://yourdomain.com/api/auth/callback/instagram` (for production)

### 3. Verify App Settings

- **App Mode**: Should be in **Development** mode for testing
  - ✅ **You do NOT need to publish the app for development**
  - In Development mode, only **Instagram Testers** can authenticate
  - Add test users in: **Roles** → **Instagram Testers** → **Add Instagram Testers**
- **Instagram Basic Display** or **Instagram Graph API**: Should be added as a product
- **Client OAuth Login**: Should be enabled
- **Web OAuth Login**: Should be enabled

## NextAuth Redirect URI Format

NextAuth v5 automatically constructs the callback URL as:
```
{NEXTAUTH_URL}/api/auth/callback/instagram
```

So if `NEXTAUTH_URL=http://localhost:3000`, the callback will be:
```
http://localhost:3000/api/auth/callback/instagram
```

## Testing

After making these changes:
1. Save your app settings in Meta Developer Console
2. Wait a few minutes for changes to propagate
3. Restart your Next.js dev server
4. Try signing in with Instagram again

## Development Mode vs Live Mode

### Development Mode (No Publishing Required)
- ✅ **You can use Instagram OAuth without publishing your app**
- ✅ Works for local development and testing
- ⚠️ **Limitation**: Only users added as "Instagram Testers" can authenticate
- To add test users:
  1. Go to **Roles** → **Instagram Testers**
  2. Click **Add Instagram Testers**
  3. Enter Instagram usernames or user IDs
  4. Test users must accept the invitation

### Live Mode (For Production)
- Required for production use with all users
- May require app review depending on permissions
- All users can authenticate (no tester restrictions)

## Common Issues

- **"Invalid platform app"**: Website platform not added or redirect URI not configured
- **"Invalid redirect URI"**: The redirect URI in your app settings doesn't match what NextAuth is using
- **"User not authorized"**: User is not added as an Instagram Tester (Development mode only)
- **"App not in development mode"**: Make sure your app is in Development mode for testing

## Production Checklist

Before going to production:
- [ ] App is in **Live** mode (requires app review/submission)
- [ ] Website platform is added with production URL
- [ ] OAuth redirect URI includes production domain
- [ ] `NEXTAUTH_URL` environment variable is set to production URL
- [ ] All environment variables are set in your hosting platform (Vercel, etc.)
- [ ] App has been reviewed and approved by Meta (if required for your permissions)

## Quick Answer: Do I Need to Publish?

**For Development**: ❌ **No, you do NOT need to publish**
- Keep app in Development mode
- Add yourself and test users as "Instagram Testers"
- Works immediately after configuration

**For Production**: ✅ **Yes, you need to switch to Live mode**
- Requires app review (depending on permissions)
- All users can authenticate
- May take several days for review approval

