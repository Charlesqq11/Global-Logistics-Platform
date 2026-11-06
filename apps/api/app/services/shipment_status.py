from __future__ import annotations

from app.models.shipment import ShipmentStatus


ALLOWED_STATUS_TRANSITIONS: dict[
    ShipmentStatus,
    set[ShipmentStatus],
] = {
    ShipmentStatus.CREATED: {
        ShipmentStatus.WAITING_FOR_PICKUP,
        ShipmentStatus.PICKUP_SCHEDULED,
        ShipmentStatus.RECEIVED,
        ShipmentStatus.PROCESSING,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.WAITING_FOR_PICKUP: {
        ShipmentStatus.PICKUP_SCHEDULED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.PICKUP_FAILED,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.PICKUP_SCHEDULED: {
        ShipmentStatus.WAITING_FOR_PICKUP,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.PICKUP_FAILED,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.PICKUP_FAILED: {
        ShipmentStatus.WAITING_FOR_PICKUP,
        ShipmentStatus.PICKUP_SCHEDULED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.PICKED_UP: {
        ShipmentStatus.RECEIVED,
        ShipmentStatus.PROCESSING,
        ShipmentStatus.DEPARTED_FACILITY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.RECEIVED: {
        ShipmentStatus.PROCESSING,
        ShipmentStatus.DEPARTED_FACILITY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.PROCESSING: {
        ShipmentStatus.DEPARTED_FACILITY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.DEPARTED_FACILITY: {
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ARRIVED_AT_FACILITY,
        ShipmentStatus.ARRIVED_AT_DESTINATION,
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.IN_TRANSIT: {
        ShipmentStatus.ARRIVED_AT_FACILITY,
        ShipmentStatus.ARRIVED_AT_DESTINATION,
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.ARRIVED_AT_FACILITY: {
        ShipmentStatus.PROCESSING,
        ShipmentStatus.DEPARTED_FACILITY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.ARRIVED_AT_DESTINATION: {
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.CUSTOMS_INSPECTION,
        ShipmentStatus.CUSTOMS_HOLD,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.READY_FOR_COLLECTION,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.CUSTOMS_CLEARANCE: {
        ShipmentStatus.CUSTOMS_INSPECTION,
        ShipmentStatus.CUSTOMS_HOLD,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.CUSTOMS_INSPECTION: {
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.CUSTOMS_HOLD,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.CUSTOMS_HOLD: {
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.CUSTOMS_INSPECTION,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.CUSTOMS_CLEARED: {
        ShipmentStatus.RELEASED_FROM_CUSTOMS,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.RELEASED_FROM_CUSTOMS: {
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ARRIVED_AT_DESTINATION,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.OUT_FOR_DELIVERY: {
        ShipmentStatus.DELIVERED,
        ShipmentStatus.DELIVERY_ATTEMPTED,
        ShipmentStatus.DELIVERY_FAILED,
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.DAMAGED,
    },

    ShipmentStatus.DELIVERY_ATTEMPTED: {
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERY_FAILED,
        ShipmentStatus.READY_FOR_COLLECTION,
        ShipmentStatus.RETURNED_TO_SENDER,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.DELIVERY_FAILED: {
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERY_ATTEMPTED,
        ShipmentStatus.READY_FOR_COLLECTION,
        ShipmentStatus.RETURNED_TO_SENDER,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.READY_FOR_COLLECTION: {
        ShipmentStatus.DELIVERED,
        ShipmentStatus.RETURNED_TO_SENDER,
        ShipmentStatus.ON_HOLD,
    },

    ShipmentStatus.ON_HOLD: {
        ShipmentStatus.WAITING_FOR_PICKUP,
        ShipmentStatus.PICKUP_SCHEDULED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.PROCESSING,
        ShipmentStatus.DEPARTED_FACILITY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ARRIVED_AT_FACILITY,
        ShipmentStatus.ARRIVED_AT_DESTINATION,
        ShipmentStatus.CUSTOMS_CLEARANCE,
        ShipmentStatus.CUSTOMS_INSPECTION,
        ShipmentStatus.CUSTOMS_HOLD,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.RELEASED_FROM_CUSTOMS,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERY_ATTEMPTED,
        ShipmentStatus.DELIVERY_FAILED,
        ShipmentStatus.READY_FOR_COLLECTION,
        ShipmentStatus.DAMAGED,
        ShipmentStatus.LOST,
        ShipmentStatus.RETURNED_TO_SENDER,
        ShipmentStatus.CANCELLED,
    },

    ShipmentStatus.DAMAGED: {
        ShipmentStatus.ON_HOLD,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.RETURNED_TO_SENDER,
        ShipmentStatus.LOST,
    },

    ShipmentStatus.LOST: {
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.RETURNED_TO_SENDER,
    },

    ShipmentStatus.RETURNED_TO_SENDER: {
        ShipmentStatus.RETURN_DELIVERED,
    },

    ShipmentStatus.DELIVERED: set(),
    ShipmentStatus.RETURN_DELIVERED: set(),
    ShipmentStatus.CANCELLED: set(),
}


def can_transition(
    current_status: ShipmentStatus,
    new_status: ShipmentStatus,
) -> bool:
    if current_status == new_status:
        return True

    return new_status in ALLOWED_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )


def validate_status_transition(
    current_status: ShipmentStatus,
    new_status: ShipmentStatus,
) -> None:
    if can_transition(current_status, new_status):
        return

    raise ValueError(
        f"Invalid shipment status transition: "
        f"{current_status.value} -> {new_status.value}"
    )