"use client";

import { FiCalendar, FiClock, FiUser, FiActivity } from "react-icons/fi";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

interface Appointment {
  id: number;
  dentist_name?: string;
  service_name?: string;
  patient_name?: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  showPatient?: boolean;
  actions?: React.ReactNode;
}

export default function AppointmentCard({
  appointment,
  showPatient = false,
  actions,
}: AppointmentCardProps) {
  return (
    <div className="card-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-400">
              #{appointment.id}
            </span>
            <span className={`badge ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </span>
          </div>

          <p className="font-semibold text-gray-900 text-sm truncate">
            {appointment.service_name ?? "Service"}
          </p>

          <div className="mt-2 flex flex-col gap-1">
            {showPatient && appointment.patient_name && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiUser className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{appointment.patient_name}</span>
              </div>
            )}
            {appointment.dentist_name && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiActivity className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Dr. {appointment.dentist_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatTime(appointment.time)}</span>
            </div>
          </div>

          {appointment.reason && (
            <p className="mt-2 text-xs text-gray-400 italic line-clamp-2">
              {appointment.reason}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
