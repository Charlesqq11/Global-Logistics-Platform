"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../components/LanguageProvider";
import AssistantWidget from "../components/AssistantWidget";
import { translations } from "../components/translations";

const capabilityItems = [
  {
    number: "01",
    title: "globalShipmentVisibility",
    description: "shipmentVisibilityDescription",
    icon: "◎",
  },
  {
    number: "02",
    title: "operationalIntelligence",
    description: "operationalDescription",
    icon: "⌘",
  },
  {
    number: "03",
    title: "crossBorderControl",
    description: "crossBorderDescription",
    icon: "↗",
  },
] as const;

const shipmentTypes = [
  { key: "parcel", label: "Parcel" },
  { key: "freight", label: "Freight" },
  { key: "cargo", label: "Cargo" },
  { key: "vehicle", label: "Vehicle" },
] as const;

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();

  const t = translations[language];

  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedNumber = trackingNumber.trim();

    if (!normalizedNumber || isSearching) return;

    setIsSearching(true);

    router.push(
      `/track?tracking=${encodeURIComponent(normalizedNumber)}`
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#14243a]">

      {/* Premium navigation */}

      <header className="sticky top-0 z-50 border-b border-[#e7ecf2] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">

          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#14243a] text-sm font-bold tracking-tight text-white shadow-lg shadow-slate-900/10">
              GL
            </div>

            <div>
              <div className="text-[13px] font-bold tracking-[0.13em] text-[#14243a]">
                GLOBAL LOGISTICS
              </div>

              <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[#8794a6]">
                Intelligence Platform
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-9 lg:flex">
            <a href="#tracking" className="text-[13px] font-medium text-slate-600 transition hover:text-[#2457d6]">
              {t.track}
            </a>

            <a href="#capabilities" className="text-[13px] font-medium text-slate-600 transition hover:text-[#2457d6]">
              {t.capabilities}
            </a>

            <a href="#network" className="text-[13px] font-medium text-slate-600 transition hover:text-[#2457d6]">
              {t.network}
            </a>

            <a href="#company" className="text-[13px] font-medium text-slate-600 transition hover:text-[#2457d6]">
              {t.company}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            <a
              href="#tracking"
              className="rounded-xl bg-[#2457d6] px-4 py-3 text-[12px] font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-[#1948bd]"
            >
              {t.trackShipment}
            </a>
          </div>
        </div>
      </header>

      {/* Mobile language selector */}

      <div className="border-b border-[#e7ecf2] bg-white px-5 py-3 sm:hidden">
        <LanguageSelector />
      </div>

      {/* Hero section */}

      <section className="relative overflow-hidden bg-white">

        <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-100/60 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-48 left-[-120px] h-[450px] w-[450px] rounded-full bg-teal-100/40 blur-[100px]" />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-32 lg:pt-28">

          {/* Hero copy */}

          <div>

            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {t.globalIntelligence}
              </span>
            </div>

            <h1 className="max-w-4xl text-[clamp(3.3rem,7vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-[#14243a]">
              {t.headline1}

              <span className="mt-2 block bg-gradient-to-r from-[#2457d6] via-[#3478dc] to-[#16a6a1] bg-clip-text text-transparent">
                {t.headline2}
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-[15px] leading-8 text-[#68778b] sm:text-[17px]">
              {t.heroDescription}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">

              <a
                href="#tracking"
                className="group inline-flex items-center gap-3 rounded-xl bg-[#2457d6] px-6 py-4 text-[13px] font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-[#1948bd]"
              >
                {t.trackShipment}

                <span className="text-lg transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>

              <a
                href="#network"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dce4ee] bg-white px-6 py-4 text-[13px] font-semibold text-[#34445a] transition hover:border-blue-300 hover:text-[#2457d6]"
              >
                {t.exploreNetwork}
              </a>
            </div>

            {/* Hero metrics */}

            <div className="mt-14 grid max-w-xl grid-cols-3 gap-5 border-t border-[#e8edf3] pt-8">

              <Metric value="24 / 7" label={t.shipmentVisibility} />

              <Metric value={t.realTime} label={t.trackingEvents} />

              <Metric value={t.global} label={t.operationalScope} />

            </div>
          </div>

          {/* Logistics network visual */}

          <div id="network" className="relative">

            <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-blue-100/70 via-white to-teal-100/60 blur-2xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-[#e3eaf2] bg-white shadow-[0_30px_90px_rgba(31,55,90,0.10)]">

              <div className="flex items-center justify-between border-b border-[#edf1f6] px-6 py-6">

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a98aa]">
                    {t.networkIntelligence}
                  </div>

                  <div className="mt-2 text-base font-semibold text-[#14243a]">
                    {t.globalMovement}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                    {t.live}
                  </span>
                </div>
              </div>

              <div className="relative h-[390px] overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#f0f7fb]">

                {/* Map grid */}

                <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#dce6f2_1px,transparent_1px),linear-gradient(90deg,#dce6f2_1px,transparent_1px)] [background-size:42px_42px]" />

                {/* Decorative map circles */}

                <div className="absolute left-[12%] top-[17%] h-40 w-40 rounded-full border border-blue-100" />
                <div className="absolute left-[20%] top-[25%] h-24 w-24 rounded-full border border-blue-100/80" />

                {/* Network connections */}

                <svg
                  viewBox="0 0 600 340"
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M85 190 L210 105 L340 225 L490 125"
                    stroke="#80a9ed"
                    strokeWidth="2"
                    strokeDasharray="7 8"
                  />

                  <path
                    d="M85 190 Q270 310 490 125"
                    stroke="#8bd5cf"
                    strokeWidth="1.5"
                    strokeDasharray="5 9"
                  />

                  <path
                    d="M210 105 Q350 40 490 125"
                    stroke="#b5c8e9"
                    strokeWidth="1.5"
                    strokeDasharray="5 8"
                  />

                  <circle cx="85" cy="190" r="10" fill="#2457d6" fillOpacity=".12" />
                  <circle cx="85" cy="190" r="5" fill="#2457d6" />

                  <circle cx="210" cy="105" r="10" fill="#16a6a1" fillOpacity=".14" />
                  <circle cx="210" cy="105" r="5" fill="#16a6a1" />

                  <circle cx="340" cy="225" r="10" fill="#2457d6" fillOpacity=".12" />
                  <circle cx="340" cy="225" r="5" fill="#2457d6" />

                  <circle cx="490" cy="125" r="10" fill="#15966b" fillOpacity=".14" />
                  <circle cx="490" cy="125" r="5" fill="#15966b" />
                </svg>

                {/* Location labels */}

                <div className="absolute left-[7%] top-[60%] rounded-lg border border-[#e6edf5] bg-white px-3 py-2 shadow-lg shadow-slate-900/5">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-[#93a0b1]">
                    Origin
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-[#24364d]">
                    Departure
                  </div>
                </div>

                <div className="absolute left-[29%] top-[18%] rounded-lg border border-[#e6edf5] bg-white px-3 py-2 shadow-lg shadow-slate-900/5">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-[#93a0b1]">
                    Transit
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-[#24364d]">
                    Distribution
                  </div>
                </div>

                <div className="absolute right-[5%] top-[28%] rounded-lg border border-[#e6edf5] bg-white px-3 py-2 shadow-lg shadow-slate-900/5">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-[#93a0b1]">
                    Destination
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-[#24364d]">
                    Delivery
                  </div>
                </div>

                {/* Bottom statistics */}

                <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2">

                  <NetworkStat label={t.active} value={t.live} />

                  <NetworkStat label={t.coverage} value={t.global} />

                  <NetworkStat label={t.visibility} value="24 / 7" />

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking section */}

      <section
        id="tracking"
        className="border-y border-[#e7ecf2] bg-[#f4f7fb]"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">

          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#2457d6]">
                {t.shipmentIntelligence}
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-[#14243a] sm:text-4xl">
                {t.trackingTitle}
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-[#718096]">
                {t.trackingDescription}
              </p>
            </div>

            <div>

              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-[#e0e7f0] bg-white p-2 shadow-[0_15px_45px_rgba(31,55,90,0.07)]"
              >

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="flex min-h-[68px] flex-1 items-center gap-4 px-5">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-[#2457d6]">
                      $
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#9aa6b5]">
                        {t.trackingReference}
                      </div>

                      <input
                        value={trackingNumber}
                        onChange={(event) =>
                          setTrackingNumber(event.target.value)
                        }
                        placeholder={t.enterTracking}
                        className="w-full bg-transparent text-sm font-medium text-[#14243a] outline-none placeholder:text-[#a5afbd]"
                        aria-label={t.enterTracking}
                      />

                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching || !trackingNumber.trim()}
                    className="min-h-[62px] rounded-xl bg-[#2457d6] px-9 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-[#1948bd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSearching ? t.opening : t.trackShipment}
                  </button>

                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">

                {shipmentTypes.map((type) => (
                  <span
                    key={type.key}
                    className="rounded-full border border-[#e1e8f0] bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8290a2]"
                  >
                    {t[type.key]}
                  </span>
                ))}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}

      <section id="capabilities" className="bg-white">

        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">

          <div className="mb-14 max-w-2xl">

            <div className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#2457d6]">
              {t.platformCapabilities}
            </div>

            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#14243a] sm:text-5xl">
              {t.capabilitiesHeadline}
            </h2>

            <p className="mt-5 text-sm leading-8 text-[#718096] sm:text-base">
              {t.capabilitiesDescription}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {capabilityItems.map((item) => (
              <CapabilityCard
                key={item.number}
                number={item.number}
                icon={item.icon}
                title={t[item.title]}
                description={t[item.description]}
              />
            ))}

          </div>
        </div>
      </section>

      {/* Company section */}

      <section
        id="company"
        className="border-y border-[#e7ecf2] bg-[#f4f7fb]"
      >

        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">

          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            <div>

              <div className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#2457d6]">
                {t.builtForOperations}
              </div>

              <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#14243a] sm:text-5xl">
                {t.operationsHeadline}
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-8 text-[#718096] sm:text-base">
                {t.operationsDescription}
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <EnterpriseStat value="01" label={t.unifiedTracking} />

              <EnterpriseStat value="02" label={t.eventHistory} />

              <EnterpriseStat value="03" label={t.customsVisibility} />

              <EnterpriseStat value="04" label={t.deliveryIntelligence} />

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}

      <footer className="bg-[#14243a] text-white">

        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12">

          <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-10 md:flex-row">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-bold">
                  GL
                </div>

                <div>
                  <div className="text-xs font-bold tracking-[0.15em]">
                    GLOBAL LOGISTICS
                  </div>

                  <div className="mt-1 text-[8px] uppercase tracking-[0.25em] text-white/40">
                    Intelligence Platform
                  </div>
                </div>

              </div>

              <p className="mt-5 max-w-sm text-xs leading-7 text-white/55">
                {t.footerDescription}
              </p>

            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs text-white/60">

              <a href="#tracking" className="transition hover:text-white">
                {t.trackShipment}
              </a>

              <a href="#capabilities" className="transition hover:text-white">
                {t.capabilities}
              </a>

              <a href="#network" className="transition hover:text-white">
                {t.network}
              </a>

              <a href="#company" className="transition hover:text-white">
                {t.company}
              </a>

            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 pt-7 text-[10px] text-white/40 sm:flex-row">

            <span>
              © {new Date().getFullYear()} Global Logistics Platform
            </span>

            <span>
              {t.secureTracking} · {t.globalVisibility} · {t.operationalIntelligenceFooter}
            </span>

          </div>
        </div>
      </footer>

      <AssistantWidget context="home" language={language} />
    </main>
  );
}

/* Metric component */

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="text-sm font-bold text-[#14243a]">
        {value}
      </div>

      <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8b98a9]">
        {label}
      </div>
    </div>
  );
}

/* Network statistics */

function NetworkStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-md">
      <div className="text-xs font-bold text-[#14243a]">
        {value}
      </div>

      <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#8492a4]">
        {label}
      </div>
    </div>
  );
}

/* Capability cards */

function CapabilityCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e7ecf2] bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(31,55,90,0.08)] sm:p-9">

      <div className="flex items-center justify-between">

        <span className="text-[10px] font-bold tracking-[0.18em] text-[#a2adbb]">
          {number}
        </span>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-[#2457d6] transition group-hover:bg-[#2457d6] group-hover:text-white">
          {icon}
        </span>

      </div>

      <h3 className="mt-12 text-lg font-semibold tracking-[-0.025em] text-[#14243a]">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-[#8190a3]">
        {description}
      </p>

    </div>
  );
}

/* Enterprise statistics */

function EnterpriseStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e1e8f0] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">

      <div className="text-3xl font-semibold tracking-[-0.05em] text-[#2457d6]">
        {value}
      </div>

      <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.14em] text-[#718096]">
        {label}
      </div>

    </div>
  );
}