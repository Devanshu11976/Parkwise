
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Users
CREATE TABLE app_users (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           full_name VARCHAR(100) NOT NULL,
                           email VARCHAR(255) NOT NULL UNIQUE,
                           password_hash VARCHAR(255) NOT NULL,
                           role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'
                               CHECK (role IN ('CUSTOMER', 'ADMIN')),
                           created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parking facilities
CREATE TABLE facilities (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            name VARCHAR(150) NOT NULL,
                            address TEXT NOT NULL,
                            city VARCHAR(100) NOT NULL,
                            timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
                            is_active BOOLEAN NOT NULL DEFAULT TRUE,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Floors within each facility
CREATE TABLE floors (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        facility_id UUID NOT NULL REFERENCES facilities(id),
                        floor_number INTEGER NOT NULL,
                        name VARCHAR(100),
                        UNIQUE (facility_id, floor_number)
);

-- Individual parking slots
CREATE TABLE parking_slots (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               floor_id UUID NOT NULL REFERENCES floors(id),
                               slot_number VARCHAR(20) NOT NULL,
                               vehicle_type VARCHAR(20) NOT NULL
                                   CHECK (vehicle_type IN ('CAR', 'BIKE', 'SUV', 'VAN')),
                               has_ev_charger BOOLEAN NOT NULL DEFAULT FALSE,
                               status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
                                   CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE')),
                               UNIQUE (floor_id, slot_number)
);

-- Reservations
CREATE TABLE bookings (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          user_id UUID NOT NULL REFERENCES app_users(id),
                          slot_id UUID NOT NULL REFERENCES parking_slots(id),
                          vehicle_number VARCHAR(20) NOT NULL,
                          vehicle_type VARCHAR(20) NOT NULL,
                          start_time TIMESTAMPTZ NOT NULL,
                          end_time TIMESTAMPTZ NOT NULL,
                          total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
                          status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
                              CHECK (status IN (
                                                'CONFIRMED', 'ACTIVE', 'CANCELLED',
                                                'COMPLETED', 'EXPIRED'
                                  )),
                          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          CHECK (end_time > start_time)
);

-- Prevent overlapping confirmed or active bookings
-- for the same parking slot.
ALTER TABLE bookings
    ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (
    slot_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'ACTIVE'));

-- Indexes for common queries
CREATE INDEX idx_floors_facility
    ON floors(facility_id);

CREATE INDEX idx_slots_floor
    ON parking_slots(floor_id);

CREATE INDEX idx_bookings_user
    ON bookings(user_id);

CREATE INDEX idx_bookings_slot_time
    ON bookings(slot_id, start_time, end_time);
