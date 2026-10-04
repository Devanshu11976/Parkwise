
package com.parkwise.facility;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    public ParkingSlotController(ParkingSlotService parkingSlotService) {
        this.parkingSlotService = parkingSlotService;
    }

    @GetMapping("/slots")
    public List<ParkingSlot> getAllSlots() {
        return parkingSlotService.getAllSlots();
    }

    @PostMapping("/floors/{floorId}/slots")
    public ParkingSlot createSlot(
            @PathVariable UUID floorId,
            @RequestBody ParkingSlot slot) {
        return parkingSlotService.createSlot(floorId, slot);
    }

    @GetMapping("/slots/available")
    public List<ParkingSlot> getAvailableSlots(
            @RequestParam UUID facilityId,
            @RequestParam ParkingSlot.VehicleType vehicleType,
            @RequestParam OffsetDateTime startTime,
            @RequestParam OffsetDateTime endTime) {

        return parkingSlotService.findAvailableSlots(
                facilityId,
                vehicleType,
                startTime,
                endTime
        );
    }

    @GetMapping("/slots/{id}")
    public ParkingSlot getSlotById(@PathVariable UUID id) {
        return parkingSlotService.getSlotById(id);
    }

    @PutMapping("/slots/{id}")
    public ParkingSlot updateSlot(
            @PathVariable UUID id,
            @RequestBody ParkingSlot updatedSlot) {
        return parkingSlotService.updateSlot(id, updatedSlot);
    }

    @DeleteMapping("/slots/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSlot(@PathVariable UUID id) {
        parkingSlotService.deleteSlot(id);
    }
}
