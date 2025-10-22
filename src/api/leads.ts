import { Contact } from "@/types/contact";

const API_URL_LEADS = "https://api.steinhq.com/v1/storages/66e598124d11fd04f02ad860/leads";

export async function getLeads(): Promise<Contact[]> {
  const response = await fetch(API_URL_LEADS);
  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }
  const data = await response.json();
  return data;
}