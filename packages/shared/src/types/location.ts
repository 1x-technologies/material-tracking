import type { Timestamp } from "firebase/firestore";

export interface Printer {
  name: string;
  ip: string;
  model: string;
  isDefault: boolean;
}

export interface Location {
  id?: string;
  name: string;
  fullName: string;
  address: string;
  active: boolean;
  printers: Printer[];
  createdAt: Timestamp;
}
