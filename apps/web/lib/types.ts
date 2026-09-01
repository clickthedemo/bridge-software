export type MemberRole =
  | "Brand"
  | "Dispensary"
  | "Retailer"
  | "Sales rep"
  | "Cultivator"
  | "Manufacturer"
  | "Lab"
  | "Transport"
  | "Bank"
  | "Service"
  | "Media"
  | "Hydroponics";

export type ProfileActivity = {
  title: string;
  meta: string;
};

export type Profile = {
  slug: string;
  name: string;
  role: MemberRole;
  location: string;
  description: string;
  specialties: string[];
  verified: boolean;
  initials: string;
  serving: string;
  about: string;
  lookingFor: string[];
  imageSrc?: string;
  imageAlt?: string;
  products?: string[];
  marketSignal?: string;
  menuItems?: string[];
  orderProvider?: string;
  channels?: string[];
  recentActivity?: ProfileActivity[];
  announcement?: {
    title: string;
    body: string;
  };
};
