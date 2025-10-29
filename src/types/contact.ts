export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  concelho: string;
  origemcontacto: string; // Changed from 'origin' to 'origemcontacto'
  dataregisto: string; // Added for contact registration date
  datacontactolead?: string; // Added for lead contact date
  arquivado?: string; // Added for archived status
  status?: string; // Added for general status
  conversao?: string; // Added for lead conversion status
  estadodalead?: string; // Added for lead state
  servico?: string; // Added for lead service
  createdAt: string; // Assuming ISO string date
  isLead?: boolean; // Added this property to distinguish leads
  // Add other properties as needed
}