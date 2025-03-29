### Configure supabase

1. Setup account , then create project

2. Go to the SQL Editor and migrate these sql's file
Migrate users with next_auth schema


- 2.1
[Copy and Run Schema](https://github.com/nextauthjs/next-auth/blob/e17fc74b61dc23b26bdfe2112c7d7fdb04858dd5/packages/adapter-supabase/supabase/migrations/20221108044627_create_public_users_table.sql)

- 2.2
[Copy and Run](https://github.com/nextauthjs/next-auth/blob/e17fc74b61dc23b26bdfe2112c7d7fdb04858dd5/packages/adapter-supabase/supabase/migrations/20221108043803_create_next_auth_schema.sql)


3. Go to Project Setting ,under **Configuration** tab Click on **Data API** then find  **Data API Settings** 
- 3.1 Enable Data API 
- 3.2 Add `next_auth` schema to the  **Exposed schemas**

4. Copy the Credentails to .env.local as it mentioned in .env.example
   **URL** to  **SUPABASE_URL**
   **service_role** `secret` to **SUPABASE_SERVICE_ROLE_KEY**


   