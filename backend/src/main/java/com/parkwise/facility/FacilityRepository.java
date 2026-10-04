
package com.parkwise.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {
}
