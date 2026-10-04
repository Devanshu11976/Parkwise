
package com.parkwise.facility;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FloorService {

    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingSlotService parkingSlotService;

    public FloorService(
            FloorRepository floorRepository,
            FacilityRepository facilityRepository,
            ParkingSlotRepository parkingSlotRepository,
            ParkingSlotService parkingSlotService) {
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingSlotService = parkingSlotService;
    }

    public List<Floor> getAllFloors() {
        return floorRepository.findAll();
    }

    public Floor createFloor(UUID facilityId, Floor floor) {
        var facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Facility not found"));

        floor.setFacility(facility);
        return floorRepository.save(floor);
    }

    public Floor getFloorById(UUID id) {
        return floorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Floor not found"));
    }

    public Floor updateFloor(UUID id, Floor updatedFloor) {
        Floor floor = getFloorById(id);

        floor.setFloorNumber(updatedFloor.getFloorNumber());
        floor.setName(updatedFloor.getName());

        return floorRepository.save(floor);
    }

    @Transactional
    public void deleteFloor(UUID id) {
        Floor floor = getFloorById(id);
        List<ParkingSlot> slots = parkingSlotRepository.findByFloor_Id(id);
        if (slots != null) {
            for (ParkingSlot slot : slots) {
                parkingSlotService.deleteSlot(slot.getId());
            }
        }
        floorRepository.delete(floor);
        floorRepository.flush();
    }
}
