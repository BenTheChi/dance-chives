# Neo4j ↔ PostgreSQL Integration Analysis

## ✅ **Present Integrations**

### 1. **User Management**

- ✅ **User Creation**: When users sign up via OAuth, they are created in both databases:
  - PostgreSQL: Created by NextAuth with `id`, `email`, `name`
  - Neo4j: Created via `signupUser()` with `displayName`, `username`, `city`, `date`
  - **Link**: Same `id` used in both databases
- ✅ **User Updates**: Profile updates sync to Neo4j via `updateUser()`
- ✅ **User Queries**: `getUser()` fetches from Neo4j, PostgreSQL used for auth/authorization

### 2. **City Management**

- ✅ **City Storage**: Cities stored in both databases:
  - Neo4j: Full city data (`id`, `name`, `countryCode`, `region`, `population`, `timezone`)
  - PostgreSQL: User-city assignments (`City` model with `cityId` and `userId`)
- ✅ **City Linking**: User cities managed in PostgreSQL via `City` model
- ✅ **Cross-Database**: `getEventCityId()` reads from Neo4j, used to find city moderators in PostgreSQL

### 3. **Request System (New)**

- ✅ **Tagging Requests**: Validates event/video existence in Neo4j before creating PostgreSQL requests
- ✅ **Team Member Requests**: Validates event existence and team membership in Neo4j
- ✅ **Approval Flow**: Reads from Neo4j (event creator, team members) and PostgreSQL (city moderators, admins)
- ✅ **Action Execution**: Applies tags and team memberships in Neo4j when approved

### 4. **Authorization**

- ✅ **Auth Levels**: Stored in PostgreSQL (`User.auth`)
- ✅ **Global Access**: Stored in PostgreSQL (`User.allCityAccess`)
- ✅ **Cross-Database Checks**: Authorization utilities read from both databases

---

## ❌ **Missing Integrations**

### 1. **Event Creation → PostgreSQL Link** ⚠️ **CRITICAL**

**Problem**: When events are created in Neo4j via `insertEvent()`, no corresponding PostgreSQL `Event` record is created.

**Impact**:

- Dashboard shows empty "Your Events" section (line 1314 in `request_actions.ts`)
- Cannot query events by creator from PostgreSQL
- PostgreSQL `Event` table exists but is never populated

**Current Code** (`src/lib/server_actions/event_actions.ts`):

```typescript
// Event created in Neo4j only
const result = await insertEvent(event);
// ❌ No PostgreSQL Event record created
```

**PostgreSQL Event Model** (`prisma/schema.prisma`):

```prisma
model Event {
  id      String  @id @default(cuid())
  eventId String  @unique  // Should be Neo4j event ID
  userId  String            // Creator's user ID
  creator Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Required Fix**: Add PostgreSQL Event record creation in `addEvent()`:

```typescript
// After insertEvent() succeeds:
await prisma.event.create({
  data: {
    eventId: event.id, // Neo4j event ID
    userId: session.user.id,
    creator: true,
  },
});
```

**Also Needed**: Update `editEvent()` to handle PostgreSQL Event updates if event ID changes.

---

## 🔍 **Integration Points Summary**

### **Neo4j → PostgreSQL (Reading from Neo4j)**

1. ✅ `getEventCreator()` - Gets creator ID from Neo4j → validates in Postgres
2. ✅ `getEventTeamMembers()` - Gets team member IDs from Neo4j → validates in Postgres
3. ✅ `getEventCityId()` - Gets city ID from Neo4j → finds city moderators in Postgres
4. ✅ `getUser()` - Gets user profile from Neo4j
5. ✅ `getUserTeamMemberships()` - Gets team memberships from Neo4j → displays in dashboard
6. ✅ `eventExists()` - Validates event exists in Neo4j
7. ✅ `videoExistsInEvent()` - Validates video exists in Neo4j

### **PostgreSQL → Neo4j (Writing to Neo4j)**

1. ✅ `signupUser()` - Creates user profile in Neo4j during signup
2. ✅ `setEventRoles()` - Sets event roles in Neo4j when request approved
3. ✅ `addTeamMember()` - Creates TEAM_MEMBER relationship in Neo4j when approved
4. ✅ `insertEvent()` - Creates event in Neo4j (but missing Postgres link)

### **PostgreSQL → PostgreSQL (Internal)**

1. ✅ User auth levels and global access management
2. ✅ Request/approval/notification system
3. ✅ City assignments for users
4. ✅ Invitation system

### **Neo4j → Neo4j (Internal)**

1. ✅ Event relationships (CREATED, TEAM_MEMBER, roles)
2. ✅ Video tagging (IN relationship)
3. ✅ Event structure (sections, brackets, videos, pictures)

---

## 📋 **Recommended Fixes**

### **Priority 1: Critical**

1. **Add PostgreSQL Event record creation** in `addEvent()` and `editEvent()`
   - Location: `src/lib/server_actions/event_actions.ts`
   - Create PostgreSQL Event record after successful Neo4j creation
   - Update PostgreSQL Event record when event is edited

### **Priority 2: Important**

2. **Add validation for user existence** in Neo4j before creating event

   - Ensure creator exists in Neo4j (they should, but good to validate)
   - Location: `src/lib/server_actions/event_actions.ts` → `addEvent()`

3. **Handle event deletion** - Delete PostgreSQL Event record when Neo4j event is deleted
   - Location: `src/db/queries/event.ts` → `deleteEvent()`

### **Priority 3: Nice to Have**

4. **Add sync validation** - Periodic check that PostgreSQL Event records match Neo4j events
5. **Add error handling** - If Neo4j creation succeeds but PostgreSQL fails, rollback or retry

---

## 🔗 **Common Identifier Pattern**

The app uses **user IDs** as the common identifier between databases:

- **PostgreSQL**: `User.id` (CUID, created by NextAuth)
- **Neo4j**: `User.id` (same value, stored as string property)

**Event IDs** are also used as references:

- **Neo4j**: `Event.id` (slug-based, generated from title)
- **PostgreSQL**: `Event.eventId` (should store Neo4j event ID)

**City IDs** are stored as strings in both databases:

- **Neo4j**: `City.id` (numeric ID from GeoDB API)
- **PostgreSQL**: `City.cityId` (same value, stored as string)

---

## ✅ **Conclusion**

**Present**: Most integrations are in place, especially for the new request system. User and city management work correctly.

**Missing**: The critical missing link is PostgreSQL Event record creation when events are created in Neo4j. This prevents the dashboard from showing user-created events and breaks queries that rely on PostgreSQL Event records.
