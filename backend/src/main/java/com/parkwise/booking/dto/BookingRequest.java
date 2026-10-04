package com.parkwise.booking.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingRequest(
        UUID userId,
        UUID slotId,
        String vehicleNumber,
        String vehicleType,
        OffsetDateTime startTime,
        OffsetDateTime endTime
) {}