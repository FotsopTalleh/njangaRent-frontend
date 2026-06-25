// src/api/nkwaPayments.api.ts — Nkwa Mobile Money payments
import { axiosClient } from "./axiosClient";

export type NkwaStatus = "initiated" | "confirmed" | "failed";
export type PaymentType = "deposit" | "rent";

export interface NkwaPayment {
  id: string;
  listingId: string;
  studentId: string;
  landlordId: string;
  amountXaf: number;
  phone: string;
  nkwaReference: string;
  nkwaStatus: NkwaStatus;
  paymentType: PaymentType;
  initiatedAt: string;
  confirmedAt?: string;
  failedAt?: string;
}

export interface InitiatePaymentBody {
  listingId: string;
  amount: number;
  phone: string;
  paymentType: PaymentType;
}

export const nkwaPaymentsApi = {
  /** Student: initiate a Nkwa MoMo payment. */
  initiate: async (body: InitiatePaymentBody): Promise<{ data: NkwaPayment }> => {
    const res = await axiosClient.post("/nkwa-payments/initiate", body);
    return res.data;
  },

  /** List own payments (student sees theirs, landlord sees their listing payments). */
  list: async (): Promise<{ data: NkwaPayment[] }> => {
    const res = await axiosClient.get("/nkwa-payments");
    return res.data;
  },

  /** Get single payment detail. */
  getById: async (id: string): Promise<{ data: NkwaPayment }> => {
    const res = await axiosClient.get(`/nkwa-payments/${id}`);
    return res.data;
  },
};
