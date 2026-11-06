"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Save,
  X,
} from "lucide-react";

type Shipment = {
  shipment_type?: string | null;
  origin_country?: string | null;
  origin_city?: string | null;
  destination_country?: string | null;
  destination_city?: string | null;
  description?: string | null;
  weight_kg?: number | string | null;
  declared_value?: number | string | null;
  declared_currency?: string | null;
  estimated_delivery_at?: string | null;
};

type EditShipmentFormProps = {
  tracking: string;
  shipment: Shipment;
  onClose: () => void;
  onSaved: () => void;
};

const shipmentTypes = [
  { value: "parcel", label: "Parcel" },
  { value: "document", label: "Document" },
  { value: "freight", label: "Freight" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.06]";

const labelClass =
  "mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/45";

function toDateTimeLocal(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60 * 1000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

export default function EditShipmentForm({
  tracking,
  shipment,
  onClose,
  onSaved,
}: EditShipmentFormProps) {
  const [shipmentType, setShipmentType] =
    useState(
      shipment.shipment_type ?? "parcel",
    );

  const [originCountry, setOriginCountry] =
    useState(
      shipment.origin_country ?? "",
    );

  const [originCity, setOriginCity] =
    useState(
      shipment.origin_city ?? "",
    );

  const [
    destinationCountry,
    setDestinationCountry,
  ] = useState(
    shipment.destination_country ?? "",
  );

  const [
    destinationCity,
    setDestinationCity,
  ] = useState(
    shipment.destination_city ?? "",
  );

  const [description, setDescription] =
    useState(
      shipment.description ?? "",
    );

  const [weightKg, setWeightKg] =
    useState(
      shipment.weight_kg != null
        ? String(shipment.weight_kg)
        : "",
    );

  const [declaredValue, setDeclaredValue] =
    useState(
      shipment.declared_value != null
        ? String(shipment.declared_value)
        : "",
    );

  const [
    declaredCurrency,
    setDeclaredCurrency,
  ] = useState(
    shipment.declared_currency ?? "",
  );

  const [
    estimatedDelivery,
    setEstimatedDelivery,
  ] = useState(
    toDateTimeLocal(
      shipment.estimated_delivery_at,
    ),
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess(false);

    const payload: Record<string, unknown> = {
      shipment_type: shipmentType,

      origin_country:
        originCountry.trim(),

      origin_city:
        originCity.trim() || null,

      destination_country:
        destinationCountry.trim(),

      destination_city:
        destinationCity.trim() || null,

      description:
        description.trim() || null,

      weight_kg:
        weightKg.trim()
          ? Number(weightKg)
          : null,

      declared_value:
        declaredValue.trim()
          ? Number(declaredValue)
          : null,

      declared_currency:
        declaredCurrency.trim()
          ? declaredCurrency
              .trim()
              .toUpperCase()
          : null,

      estimated_delivery_at:
        estimatedDelivery
          ? new Date(
              estimatedDelivery,
            ).toISOString()
          : null,
    };

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(
          tracking,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to update shipment.",
        );
      }

      setSuccess(true);

      window.setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d10] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
              Shipment Operations
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Edit Shipment
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {tracking}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close edit shipment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Shipment Type
              </label>

              <select
                value={shipmentType}
                onChange={(event) =>
                  setShipmentType(
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                {shipmentTypes.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                      className="bg-[#0b0d10]"
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white">
                Origin
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    className={labelClass}
                  >
                    Country
                  </label>

                  <input
                    required
                    value={originCountry}
                    onChange={(event) =>
                      setOriginCountry(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Nigeria"
                  />
                </div>

                <div>
                  <label
                    className={labelClass}
                  >
                    City
                  </label>

                  <input
                    value={originCity}
                    onChange={(event) =>
                      setOriginCity(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Lagos"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white">
                Destination
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    className={labelClass}
                  >
                    Country
                  </label>

                  <input
                    required
                    value={
                      destinationCountry
                    }
                    onChange={(event) =>
                      setDestinationCountry(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="United Kingdom"
                  />
                </div>

                <div>
                  <label
                    className={labelClass}
                  >
                    City
                  </label>

                  <input
                    value={destinationCity}
                    onChange={(event) =>
                      setDestinationCity(
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="London"
                  />
                </div>
              </div>
            </section>

            <div>
              <label className={labelClass}>
                Weight (kg)
              </label>

              <input
                type="number"
                min="0"
                step="0.001"
                value={weightKg}
                onChange={(event) =>
                  setWeightKg(
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="0.000"
              />
            </div>

            <div>
              <label className={labelClass}>
                Declared Value
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={declaredValue}
                onChange={(event) =>
                  setDeclaredValue(
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={labelClass}>
                Currency
              </label>

              <input
                maxLength={3}
                value={declaredCurrency}
                onChange={(event) =>
                  setDeclaredCurrency(
                    event.target.value
                      .toUpperCase(),
                  )
                }
                className={inputClass}
                placeholder="USD"
              />
            </div>

            <div>
              <label className={labelClass}>
                Estimated Delivery
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

                <input
                  type="datetime-local"
                  value={
                    estimatedDelivery
                  }
                  onChange={(event) =>
                    setEstimatedDelivery(
                      event.target.value,
                    )
                  }
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Shipment Description
              </label>

              <textarea
                rows={5}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className={`${inputClass} resize-none`}
                placeholder="Describe the shipment or operational contents..."
              />
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

              <p className="text-sm text-red-200">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mx-6 mb-6 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />

              <p className="text-sm text-emerald-200">
                Shipment updated successfully.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || success}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}