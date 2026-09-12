"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar } from "react-icons/fi";
import PageLayout from "@/components/PageLayout";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/Toast";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";
import { patientsAPI } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { extractError, formatDate, genderLabel, getInitials } from "@/lib/utils";

interface Profile {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  gender: string;
  emergency_contact: string;
  emergency_contact_phone?: string;
}

export default function PatientProfilePage() {
  const { showToast } = useToast();
  const user = getUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await patientsAPI.getMe();
      setProfile(data);
      setForm(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data } = await patientsAPI.patch(profile.id, form);
      setProfile(data);
      setForm(data);
      setEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      showToast(extractError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profile ?? {});
    setEditing(false);
  };

  const fields = [
    { key: "full_name", label: "Full Name", icon: FiUser, type: "text" },
    { key: "email", label: "Email", icon: FiMail, type: "email" },
    { key: "phone_number", label: "Phone Number", icon: FiPhone, type: "tel" },
    { key: "address", label: "Address", icon: FiMapPin, type: "text" },
    { key: "date_of_birth", label: "Date of Birth", icon: FiCalendar, type: "date" },
    { key: "emergency_contact", label: "Emergency Contact", icon: FiUser, type: "text" },
    { key: "emergency_contact_phone", label: "Emergency Phone", icon: FiPhone, type: "tel" },
  ] as const;

  if (loading) return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Profile">
        <Loading message="Loading profile…" />
      </PageLayout>
    </AuthGuard>
  );

  if (error) return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Profile">
        <ErrorMessage message={error} onRetry={fetchProfile} />
      </PageLayout>
    </AuthGuard>
  );

  return (
    <AuthGuard requiredRole="patient">
      <PageLayout role="patient" title="My Profile">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="page-title">My Profile</h2>
              <p className="page-subtitle">Manage your personal information.</p>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-outline">
                <FiEdit2 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="btn-secondary">
                  <FiX className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Avatar & name */}
          <div className="card mb-5 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {getInitials(profile?.full_name ?? user?.username ?? "?")}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{profile?.full_name}</h3>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <div className="mt-1">
                <span className="badge bg-blue-100 text-blue-700 border-blue-200">Patient</span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-5">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.map(({ key, label, icon: Icon, type }) => (
                <div key={key} className="form-group">
                  <label className="label flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    {label}
                  </label>
                  {editing ? (
                    <input
                      type={type}
                      value={(form as Record<string, string>)[key] ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 px-0.5">
                      {key === "date_of_birth"
                        ? formatDate((profile as unknown as Record<string, string>)?.[key])
                        : (profile as unknown as Record<string, string>)?.[key] || "—"}
                    </p>
                  )}
                </div>
              ))}

              {/* Gender */}
              <div className="form-group">
                <label className="label flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-gray-400" />
                  Gender
                </label>
                {editing ? (
                  <select
                    value={form.gender ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 px-0.5">
                    {genderLabel(profile?.gender ?? "")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
