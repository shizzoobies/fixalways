export const services = [
  { key: "hvac", label: "HVAC", query: "hvac contractor", folder: "hvac" },
  { key: "plumbing", label: "Plumbing", query: "plumber", folder: "plumbing" },
  { key: "electrical", label: "Electrical", query: "electrician", folder: "electrical" },
  { key: "roofing", label: "Roofing", query: "roofing contractor", folder: "roofing" },
  { key: "pest-control", label: "Pest Control", query: "pest control", folder: "pest-control" },
  { key: "handyman", label: "Handyman", query: "handyman", folder: "handyman" },
];

export const defaultServiceKey = "hvac";

export function getServiceByKey(key) {
  return services.find((s) => s.key === key);
}
