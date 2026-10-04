
package com.parkwise.facility;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(
        name = "parking_slots",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"floor_id", "slot_number"}
                )
        }
)
public class ParkingSlot {

    public enum VehicleType {
        CAR, BIKE, SUV, VAN
    }

    public enum SlotStatus {
        AVAILABLE, MAINTENANCE, OUT_OF_SERVICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(name = "slot_number", length = 20, nullable = false)
    private String slotNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", length = 20, nullable = false)
    private VehicleType vehicleType;

    @Column(name = "has_ev_charger", nullable = false)
    private boolean hasEvCharger = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private SlotStatus status = SlotStatus.AVAILABLE;

    public UUID getId() {
        return id;
    }

    public Floor getFloor() {
        return floor;
    }

    public void setFloor(Floor floor) {
        this.floor = floor;
    }

    public String getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(String slotNumber) {
        this.slotNumber = slotNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public boolean isHasEvCharger() {
        return hasEvCharger;
    }

    public void setHasEvCharger(boolean hasEvCharger) {
        this.hasEvCharger = hasEvCharger;
    }

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }
}
