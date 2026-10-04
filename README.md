# ParkWise

ParkWise is a Spring Boot parking-management API with a plain HTML/CSS/JavaScript frontend.

## Repository layout

- `backend/` - Spring Boot API, Flyway schema, and PostgreSQL integration
- `frontend/` - active frontend and local reverse proxy
- `frontend-backup-*/` - local backup of the previous frontend; excluded from Git

## Local development

1. Start PostgreSQL:

   ```powershell
   docker compose -f backend/docker-compose.yml up -d
   ```

2. Start the backend:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

3. Start the frontend proxy in another terminal:

   ```powershell
   cd frontend
   python .\proxy_server.py
   ```

4. Open `http://127.0.0.1:3000`.

The backend reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables. Docker Compose uses local trust authentication for development; production deployments must provide a managed database URL and credentials through environment variables. Use `.env.example` as a template and do not commit real credentials.

### Supabase database

Use the Supabase **direct connection** details for Spring Boot. Set the following deployment variables:

```text
DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require&options=-c%20TimeZone%3DUTC
DB_USERNAME=postgres
DB_PASSWORD=<your-supabase-database-password>
```

If using Supabase's transaction pooler instead, use its host and port from the
Supabase Connect dialog and keep `sslmode=require`. Do not commit the database
password or a Supabase service-role key. Flyway runs against the configured
database and creates the schema from `backend/src/main/resources/db/migration`.

### Render deployment

In the Render service environment settings, do not use the placeholder
`YOUR_SUPABASE_HOST`. Copy the complete JDBC connection details from Supabase
**Connect** and set:

```text
DB_URL=jdbc:postgresql://<actual-supabase-host>:<actual-port>/postgres?sslmode=require&options=-c%20TimeZone%3DUTC
DB_USERNAME=<username-from-supabase-connect>
DB_PASSWORD=<database-password>
```

Set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin when the frontend
and backend are hosted separately. Multiple origins can be comma-separated.

For the direct Supabase connection, the host is normally
`db.<project-ref>.supabase.co`, the port is `5432`, and the username is usually
`postgres`. If Render cannot reach the direct host because of IPv6 networking,
use the Supabase **Session pooler** host, port, and username instead. Do not use
the Supabase project URL as the PostgreSQL host.

## Validation

```powershell
cd backend
.\mvnw.cmd -q test
.\mvnw.cmd -q -DskipTests package
```

## Deployment note

The frontend uses same-origin `/api` requests, so production hosting must provide a reverse proxy or route `/api` to the Spring Boot service. GitHub is suitable for source hosting and CI; it does not run the Spring Boot API or PostgreSQL database by itself.
