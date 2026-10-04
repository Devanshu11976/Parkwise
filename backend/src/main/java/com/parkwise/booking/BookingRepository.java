package com.parkwise.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUser_Id(UUID userId);

    List<Booking> findBySlot_Id(UUID slotId);

    boolean existsBySlot_IdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID slotId,
            List<Booking.Status> statuses,
            OffsetDateTime requestedEnd,
            OffsetDateTime requestedStart
    );

    List<Booking> findByStatus(Booking.Status status);

    List<Booking> findByStatusIn(List<Booking.Status> statuses);
}