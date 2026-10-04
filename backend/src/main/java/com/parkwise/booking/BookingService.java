package com.parkwise.booking;

import com.parkwise.booking.dto.BookingRequest;
import com.parkwise.user.User;
import com.parkwise.user.UserRepository;
import com.parkwise.facility.ParkingSlot;
import com.parkwise.facility.ParkingSlotRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;


import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    // Constructor
    public BookingService(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            ParkingSlotRepository parkingSlotRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.parkingSlotRepository = parkingSlotRepository;
    }

    /**
     * Periodically runs every 5 seconds to automatically transition booking statuses:
     * - CONFIRMED -> ACTIVE when registered start time is reached.
     * - ACTIVE -> COMPLETED when registered end time is reached.
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void processBookingStatusTransitions() {
        OffsetDateTime now = OffsetDateTime.now();

        // 1. Check CONFIRMED bookings whose start time has arrived
        List<Booking> confirmedList = bookingRepository.findByStatus(Booking.Status.CONFIRMED);
        for (Booking b : confirmedList) {
            if (!b.getStartTime().isAfter(now)) {
                if (b.getEndTime().isAfter(now)) {
                    b.setStatus(Booking.Status.ACTIVE);
                } else {
                    b.setStatus(Booking.Status.COMPLETED);
                }
                bookingRepository.save(b);
            }
        }

        // 2. Check ACTIVE bookings whose end time has passed
        List<Booking> activeList = bookingRepository.findByStatus(Booking.Status.ACTIVE);
        for (Booking b : activeList) {
            if (!b.getEndTime().isAfter(now)) {
                b.setStatus(Booking.Status.COMPLETED);
                bookingRepository.save(b);
            }
        }
    }

    // Get all bookings
    public List<Booking> getAllBookings() {
        processBookingStatusTransitions();
        return bookingRepository.findAll();
    }

    // Get booking by ID
    public Booking getBookingById(UUID id) {
        processBookingStatusTransitions();
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Booking not found"
                ));
    }
    // Get bookings by user ID
    public List<Booking> getBookingsByUser(UUID userId) {
        processBookingStatusTransitions();
        return bookingRepository.findByUser_Id(userId);
    }

    // Get bookings by parking slot ID
    public List<Booking> getBookingsBySlot(UUID slotId) {
        processBookingStatusTransitions();
        return bookingRepository.findBySlot_Id(slotId);
    }

    // Create a booking

    public Booking createBooking(BookingRequest request) {

        // Validate user and slot IDs
        if (request.userId() == null || request.slotId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User ID and parking slot ID are required"
            );
        }

        // Validate booking time
        if (request.startTime() == null ||
                request.endTime() == null ||
                !request.endTime().isAfter(request.startTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End time must be after start time"
            );
        }
        //Prevent Bookings in the Past
        if (request.startTime().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking start time cannot be in the past"
            );
        }

        // Validate vehicle number
        if (request.vehicleNumber() == null ||
                request.vehicleNumber().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vehicle number is required"
            );
        }

        // Validate vehicle type
        if (request.vehicleType() == null ||
                request.vehicleType().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vehicle type is required"
            );
        }

        String vehicleType = request.vehicleType().trim().toUpperCase();

        if (!List.of("CAR", "BIKE", "SUV", "VAN").contains(vehicleType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid vehicle type"
            );
        }

        // Find user
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        // Find parking slot
        ParkingSlot slot = parkingSlotRepository.findById(request.slotId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Parking slot not found"
                ));

        // Check slot availability
        if (slot.getStatus() != ParkingSlot.SlotStatus.AVAILABLE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Parking slot is not available"
            );
        }

        // Check vehicle compatibility
        if (!slot.getVehicleType().name().equals(vehicleType)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Vehicle type is not supported by this parking slot"
            );
        }

        // Check for overlapping bookings
        boolean isBooked = bookingRepository
                .existsBySlot_IdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                        request.slotId(),
                        List.of(Booking.Status.CONFIRMED, Booking.Status.ACTIVE),
                        request.endTime(),
                        request.startTime()
                );

        if (isBooked) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Parking slot is already booked for this time"
            );
        }

        // Create booking
        Booking booking = new Booking();

        booking.setUser(user);
        booking.setSlot(slot);
        booking.setVehicleNumber(request.vehicleNumber().trim());
        booking.setVehicleType(vehicleType);
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());

        booking.setTotalAmount(
                calculateTotalAmount(
                        request.startTime(),
                        request.endTime()
                )
        );

        booking.setStatus(Booking.Status.CONFIRMED);

        Booking savedBooking = bookingRepository.save(booking);

        return bookingRepository.findById(savedBooking.getId())
                .orElse(savedBooking);
    }


    // Update a booking
    public Booking updateBooking(UUID id, Booking updatedBooking) {

        Booking booking = getBookingById(id);

        booking.setUser(updatedBooking.getUser());
        booking.setSlot(updatedBooking.getSlot());
        booking.setVehicleNumber(updatedBooking.getVehicleNumber());
        booking.setVehicleType(updatedBooking.getVehicleType());
        booking.setStartTime(updatedBooking.getStartTime());
        booking.setEndTime(updatedBooking.getEndTime());
        booking.setTotalAmount(updatedBooking.getTotalAmount());
        booking.setStatus(updatedBooking.getStatus());

        return bookingRepository.save(booking);
    }
    public Booking cancelBooking(UUID id) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only confirmed bookings can be cancelled"
            );
        }

        booking.setStatus(Booking.Status.CANCELLED);

        return bookingRepository.save(booking);
    }

    public Booking activateBooking(UUID id) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only confirmed bookings can be activated"
            );
        }

        booking.setStatus(Booking.Status.ACTIVE);

        return bookingRepository.save(booking);
    }
    public Booking completeBooking(UUID id) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() != Booking.Status.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only active bookings can be completed"
            );
        }

        booking.setStatus(Booking.Status.COMPLETED);

        return bookingRepository.save(booking);
    }
    // Delete a booking
    public void deleteBooking(UUID id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    private BigDecimal calculateTotalAmount(
            OffsetDateTime startTime,
            OffsetDateTime endTime
    ) {
        long minutes = Duration.between(startTime, endTime).toMinutes();

        long hours = (long) Math.ceil(minutes / 60.0);

        BigDecimal hourlyRate = new BigDecimal("30.00");

        return hourlyRate.multiply(BigDecimal.valueOf(hours));
    }
    public Booking recalculateBookingPrice(UUID id) {
        Booking booking = getBookingById(id);

        BigDecimal amount = calculateTotalAmount(
                booking.getStartTime(),
                booking.getEndTime()
        );

        booking.setTotalAmount(amount);

        return bookingRepository.save(booking);
    }
}