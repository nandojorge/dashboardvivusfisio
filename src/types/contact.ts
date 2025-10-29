export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  concelho: string;
  origin: string;
  createdAt: string; // Assuming ISO string date
  isLead?: boolean; // Added this property to distinguish leads
  // Add other properties as needed
}