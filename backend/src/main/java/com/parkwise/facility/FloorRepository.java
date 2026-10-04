
package com.parkwise.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

import java.util.List;

public interface FloorRepository extends JpaRepository<Floor, UUID> {
    List<Floor> findByFacility_Id(UUID facilityId);
}
