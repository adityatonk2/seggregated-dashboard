import { ObjectId } from "mongodb";

export type LeadSource = "client_export" | "card" | "company_directory" | "excel_import";

export interface Lead {
  _id: string;
  name: string;
  organisation: string;
  role: string | null;
  linkedin: string | null;
  email: string | null;
  sector: string | null;
  connectedOn: string | null;
  source: LeadSource;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
}

// Server-side document shape (before _id/date stringification for API responses)
export interface LeadDoc {
  _id?: ObjectId;
  name: string;
  organisation: string;
  role: string | null;
  linkedin: string | null;
  email: string | null;
  sector: string | null;
  connectedOn: Date | null;
  source: LeadSource;
  dedupeKey: string;
  createdAt: Date;
  updatedAt: Date;
}
