import type { SpaceType } from "./properties";

// Amenity filters on the search page. Labels must match the amenity labels in properties.ts.
export const AMENITY_FILTERS = [
  { slug: "hot-tub", label: "Hot tub" },
  { slug: "sauna", label: "Sauna" },
  { slug: "pool", label: "Pool" },
  { slug: "fireplace", label: "Fireplace" },
  { slug: "ac", label: "Air conditioning" },
  { slug: "workspace", label: "Workspace" },
  { slug: "bbq", label: "BBQ" },
  { slug: "washer", label: "Washer" },
] as const;

export const SPACE_ORDER: SpaceType[] = ["house", "main", "basement", "condo"];
