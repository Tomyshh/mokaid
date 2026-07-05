/** Maps integration provider keys to MCP logo slugs (public/logos/mcp/*.svg). */
const KEY_ALIASES: Record<string, string> = {
  google_drive: "googledrive",
  google_calendar: "googlecalendar",
  google_docs: "googledocs",
  google_sheets: "googlesheets",
  google_meet: "googlemeet",
  microsoft_teams: "microsoftteams",
};

const CATEGORY_MAP: Record<string, string> = {
  Developer: "development",
  Communication: "communication",
  Storage: "storage",
  Productivity: "productivity",
  "Project Management": "crm",
  Automation: "productivity",
  CRM: "crm",
  Finance: "finance",
};

export function integrationLogoSlug(key: string, iconSlug?: string | null): string | null {
  if (iconSlug) return iconSlug;
  if (KEY_ALIASES[key]) return KEY_ALIASES[key];
  return key.replace(/_/g, "");
}

export function integrationMcpCategory(category: string): string {
  return CATEGORY_MAP[category] ?? "productivity";
}
