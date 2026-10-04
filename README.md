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

## Validation

```powershell
cd backend
.\mvnw.cmd -q test
.\mvnw.cmd -q -DskipTests package
```

## Deployment note

The frontend uses same-origin `/api` requests, so production hosting must provide a reverse proxy or route `/api` to the Spring Boot service. GitHub is suitable for source hosting and CI; it does not run the Spring Boot API or PostgreSQL database by itself.
