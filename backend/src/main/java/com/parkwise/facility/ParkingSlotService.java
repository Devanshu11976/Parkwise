
package com.parkwise.facility;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

import org.springframework.transaction.annotation.Transactional;
import com.parkwise.booking.BookingRepository;

import java.util.List;
import java.util.UUID;
import com.parkwise.booking.Booking;
import java.time.OffsetDateTime;

@Service
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final FloorRepository floorRepository;
    private final BookingRepository bookingRepository;

    public ParkingSlotService(
            ParkingSlotRepository parkingSlotRepository,
            FloorRepository floorRepository,
            BookingRepository bookingRepository) {
        this.parkingSlotRepository = parkingSlotRepository;
        this.floorRepository = floorRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<ParkingSlot> getAllSlots() {
        return parkingSlotRepository.findAll();
    }

    public ParkingSlot createSlot(UUID floorId, ParkingSlot slot) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Floor not found"));

        slot.setFloor(floor);
        return parkingSlotRepository.save(slot);
    }

    public ParkingSlot getSlotById(UUID id) {
        return parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Parking slot not found"));
    }

    public ParkingSlot updateSlot(UUID id, ParkingSlot updatedSlot) {
        ParkingSlot slot = getSlotById(id);

        slot.setSlotNumber(updatedSlot.getSlotNumber());
        slot.setVehicleType(updatedSlot.getVehicleType());
        slot.setHasEvCharger(updatedSlot.isHasEvCharger());
        slot.setStatus(updatedSlot.getStatus());

        return parkingSlotRepository.save(slot);
    }

    @Transactional
    public void deleteSlot(UUID id) {
        ParkingSlot slot = getSlotById(id);
        List<Booking> bookings = bookingRepository.findBySlot_Id(id);
        if (bookings != null && !bookings.isEmpty()) {
            bookingRepository.deleteAll(bookings);
            bookingRepository.flush();
        }
        parkingSlotRepository.delete(slot);
        parkingSlotRepository.flush();
    }

    public List<ParkingSlot> findAvailableSlots(
            UUID facilityId,
            ParkingSlot.VehicleType vehicleType,
            OffsetDateTime startTime,
            OffsetDateTime endTime) {

        if (facilityId == null || vehicleType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Facility ID and vehicle type are required"
            );
        }

        if (startTime == null || endTime == null ||
                !endTime.isAfter(startTime)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid booking time range"
            );
        }

        if (startTime.isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start time cannot be in the past"
            );
        }

        return parkingSlotRepository.findAvailableSlots(
                facilityId,
                vehicleType,
                ParkingSlot.SlotStatus.AVAILABLE,
                List.of(
                        Booking.Status.CONFIRMED,
                        Booking.Status.ACTIVE
                ),
                startTime,
                endTime
        );
    }

}
