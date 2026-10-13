// Shapes of the Hospitable Public API v2 responses we read. Only the fields
// the site uses are typed; everything else (house manual, wifi, access codes,
// iCal feed) is deliberately left out so it can't be rendered by accident.

export type HospitableAddress = {
  city: string | null;
  state: string | null;
  country: string | null;
  country_name?: string | null;
  coordinates?: { latitude: string; longitude: string } | null;
};

export type HospitableProperty = {
  id: string;
  public_name: string | null;
  name: string;
  picture: string | null;
  address: HospitableAddress;
  listed: boolean;
  currency: string;
  summary: string | null;
  description: string | null;
  checkin: string | null;
  checkout: string | null;
  amenities: string[];
  capacity: { max: number; bedrooms: number; beds: number; bathrooms: number };
  room_details?: { type: string; beds: { type: string; quantity: number }[] }[];
  property_type: string | null;
  room_type: string | null;
  tags?: string[];
  house_rules?: {
    pets_allowed: boolean;
    smoking_allowed: boolean;
    events_allowed: boolean;
    children_allowed: boolean;
    infants_allowed: boolean;
  };
};

export type HospitableImage = {
  url: string;
  thumbnail_url: string;
  caption: string | null;
  order: number;
};

export type HospitableReview = {
  id: string;
  platform: string;
  public: { rating: number | null; review: string | null; response: string | null };
  reviewed_at: string;
};

export type HospitableCalendarDay = {
  date: string;
  min_stay: number;
  closed_for_checkin: boolean;
  closed_for_checkout: boolean;
  status: { available: boolean };
  price: { amount: number; currency: string; formatted: string };
};

export type HospitableMoney = { amount: number; formatted: string; label: string };

export type HospitableQuote = {
  quote_id: string;
  booking_url: string;
  currency: string;
  financials: {
    taxes: HospitableMoney[];
    fees: HospitableMoney[];
    discounts: HospitableMoney[];
    totals: {
      sub_total: HospitableMoney;
      total: HospitableMoney;
    };
  };
};
