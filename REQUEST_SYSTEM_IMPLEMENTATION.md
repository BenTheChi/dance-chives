# Request & Approval System Implementation

## Overview

A comprehensive authorization-based request/approval system has been implemented with support for tagging requests, team member requests, global access requests, and authorization level change requests. The system includes notifications, a dashboard interface, and proper authorization checks.

## Database Schema Changes

### New Models Added

1. **TaggingRequest** - Requests to tag users in events/videos
2. **TeamMemberRequest** - Requests to join events as team members
3. **GlobalAccessRequest** - Requests for global access (creators/moderators)
4. **AuthLevelChangeRequest** - Requests to change user authorization levels
5. **TeamMember** - Tracks team memberships for events
6. **RequestApproval** - Records approval/denial actions
7. **Notification** - In-app notifications for users

### New Enum

- **RequestStatus** - PENDING, APPROVED, DENIED, CANCELLED

## Files Created

### Core Implementation

1. **`prisma/schema.prisma`** - Updated with new models
2. **`src/lib/utils/request-utils.ts`** - Utility functions for authorization checks and approver identification
3. **`src/lib/server_actions/request_actions.ts`** - Server actions for all request operations
4. **`src/components/requests/RequestCard.tsx`** - UI components for displaying requests
5. **`src/app/dashboard/page.tsx`** - Comprehensive dashboard page

## Features Implemented

### Request Types

#### 1. Tagging Requests

- **Who can request**: Any user (can only tag themselves)
- **Who can approve**: Event creator, team members, city moderators, admins
- **Location**: Event or video pages
- **Special**: Users can only request to tag themselves in events/videos or with roles. Untagging is immediate and unrestricted.

#### 2. Team Member Requests

- **Who can request**: Any user
- **Who can approve**: Event creator, team members, city moderators, admins
- **Location**: Event edit page
- **Special**: Team members can be removed immediately by creator/team

#### 3. Global Access Requests

- **Who can request**: Creators and moderators only
- **Who can approve**: Admins and super admins only
- **Location**: Dashboard or settings
- **Special**: Admins/super admins have default global access

#### 4. Authorization Level Change Requests

- **Who can request**: Any user (for themselves or others)
- **Who can approve**: Admins and super admins only
- **Location**: Dashboard or settings
- **Special**: Must include mandatory explanation message

### Dashboard Features

- **Welcome message** with user name and authorization level
- **Incoming requests** section showing requests requiring approval
- **Outgoing requests** section showing user's submitted requests
- **Notifications** display with unread count
- **Events created** by the user (for creators and above)
- **Team memberships** showing events where user is a team member
- **Authorization level inheritance** - Higher levels see all lower-level features

### Authorization Levels

- **Base Users (0)**: Can request to tag themselves in events/videos
- **Creators (1)**: Can create events, invite team members via requests
- **Moderators (2)**: Can create/edit/manage events in their city, invite team members
- **Admins (3)**: Global user management, grant/remove global access, change auth levels
- **Super Admins (4)**: All admin rights + can delete users

## Setup Instructions

### 1. Run Database Migration

The schema has been updated. You need to create and apply the migration:

```bash
# Option 1: Interactive mode (recommended for development)
npx prisma migrate dev --name add_request_system

# Option 2: If you're using db push (for quick prototyping)
npx prisma db push
```

**Note**: If you encounter an error about the `Event.eventId` unique constraint, you may need to handle existing duplicate data first.

### 2. Generate Prisma Client

After migration:

```bash
npx prisma generate
```

### 3. Verify Database Schema

Check that all tables were created:

```bash
npx prisma studio
```

## Usage Examples

### Creating a Tagging Request

```typescript
import { createTaggingRequest } from "@/lib/server_actions/request_actions";

await createTaggingRequest(
  eventId, // Event ID from Neo4j
  videoId, // Optional video ID
  role // Optional role/tag type
);
```

**Note**: Users can only tag themselves. The `targetUserId` parameter has been removed - the authenticated user is automatically set as the target.

### Creating a Team Member Request

```typescript
import { createTeamMemberRequest } from "@/lib/server_actions/request_actions";

await createTeamMemberRequest(eventId);
```

### Creating a Global Access Request

```typescript
import { createGlobalAccessRequest } from "@/lib/server_actions/request_actions";

await createGlobalAccessRequest();
```

### Creating an Authorization Level Change Request

```typescript
import { createAuthLevelChangeRequest } from "@/lib/server_actions/request_actions";

await createAuthLevelChangeRequest(
  targetUserId,
  requestedLevel,
  "Reason for change..." // Mandatory message
);
```

## Integration Points

### Event Pages

To integrate tagging requests into event pages, add a button or form that calls `createTaggingRequest`. The approvers will automatically receive notifications.

### Event Edit Pages

To integrate team member requests, add a button/form that calls `createTeamMemberRequest`. Approvers will be notified automatically.

## Key Functions

### Authorization Checks

- `canUserApproveRequest()` - Check if a user can approve a specific request
- `getTaggingRequestApprovers()` - Get list of approvers for tagging requests
- `getTeamMemberRequestApprovers()` - Get list of approvers for team member requests
- `getGlobalAccessRequestApprovers()` - Get list of approvers for global access
- `getAuthLevelChangeRequestApprovers()` - Get list of approvers for auth level changes

### Request Management

- `getIncomingRequests()` - Get all requests user can approve
- `getOutgoingRequests()` - Get all requests user has submitted
- `getDashboardData()` - Get complete dashboard data
- `getNotifications()` - Get user notifications
- `getUnreadNotificationCount()` - Get unread notification count

## Validation

### Frontend Validation

- Request creation forms validate required fields
- Authorization level changes require mandatory message
- Duplicate request prevention

### Backend Validation

- Authorization checks on all operations
- Request status validation
- User existence validation
- Duplicate request prevention
- Level change validation (prevent malicious changes)

## Notifications

Notifications are automatically created for:

- Incoming requests (to approvers)
- Request approvals (to requesters)
- Request denials (to requesters)
- Team member additions
- Global access grants
- Authorization level changes

## Direct Actions (No Request Needed)

Users with appropriate authorization levels can perform actions directly without submitting requests:

- **Approvers**: Can tag users directly if they have permission
- **Creators**: Can add team members directly
- **Moderators**: Can manage events in their cities directly
- **Admins**: Can perform all actions directly

## Next Steps

1. **Run the migration** (see Setup Instructions above)
2. **Integrate tagging requests** into event/video pages
3. **Integrate team member requests** into event edit pages
4. **Add request forms** for global access and auth level changes (if needed)
5. **Test the workflow** with different authorization levels

## Notes

- Event data is stored in Neo4j, but request data is in PostgreSQL
- The `eventId` in requests references Neo4j event IDs
- Team memberships are tracked in PostgreSQL for quick queries
- Notifications are real-time and appear on the dashboard
- All request operations include proper error handling and user feedback

## Future Enhancements

- Real-time notifications using WebSockets or Server-Sent Events
- Email notifications for important requests
- Request history and audit logs
- Bulk approval/denial actions
- Request templates for common scenarios
