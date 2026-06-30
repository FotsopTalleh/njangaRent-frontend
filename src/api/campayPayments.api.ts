// src/api/campayPayments.api.ts — Campay Mobile Money payments
import { axiosClient } from "./axiosClient";

export type CampayStatus = "initiated" | "pending" | "confirmed" | "failed";
export type PaymentType = "deposit" | "rent";

export interface CampayPayment {
  id: string;
  listingId: string;
  payerId: string;
  landlordId: string;
  amount: number;
  phoneNumber: string;
  paymentType: PaymentType;
  transactionId: string;
  status: CampayStatus;
  createdAt: string;
  updatedAt: string;
  
  // Joined fields
  listingTitle?: string;
}

export interface InitiatePaymentBody {
  listingId: string;
  amount: number;
  phone: string;
  paymentType: PaymentType;
  landlordId?: string; // Often deduced on backend if not supplied, but good to have
}

export const campayPaymentsApi = {
  /** Initiate a Campay MoMo payment. */
  initiate: async (body: InitiatePaymentBody): Promise<{ data: CampayPayment }> => {
    // We map frontend 'phone' to backend expected 'phoneNumber'
    const res = await axiosClient.post("/campay/pay", {
      ...body,
      phoneNumber: body.phone,
    });
    return res.data;
  },

  /** List payments for the authenticated user. */
  list: async (): Promise<{ data: CampayPayment[] }> => {
    const res = await axiosClient.get("/campay/my");
    return res.data;
  },
  
  /** Get real-time status of a specific transaction reference (not the DB ID) */
  getStatus: async (reference: string): Promise<{ data: any }> => {
    const res = await axiosClient.get(`/campay/status/${reference}`);
    return res.data;
  },
};
