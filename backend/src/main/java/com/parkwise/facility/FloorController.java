
package com.parkwise.facility;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class FloorController {

    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @GetMapping("/floors")
    public List<Floor> getAllFloors() {
        return floorService.getAllFloors();
    }

    @PostMapping("/facilities/{facilityId}/floors")
    public Floor createFloor(
            @PathVariable UUID facilityId,
            @RequestBody Floor floor) {
        return floorService.createFloor(facilityId, floor);
    }

    @GetMapping("/floors/{id}")
    public Floor getFloorById(@PathVariable UUID id) {
        return floorService.getFloorById(id);
    }

    @PutMapping("/floors/{id}")
    public Floor updateFloor(
            @PathVariable UUID id,
            @RequestBody Floor updatedFloor) {
        return floorService.updateFloor(id, updatedFloor);
    }

    @DeleteMapping("/floors/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFloor(@PathVariable UUID id) {
        floorService.deleteFloor(id);
    }
}
