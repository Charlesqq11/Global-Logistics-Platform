"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Save,
  Truck,
} from "lucide-react";

type FormState = {
  shipment_type: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  description: string;
  weight_kg: string;
  declared_value: string;
  declared_currency: string;
  estimated_delivery_at: string;
};

const initialForm: FormState = {
  shipment_type: "parcel",
  origin_country: "",
  origin_city: "",
  destination_country: "",
  destination_city: "",
  description: "",
  weight_kg: "",
  declared_value: "",
  declared_currency: "USD",
  estimated_delivery_at: "",
};

export default function CreateShipmentPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    tracking_number: string;
  } | null>(null);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        shipment_type: form.shipment_type,
        origin_country: form.origin_country.trim(),
        origin_city:
          form.origin_city.trim() || null,
        destination_country:
          form.destination_country.trim(),
        destination_city:
          form.destination_city.trim() || null,
        description:
          form.description.trim() || null,
      };

      if (form.weight_kg.trim()) {
        payload.weight_kg = Number(form.weight_kg);
      }

      if (form.declared_value.trim()) {
        payload.declared_value = Number(
          form.declared_value,
        );
      }

      if (form.declared_currency.trim()) {
        payload.declared_currency =
          form.declared_currency
            .trim()
            .toUpperCase();
      }

      if (form.estimated_delivery_at) {
        payload.estimated_delivery_at =
          new Date(
            form.estimated_delivery_at,
          ).toISOString();
      }

      const response = await fetch(
        "/api/admin/shipments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to create shipment.",
        );
      }

      setSuccess({
        tracking_number:
          data.tracking_number,
      });

      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create shipment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#05070a] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Shipment Created
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Shipment is now operational
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55">
              The shipment has been created successfully
              and assigned a tracking number.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                Tracking Number
              </p>

              <p className="mt-2 break-all font-mono text-xl font-semibold text-white">
                {success.tracking_number}
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/admin/shipments/${encodeURIComponent(
                  success.tracking_number,
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                View Shipment
              </Link>

              <Link
                href="/admin/shipments"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Shipment Operations
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setError("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <header className="mb-8">
          <Link
            href="/admin/shipments"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shipment Operations
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Package className="h-5 w-5 text-white/75" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                    Shipment Operations
                  </p>

                  <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                    Create Shipment
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
                Create a shipment record and generate its
                operational tracking identity.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />

                <div>
                  <p className="text-xs font-medium text-white/70">
                    Operations API
                  </p>
                  <p className="text-[11px] text-white/35">
                    Connected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4">
            <p className="text-sm font-medium text-red-300">
              Shipment creation failed
            </p>

            <p className="mt-1 text-sm leading-6 text-red-200/70">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Box className="h-5 w-5 text-white/65" />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  Shipment Profile
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Define the shipment type and commercial
                  information.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Shipment Type"
                required
              >
                <select
                  value={form.shipment_type}
                  onChange={(event) =>
                    updateField(
                      "shipment_type",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="parcel">
                    Parcel
                  </option>
                  <option value="logistics">
                    Logistics
                  </option>
                  <option value="freight">
                    Freight
                  </option>
                  <option value="cargo">
                    Cargo
                  </option>
                  <option value="shipment">
                    Shipment
                  </option>
                  <option value="vehicle">
                    Vehicle
                  </option>
                </select>
              </Field>

              <Field label="Description">
                <input
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Commercial electronics shipment"
                  className={inputClass}
                />
              </Field>

              <Field label="Weight (kg)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={(event) =>
                    updateField(
                      "weight_kg",
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Declared Value">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.declared_value}
                  onChange={(event) =>
                    updateField(
                      "declared_value",
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <input
                  value={form.declared_currency}
                  onChange={(event) =>
                    updateField(
                      "declared_currency",
                      event.target.value,
                    )
                  }
                  maxLength={3}
                  placeholder="USD"
                  className={inputClass}
                />
              </Field>

              <Field label="Estimated Delivery">
                <input
                  type="datetime-local"
                  value={
                    form.estimated_delivery_at
                  }
                  onChange={(event) =>
                    updateField(
                      "estimated_delivery_at",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <MapPin className="h-5 w-5 text-white/65" />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  Route
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Define the shipment origin and destination.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-white/45" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Origin
                  </span>
                </div>

                <div className="space-y-4">
                  <Field
                    label="Country"
                    required
                  >
                    <input
                      value={form.origin_country}
                      onChange={(event) =>
                        updateField(
                          "origin_country",
                          event.target.value,
                        )
                      }
                      placeholder="Nigeria"
                      className={inputClass}
                      required
                    />
                  </Field>

                  <Field label="City">
                    <input
                      value={form.origin_city}
                      onChange={(event) =>
                        updateField(
                          "origin_city",
                          event.target.value,
                        )
                      }
                      placeholder="Lagos"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white/45" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Destination
                  </span>
                </div>

                <div className="space-y-4">
                  <Field
                    label="Country"
                    required
                  >
                    <input
                      value={
                        form.destination_country
                      }
                      onChange={(event) =>
                        updateField(
                          "destination_country",
                          event.target.value,
                        )
                      }
                      placeholder="United Kingdom"
                      className={inputClass}
                      required
                    />
                  </Field>

                  <Field label="City">
                    <input
                      value={
                        form.destination_city
                      }
                      onChange={(event) =>
                        updateField(
                          "destination_city",
                          event.target.value,
                        )
                      }
                      placeholder="London"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              href="/admin/shipments"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Shipment...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Shipment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-black/30";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/50">
        {label}
        {required && (
          <span className="ml-1 text-white/70">*</span>
        )}
      </span>

      {children}
    </label>
  );
}