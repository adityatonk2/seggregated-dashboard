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
