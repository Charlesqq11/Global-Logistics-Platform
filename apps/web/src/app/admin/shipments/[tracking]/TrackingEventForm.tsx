"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MapPin,
  Send,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

type TrackingEventFormProps = {
  tracking: string;
  currentStatus: string;
  onCreated: () => void;
};

const statuses = [
  { value: "created", label: "Created" },

  { value: "waiting_for_pickup", label: "Waiting for Pickup" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "pickup_failed", label: "Pickup Failed" },

  { value: "received", label: "Received" },
  { value: "processing", label: "Processing" },

  { value: "departed_facility", label: "Departed Facility" },
  { value: "in_transit", label: "In Transit" },
  { value: "arrived_at_facility", label: "Arrived at Facility" },
  { value: "arrived_at_destination", label: "Arrived at Destination" },

  { value: "customs_clearance", label: "Customs Clearance" },
  { value: "customs_inspection", label: "Customs Inspection" },
  { value: "customs_hold", label: "Customs Hold" },
  { value: "customs_cleared", label: "Customs Cleared" },
  { value: "released_from_customs", label: "Released from Customs" },

  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivery_attempted", label: "Delivery Attempted" },
  { value: "delivery_failed", label: "Delivery Failed" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "delivered", label: "Delivered" },

  { value: "on_hold", label: "On Hold" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },

  { value: "returned_to_sender", label: "Returned to Sender" },
  { value: "return_delivered", label: "Return Delivered" },

  { value: "cancelled", label: "Cancelled" },
];

function getLocalDateTime() {
  const date = new Date();

  const offset = date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() - offset * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 16);
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function TrackingEventForm({
  tracking,
  currentStatus,
  onCreated,
}: TrackingEventFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [status, setStatus] = useState("");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [location, setLocation] = useState("");

  const [countryCode, setCountryCode] = useState("");

  const [eventTime, setEventTime] = useState(
    getLocalDateTime(),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const currentStatusLabel = useMemo(
    () => formatStatus(currentStatus),
    [currentStatus],
  );

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setError(null);
  }

  async function submitEvent(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (!status) {
      setError("Select the new shipment status.");
      return;
    }

    if (!title.trim()) {
      setError("Enter a title for this tracking event.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(
          tracking,
        )}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            title: title.trim(),
            description: description.trim() || null,
            location: location.trim() || null,
            country_code:
              countryCode.trim().toUpperCase() || null,
            event_time: new Date(eventTime).toISOString(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to add tracking event.",
        );
      }

      setSuccess(true);

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        onCreated();
      }, 700);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add tracking event.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#090d12] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#090d12] px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-white">
              Add Tracking Event
            </p>

            <p className="mt-1 text-xs text-white/35">
              Record the next operational movement for{" "}
              {tracking}.
            </p>
          </div>

          <button
            type="button"
            onClick={closeForm}
            disabled={isSubmitting}
            aria-label="Close tracking event form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={submitEvent}
          className="space-y-5 p-5 sm:p-6"
        >
          {/* Current Status */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                  Current Status
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {currentStatusLabel}
                </p>
              </div>

              <Clock3 className="h-4 w-4 text-white/25" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />

              <p className="text-xs leading-5 text-red-200/80">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />

              <p className="text-xs leading-5 text-emerald-200/80">
                Tracking event added successfully.
              </p>
            </div>
          )}

          {/* Status and Time */}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-white/55">
                New Status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option
                  value=""
                  className="bg-[#090d12]"
                >
                  Select status
                </option>

                {statuses.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="bg-[#090d12]"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-white/55">
                Event Time
              </span>

              <input
                type="datetime-local"
                value={eventTime}
                onChange={(event) =>
                  setEventTime(event.target.value)
                }
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white outline-none transition focus:border-white/20"
              />
            </label>
          </div>

          {/* Event Title */}
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/55">
              Event Title
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              maxLength={255}
              placeholder="e.g. Shipment arrived at destination facility"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-white/20"
            />
          </label>

          {/* Description */}
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/55">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={3}
              placeholder="Add operational context for this event..."
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-white/20"
            />
          </label>

          {/* Location and Country */}
          <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium text-white/55">
                <MapPin className="h-3.5 w-3.5 text-white/30" />
                Location
              </span>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Lagos, Nigeria"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-white/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-white/55">
                Country Code
              </span>

              <input
                type="text"
                value={countryCode}
                onChange={(event) =>
                  setCountryCode(
                    event.target.value
                      .toUpperCase()
                      .slice(0, 2),
                  )
                }
                maxLength={2}
                placeholder="NG"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm uppercase text-white placeholder:text-white/20 outline-none transition focus:border-white/20"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSubmitting}
              className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-white/55 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />

              {isSubmitting
                ? "Adding Event..."
                : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}