package com.parkwise.booking.dto;

import com.parkwise.booking.Booking;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID userId,
        UUID slotId,
        String vehicleNumber,
        String vehicleType,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        BigDecimal totalAmount,
        Booking.Status status,
        OffsetDateTime createdAt
) {}