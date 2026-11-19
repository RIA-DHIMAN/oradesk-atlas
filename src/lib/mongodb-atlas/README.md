# MongoDB Atlas alternative

OraDesk keeps its existing Prisma/MySQL integration. Set `DATABASE_PROVIDER=atlas` to route the app's existing database operations through the separate MongoDB Atlas Prisma client; leave the variable unset or set it to `mysql` to keep using MySQL.

## Configure

1. Create a MongoDB Atlas database user and allow the app host in the Atlas network access list.
2. Set the Atlas URI in the root `.env` for local work, or in the hosting provider's environment settings:

   ```dotenv
   MONGODB_ATLAS_URI="mongodb+srv://<db-user>:<url-encoded-password>@<cluster-host>/<db-name>?retryWrites=true&w=majority"
   ```

   Keep `DATABASE_URL` set as well if you plan to migrate data from MySQL or switch back to it. Do not commit credentials. If migrating existing data, keep the app on MySQL until the migration is complete; set `DATABASE_PROVIDER=atlas` only when ready to switch.
3. Generate both Prisma clients and start the app:

   ```powershell
   npm run prisma:generate
   npm run prisma:generate:atlas
   npm run prisma:push:atlas
   npm run dev
   ```

   `npm run build` and `npm run dev` generate the Atlas client automatically. Run `prisma:push:atlas` once to create the Atlas collections and indexes. Atlas uses MongoDB's `_id` for its internal document key and preserves OraDesk's existing document `collection` and `id` fields.

## Copy existing MySQL data

After setting both database URLs, run these to create Atlas indexes and upsert users, sessions, audit logs, clinical documents, and metadata:

```powershell
npm run prisma:push:atlas
npm run migrate:mysql-to-atlas
```

The migration does not delete or modify MySQL data. Review the counts printed at completion, then set `DATABASE_PROVIDER=atlas` to switch the app. Re-running it updates matching IDs and document keys in Atlas.

## Initialize a fresh Atlas database

Set `SUPER_ADMIN_LOGIN` and `SUPER_ADMIN_PASSWORD`, then run:

```powershell
npm run seed:atlas
```

This creates or updates the Atlas Super Admin and initializes revision metadata and default clinic settings. It does not seed the MySQL database.
Set `DATABASE_PROVIDER=atlas` when ready to use the new Atlas database.
