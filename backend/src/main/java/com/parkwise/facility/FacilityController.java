
package com.parkwise.facility;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public List<Facility> getAllFacilities() {
        return facilityService.getAllFacilities();
    }

    @PostMapping
    public Facility createFacility(@RequestBody Facility facility) {
        return facilityService.createFacility(facility);
    }




    @GetMapping("/{id}")
    public Facility getFacilityById(@PathVariable UUID id) {
        return facilityService.getFacilityById(id);
    }

    @PutMapping("/{id}")
    public Facility updateFacility(
            @PathVariable UUID id,
            @RequestBody Facility updatedFacility) {
        return facilityService.updateFacility(id, updatedFacility);
    }


    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFacility(@PathVariable UUID id) {
        facilityService.deleteFacility(id);
    }

}
