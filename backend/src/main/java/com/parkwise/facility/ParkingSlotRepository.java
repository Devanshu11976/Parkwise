
package com.parkwise.facility;

import com.parkwise.booking.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface ParkingSlotRepository
        extends JpaRepository<ParkingSlot, UUID> {

    @Query("""
        SELECT s FROM ParkingSlot s
        WHERE s.floor.facility.id = :facilityId
        AND s.vehicleType = :vehicleType
        AND s.status = :slotStatus
        AND NOT EXISTS (
            SELECT b.id FROM Booking b
            WHERE b.slot = s
            AND b.status IN :bookingStatuses
            AND b.startTime < :endTime
            AND b.endTime > :startTime
        )
        """)
    List<ParkingSlot> findAvailableSlots(
            @Param("facilityId") UUID facilityId,
            @Param("vehicleType") ParkingSlot.VehicleType vehicleType,
            @Param("slotStatus") ParkingSlot.SlotStatus slotStatus,
            @Param("bookingStatuses") List<Booking.Status> bookingStatuses,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime
    );

    List<ParkingSlot> findByFloor_Id(UUID floorId);
}
