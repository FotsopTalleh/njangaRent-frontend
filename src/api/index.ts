// src/api/index.ts — Central export for all API modules
export { authApi } from "./auth.api";
export { propertiesApi } from "./properties.api";
export { tenantsApi } from "./tenants.api";
export { paymentsApi } from "./payments.api";
export { receiptsApi } from "./receipts.api";
export { notificationsApi } from "./notifications.api";
// NjangaRent new APIs
export { listingsApi } from "./listings.api";
export { messagesApi } from "./messages.api";
export { appointmentsApi } from "./appointments.api";
export { campayPaymentsApi } from "./campayPayments.api";
export { adminApi } from "./admin.api";
export { axiosClient } from "./axiosClient";

// Re-export types — legacy
export type { LoginResponse, InvitePreview } from "./auth.api";
export type { Property, PaginatedResponse, CreatePropertyBody } from "./properties.api";
export type { Tenant, InviteBody, InviteResult } from "./tenants.api";
export type { Payment, SubmitPaymentBody, MonthSummary, CalendarResponse, ApproveResponse } from "./payments.api";
export type { Receipt, ManualReceiptBody, DisburseReceiptBody } from "./receipts.api";
export type { AppNotification } from "./notifications.api";
// NjangaRent types
export type { Listing, BrowseListingsParams, ListingPropertyType, ListingStatus } from "./listings.api";
export type { Conversation, Message, MessageContent } from "./messages.api";
export type { Appointment, AppointmentStatus, AppointmentSlot, RespondBody } from "./appointments.api";
export type { CampayPayment, CampayStatus, PaymentType } from "./campayPayments.api";
export type { AdminStats } from "./admin.api";
