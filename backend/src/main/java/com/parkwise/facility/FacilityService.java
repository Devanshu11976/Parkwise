package com.parkwise.facility;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;
    private final FloorService floorService;

    public FacilityService(
            FacilityRepository facilityRepository,
            FloorRepository floorRepository,
            FloorService floorService) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.floorService = floorService;
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility createFacility(Facility facility) {
        return facilityRepository.save(facility);
    }

    public Facility getFacilityById(UUID id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Facility not found"
                ));
    }

    public Facility updateFacility(UUID id, Facility updatedFacility) {
        Facility facility = getFacilityById(id);

        facility.setName(updatedFacility.getName());
        facility.setAddress(updatedFacility.getAddress());
        facility.setCity(updatedFacility.getCity());
        facility.setTimezone(updatedFacility.getTimezone());
        facility.setActive(updatedFacility.isActive());

        return facilityRepository.save(facility);
    }

    @Transactional
    public void deleteFacility(UUID id) {
        Facility facility = getFacilityById(id);
        List<Floor> floors = floorRepository.findByFacility_Id(id);
        if (floors != null) {
            for (Floor floor : floors) {
                floorService.deleteFloor(floor.getId());
            }
        }
        facilityRepository.delete(facility);
        facilityRepository.flush();
    }
}