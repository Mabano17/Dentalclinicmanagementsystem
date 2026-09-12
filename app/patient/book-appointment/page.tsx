"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiClock, FiUser, FiFileText, FiCheckCircle } from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/Toast";
import { appointmentsAPI, dentistsAPI, servicesAPI } from "@/lib/api";
import { extractError } from "@/lib/utils";

interface Dentist { id: number; full_name: string; specialization: string; }
interface Service { id: number; name: string; duration_minutes?: number; price?: string; }

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    dentist: "",
    service: "",
    date: "",
    time: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, sRes] = await Promise.all([
          dentistsAPI.getAll({ status: "active" }),
          servicesAPI.getAll({ status: "active" }),
        ]);
        setDentists(dRes.data.results ?? dRes.data);
        setServices(sRes.data.results ?? sRes.data);
      } catch {
        showToast("Failed to load dentists/services.", "error");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [showToast]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.dentist) errs.dentist = "Please select a dentist.";
    if (!form.service) errs.service = "Please select a service.";
    if (!form.date) errs.date = "Please select a date.";
    if (!form.time) errs.time = "Please select a time slot.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await appointmentsAPI.create({
        dentist: Number(form.dentist),
        service: Number(form.service),
        date: form.date,
        time: form.time,
        reason: form.reason,
      });
      setSuccess(true);
    } catch (err) {
      showToast(extractError(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const selectedService = services.find((s) => String(s.id) === form.service);
  const selectedDentist = dentists.find((d) => String(d.id) === form.dentist);

  if (success) {
    return (
      <AuthGuard requiredRole="patient">
        <PageLayout role="patient" title="Book Appointment">
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <FiCheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Appointment Booked!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Your appointment request has been submitted. You will receive a
              confirmation once the clinic reviews it.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="btn-outline"
              >
                Book Another
              </button>
              <button
                onClick={() => router.push("/patient/appointments")}
                className="btn-primary"
              >
                View Appointments
              </button>
            </div>
          </div>
        </PageLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="Book Appointment">
        <div className="max-w-2xl mx-auto">
          <div className="page-header">
            <div>
              <h2 className="page-title">Book an Appointment</h2>
              <p className="page-subtitle">Fill in the form to schedule your dental visit.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Dentist */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="w-4 h-4 text-blue-600" /> Select Dentist
              </h3>
              {loadingData ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <>
                  <select
                    value={form.dentist}
                    onChange={(e) => { setForm((p) => ({ ...p, dentist: e.target.value })); setErrors((p) => ({ ...p, dentist: "" })); }}
                    className={`input ${errors.dentist ? "input-error" : ""}`}
                  >
                    <option value="">-- Select a dentist --</option>
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name}{d.specialization ? ` — ${d.specialization}` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.dentist && <p className="error-text">{errors.dentist}</p>}
                  {selectedDentist && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                        {selectedDentist.full_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Dr. {selectedDentist.full_name}</p>
                        <p className="text-xs text-blue-600">{selectedDentist.specialization}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Service */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdOutlineMedicalServices className="w-4 h-4 text-blue-600" /> Select Service
              </h3>
              {loadingData ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setForm((p) => ({ ...p, service: String(s.id) })); setErrors((p) => ({ ...p, service: "" })); }}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          form.service === String(s.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.price && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            ₱{parseFloat(s.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.service && <p className="error-text mt-1">{errors.service}</p>}
                </>
              )}
            </div>

            {/* Date & Time */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-blue-600" /> Date &amp; Time
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Preferred Date</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      min={today}
                      value={form.date}
                      onChange={(e) => { setForm((p) => ({ ...p, date: e.target.value })); setErrors((p) => ({ ...p, date: "" })); }}
                      className={`input pl-9 ${errors.date ? "input-error" : ""}`}
                    />
                  </div>
                  {errors.date && <p className="error-text">{errors.date}</p>}
                </div>

                <div className="form-group">
                  <label className="label">Time Slot</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.time}
                      onChange={(e) => { setForm((p) => ({ ...p, time: e.target.value })); setErrors((p) => ({ ...p, time: "" })); }}
                      className={`input pl-9 ${errors.time ? "input-error" : ""}`}
                    >
                      <option value="">-- Select time --</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{
                          (() => {
                            const [h, m] = t.split(":").map(Number);
                            const period = h >= 12 ? "PM" : "AM";
                            const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
                            return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
                          })()
                        }</option>
                      ))}
                    </select>
                  </div>
                  {errors.time && <p className="error-text">{errors.time}</p>}
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-blue-600" /> Reason / Notes
              </h3>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Describe your dental concern or reason for the visit (optional)…"
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Summary */}
            {(selectedDentist || selectedService || form.date || form.time) && (
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedDentist && (
                    <div><span className="text-blue-600">Dentist:</span> <span className="text-blue-900 font-medium">Dr. {selectedDentist.full_name}</span></div>
                  )}
                  {selectedService && (
                    <div><span className="text-blue-600">Service:</span> <span className="text-blue-900 font-medium">{selectedService.name}</span></div>
                  )}
                  {form.date && (
                    <div><span className="text-blue-600">Date:</span> <span className="text-blue-900 font-medium">{new Date(form.date).toLocaleDateString("en-PH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span></div>
                  )}
                  {form.time && (
                    <div><span className="text-blue-600">Time:</span> <span className="text-blue-900 font-medium">{form.time}</span></div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loadingData}
              className="btn-primary btn-lg"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Submit Appointment Request"
              )}
            </button>
          </form>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
