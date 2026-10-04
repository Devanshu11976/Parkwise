
package com.parkwise.facility;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(
        name = "floors",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"facility_id", "floor_number"}
                )
        }
)
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(length = 100)
    private String name;

    public UUID getId() {
        return id;
    }

    public Facility getFacility() {
        return facility;
    }

    public void setFacility(Facility facility) {
        this.facility = facility;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
