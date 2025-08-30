import { ObjectId } from "mongodb";
// types/client.ts
export interface Client {
  _id: string; // MongoDB ObjectId as string
  Name: string;
  LinkedIn: string | null;
  "Email Address": string | null;
  Organization: string;
  Designation: string;
  "Connected On": string; // Or Date if you parse it
}

export interface company {
  _id?: ObjectId; // MongoDB document id
  company: string;

  // Decision makers (all optional, since some companies may not have them)
  ceoName?: string | null;
  ceoLinkedin?: string | null;

  cioName?: string | null;
  cioLinkedin?: string | null;

  cfoName?: string | null;
  cfoLinkedin?: string | null;

  ctoCdoName?: string | null;
  ctoCdoLinkedin?: string | null;

  // Always set
  sector: string;
}
