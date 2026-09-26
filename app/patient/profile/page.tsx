"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { authAPI } from "@/lib/api";
import { getUser, setUser } from "@/lib/auth";
import { extractError } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  username: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function PatientProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone_number: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await authAPI.getProfile();
        setProfile(data.user);
        setForm({ full_name: data.user.full_name, phone_number: data.user.phone_number ?? "" });
      } catch (err) { showToast(extractError(err), "error"); }
      finally { setLoading(false); }
    };
    load();
  }, [showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      setProfile(data.user);
      setForm({ full_name: data.user.full_name, phone_number: data.user.phone_number ?? "" });
      // Keep cookie in sync
      const current = getUser();
      if (current) setUser({ ...current, full_name: data.user.full_name, phone_number: data.user.phone_number });
      setEditing(false);
      showToast("Profile updated.", "success");
    } catch (err) { showToast(extractError(err), "error"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <PageLayout title="My Profile">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </PageLayout>
  );

  return (
    <PageLayout title="My Profile">
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0) ?? "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                {profile?.role}
              </span>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              {[
                ["Full Name", profile?.full_name],
                ["Email", profile?.email],
                ["Username", profile?.username],
                ["Phone Number", profile?.phone_number || "—"],
                ["Account Status", profile?.is_active ? "Active" : "Inactive"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500 font-medium">{l}</span>
                  <span className="text-gray-800">{v}</span>
                </div>
              ))}
              <button onClick={() => setEditing(true)}
                className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={form.phone_number}
                  onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                Email and username cannot be changed. Contact an administrator if needed.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
