
package com.parkwise.booking;
import com.parkwise.booking.dto.BookingRequest;
import com.parkwise.booking.dto.BookingResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PatchMapping;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getSlot().getId(),
                booking.getVehicleNumber(),
                booking.getVehicleType(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }

    @GetMapping
    public List<BookingResponse> getAllBookings() {
        return bookingService.getAllBookings()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public BookingResponse getBookingById(@PathVariable UUID id) {
        return toResponse(bookingService.getBookingById(id));
    }

    @GetMapping("/user/{userId}")
    public List<BookingResponse> getBookingsByUser(
            @PathVariable UUID userId) {
        return bookingService.getBookingsByUser(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/slot/{slotId}")
    public List<BookingResponse> getBookingsBySlot(
            @PathVariable UUID slotId) {
        return bookingService.getBookingsBySlot(slotId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public BookingResponse createBooking(@RequestBody BookingRequest request) {
        Booking savedBooking = bookingService.createBooking(request);
        return toResponse(savedBooking);
    }

    @PutMapping("/{id}")
    public BookingResponse updateBooking(
            @PathVariable UUID id,
            @RequestBody Booking booking) {
        return toResponse(bookingService.updateBooking(id, booking));
    }
    @PatchMapping("/{id}/cancel")
    public BookingResponse cancelBooking(@PathVariable UUID id) {
        Booking cancelledBooking = bookingService.cancelBooking(id);
        return toResponse(cancelledBooking);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/activate")
    public BookingResponse activateBooking(@PathVariable UUID id) {
        Booking booking = bookingService.activateBooking(id);

        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getSlot().getId(),
                booking.getVehicleNumber(),
                booking.getVehicleType(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
    @PatchMapping("/{id}/complete")
    public BookingResponse completeBooking(@PathVariable UUID id) {
        Booking booking = bookingService.completeBooking(id);

        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getSlot().getId(),
                booking.getVehicleNumber(),
                booking.getVehicleType(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
    @PatchMapping("/{id}/recalculate-price")
    public BookingResponse recalculateBookingPrice(@PathVariable UUID id) {
        Booking booking = bookingService.recalculateBookingPrice(id);

        return new BookingResponse(
                booking.getId(),
                booking.getUser().getId(),
                booking.getSlot().getId(),
                booking.getVehicleNumber(),
                booking.getVehicleType(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
}
