import { Contact } from "@/types/contact";

const CONTACTS_API_URL = "https://api.steinhq.com/v1/storages/66e598124d11fd04f02ad860/contactos";
const LEADS_API_URL = "https://api.steinhq.com/v1/storages/66e598124d11fd04f02ad860/leads";

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch(CONTACTS_API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }
  const data = await response.json();
  return data;
}

export async function getLeads(): Promise<Contact[]> {
  const response = await fetch(LEADS_API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }
  const data = await response.json();
  return data;
}