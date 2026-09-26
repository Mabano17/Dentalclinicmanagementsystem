"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { appointmentsAPI, dentistsAPI, servicesAPI } from "@/lib/api";
import { formatCurrency, extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Dentist { id: string; full_name: string; specialization: string; status: string }
interface Service { id: string; name: string; description: string; price: string; duration_minutes: number; status: string }

type Step = 1 | 2 | 3 | 4;

export default function BookAppointmentPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [d, s] = await Promise.all([
          dentistsAPI.getAll({ status: "ACTIVE", page_size: 100 }),
          servicesAPI.getAll({ status: "ACTIVE", page_size: 100 }),
        ]);
        setDentists(d.data.results ?? []);
        setServices(s.data.results ?? []);
      } catch (err) { showToast(extractError(err), "error"); }
      finally { setLoadingData(false); }
    };
    load();
  }, [showToast]);

  const handleSubmit = async () => {
    if (!selectedDentist || !date || !time) return;
    setSubmitting(true);
    setBookingError("");
    try {
      const payload: Record<string, unknown> = {
        dentist: selectedDentist.id,
        appointment_date: date,
        appointment_time: time,
        reason,
      };
      if (selectedService?.id) payload.service = selectedService.id;
      await appointmentsAPI.create(payload);
      showToast("Appointment booked successfully!", "success");
      router.push("/patient/appointments");
    } catch (err) {
      const msg = extractError(err);
      console.error("Booking error:", err);
      setBookingError(msg);
      showToast(msg, "error", 8000);
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30",
  ];

  const stepLabels = ["Select Dentist", "Select Service", "Date & Time", "Confirm"];

  return (
    <PageLayout title="Book Appointment">
      <div className="p-6 max-w-2xl mx-auto">

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {stepLabels.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-2 ${done ? "cursor-pointer" : ""}`}
                  onClick={() => done && setStep(n)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${active ? "bg-blue-600 text-white" : done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {done ? "✓" : n}
                  </div>
                  <span className={`text-xs hidden sm:block ${active ? "text-blue-600 font-semibold" : "text-gray-400"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > n ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">

          {/* Step 1: Dentist */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Choose a Dentist</h3>
              {loadingData ? <p className="text-sm text-gray-400">Loading dentists…</p> : (
                <div className="grid gap-3">
                  {dentists.map((d) => (
                    <button key={d.id} onClick={() => { setSelectedDentist(d); setStep(2); }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-blue-400
                        ${selectedDentist?.id === d.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                        {d.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Dr. {d.full_name}</p>
                        <p className="text-sm text-gray-500">{d.specialization || "General Dentistry"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Select a Service</h3>
              <div className="grid gap-3">
                <button onClick={() => { setSelectedService(null); setStep(3); }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left hover:border-blue-400 transition-all
                    ${selectedService === null ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                  <span className="text-2xl">🦷</span>
                  <div>
                    <p className="font-semibold text-gray-800">General Consultation</p>
                    <p className="text-xs text-gray-500">Let the dentist decide what you need</p>
                  </div>
                </button>
                {services.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(3); }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left hover:border-blue-400 transition-all
                      ${selectedService?.id === s.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                    <span className="text-2xl">🦷</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.duration_minutes} min · {formatCurrency(s.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">← Back</button>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Pick Date & Time</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button key={t} onClick={() => setTime(t + ":00")}
                      className={`py-2 text-sm rounded-lg border transition-all
                        ${time === t + ":00" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:border-blue-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your concern…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
                <button onClick={() => setStep(4)} disabled={!date || !time}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300">
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Confirm Appointment</h3>
              {bookingError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {bookingError}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                {[
                  ["Dentist", `Dr. ${selectedDentist?.full_name}`],
                  ["Specialization", selectedDentist?.specialization || "General Dentistry"],
                  ["Service", selectedService?.name ?? "General Consultation"],
                  ["Price", selectedService ? formatCurrency(selectedService.price) : "To be determined"],
                  ["Date", new Date(date + "T00:00").toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                  ["Time", time.slice(0, 5)],
                  ["Reason", reason || "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2">
                    <span className="text-gray-500 w-28 flex-shrink-0">{l}:</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                  {submitting ? "Booking…" : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
