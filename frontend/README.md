# 🅿️ ParkWise - Animated Smart Parking Frontend

A state-of-the-art, high-aesthetic Animated React Frontend built to integrate seamlessly with the **ParkWise** Spring Boot REST API (`http://localhost:8080`).

---

## ✨ Features & Architecture

1. **Cyber-Emerald / Obsidian Design System**:
   - Modern glassmorphism with dynamic ambient light orbs and smooth CSS transitions.
   - Dark / Light mode toggle.
   - Web Audio API acoustic sound synthesizer for haptic user feedback.

2. **Live Floor Matrix & Interactive Parking Grid**:
   - Real-time slot status visualizer (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `OUT_OF_SERVICE`).
   - EV Fast Charging badges (22kW) with animated pulse glows.
   - Filter by vehicle category (`CAR`, `SUV`, `BIKE`, `VAN`), EV only, and status.

3. **Smart Reservations & Digital Passes**:
   - 1-Click parking slot reservation with dynamic hourly rate calculator.
   - Boarding-pass style printable **Digital E-Pass** with simulated QR gate validation code, timer, and vehicle plate badge.

4. **Facility & Floor Operations**:
   - Customer facility directory with backend-driven facility/floor/slot relationships.
   - Admin workspace actions for facility create/edit/deactivate, floor creation, and slot status updates.
   - Backend endpoints remain the source of truth:
     - `GET /api/facilities`, `POST /api/facilities`, `PUT /api/facilities/{id}`, `DELETE /api/facilities/{id}`
     - `GET /api/floors`, `POST /api/facilities/{facilityId}/floors`, `PUT /api/floors/{id}`, `DELETE /api/floors/{id}`

5. **Slot Operations & Database**:
   - Backend-backed slot status and compatibility management matching:
     - `GET /api/slots`, `POST /api/floors/{floorId}/slots`, `PUT /api/slots/{id}`, `DELETE /api/slots/{id}`
   - Batch slot generation is not currently exposed in the frontend because no backend batch endpoint exists.

6. **User and booking data**:
   - Customer bookings use `GET /api/bookings/user/{userId}`.
   - Admin analytics reads system-wide bookings and users from the backend.
   - User CRUD endpoints exist in the backend but a dedicated user-management screen is not yet exposed.

7. **Backend-backed connectivity**:
   - The frontend uses the same-origin `/api` proxy to call the Spring Boot backend.
   - Facilities, users, slots, bookings, reservation totals, and cancellation results come from the database.
   - Backend or database errors are shown in the UI; the frontend does not silently replace them with fixture data.

---

## 🚀 How to Run

### Local Server
Run with Node:
```powershell
node frontend/server.js
```
or run `frontend/start.bat`. Ensure Spring Boot is running on port `8080`, then open [http://localhost:3000](http://localhost:3000) in your browser.
