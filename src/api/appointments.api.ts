// src/api/appointments.api.ts — NjangaRent appointment lifecycle
import { axiosClient } from "./axiosClient";

export type AppointmentStatus =
  | "pending" | "confirmed" | "rescheduled" | "declined"
  | "completed" | "cancelled" | "expired";

export type AppointmentSlot = "morning" | "afternoon" | "evening";

export interface Appointment {
  id: string;
  listingId: string;
  studentId: string;
  landlordId: string;
  proposedDate: string;
  proposedSlot: AppointmentSlot;
  studentNote?: string;
  landlordNote?: string;
  counterDate?: string;
  counterSlot?: AppointmentSlot;
  declineReason?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAppointments {
  data: Appointment[];
  pagination: { page: number; limit: number; total: number; hasNext: boolean };
}

export interface CreateAppointmentBody {
  listingId: string;
  proposedDate: string;
  proposedSlot: AppointmentSlot;
  studentNote?: string;
}

export type RespondAction = "confirm" | "reschedule" | "decline";

export interface RespondBody {
  action: RespondAction;
  landlordNote?: string;
  counterDate?: string;
  counterSlot?: AppointmentSlot;
  declineReason?: string;
}

export const appointmentsApi = {
  create: async (body: CreateAppointmentBody): Promise<{ data: Appointment }> => {
    const res = await axiosClient.post("/appointments", body);
    return res.data;
  },

  list: async (params?: {
    status?: AppointmentStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAppointments> => {
    const res = await axiosClient.get("/appointments", { params });
    return res.data;
  },

  getById: async (id: string): Promise<{ data: Appointment }> => {
    const res = await axiosClient.get(`/appointments/${id}`);
    return res.data;
  },

  /** Landlord: confirm, reschedule, or decline. */
  respond: async (id: string, body: RespondBody): Promise<{ data: Appointment }> => {
    const res = await axiosClient.put(`/appointments/${id}/respond`, body);
    return res.data;
  },

  /** Student: cancel own appointment. */
  cancel: async (id: string): Promise<void> => {
    await axiosClient.put(`/appointments/${id}/cancel`);
  },

  /** Landlord: mark as completed. */
  complete: async (id: string): Promise<void> => {
    await axiosClient.put(`/appointments/${id}/complete`);
  },
};
