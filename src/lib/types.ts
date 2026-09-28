export type UserType = "realtor" | "agent" | "admin";

export type PropertyType = "shortlet" | "land" | "building" | "shop" | "business_complex";
export type TransactionType = "rent" | "sale" | "lease";
export type PropertyStatus = "available" | "pending" | "sold" | "rented" | "unavailable" | "rejected";

export interface PropertyImage {
  _id?: string;
  url: string;
  isPrimary?: boolean;
}

export interface OwnerLite {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  realtorProfile?: { company?: string; verified?: boolean };
}

export interface ShortletDetails {
  minimumStay?: number;
  maximumStay?: number;
  checkInTime?: string;
  checkOutTime?: string;
  maxGuests?: number;
  amenities?: string[];
  houseRules?: string[];
  cancellationPolicy?: string;
  cleaningFee?: number;
  securityDeposit?: number;
  weekendRate?: number | null;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
}

export interface PropertyDoc {
  _id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  price: number;
  priceNegotiable?: boolean;
  location: {
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    landmark?: string;
  };
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    toilets?: number;
    parkingSpaces?: number;
    floorArea?: number;
    landArea?: number;
    furnished?: boolean;
    serviced?: boolean;
    security?: boolean;
    powerSupply?: boolean;
    borehole?: boolean;
  };
  images: PropertyImage[];
  videoUrl?: string;
  owner: OwnerLite | string;
  status: PropertyStatus;
  rejectionReason?: string;
  views: number;
  featured?: boolean;
  listingTier?: "free" | "standard" | "premium";
  agencyFee?: number;
  shortletDetails?: ShortletDetails;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryDoc {
  _id: string;
  property: string | { _id: string; slug: string; title: string; images?: PropertyImage[] };
  propertyTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  realtor?: { id?: string; name?: string; email?: string };
  agent?: { id?: string; name?: string; email?: string };
  read: boolean;
  replied: boolean;
  replyMessage?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface ProjectDoc {
  _id: string;
  name: string;
  slug: string;
  developer: { name: string; website?: string; contactEmail?: string; contactPhone?: string };
  location: { address?: string; city?: string; state?: string; lga?: string; googleEarthUrl?: string };
  description: { short: string; long: string };
  features?: { icon?: string; title?: string; description?: string }[];
  amenities?: string[];
  specifications?: {
    totalUnits?: number;
    unitSizes?: { type?: string; size?: string; price?: number; available?: number }[];
    landArea?: string;
    completionDate?: string;
    status?: "upcoming" | "ongoing" | "completed" | "sold_out";
  };
  media: { featuredImage: string; gallery?: { url: string; caption?: string }[]; videoTour?: string; virtualTour?: string; brochure?: string };
  pricing?: {
    startingPrice?: number;
    priceRange?: { min?: number; max?: number };
    paymentPlan?: { title?: string; description?: string; percentage?: number }[];
    includes?: string[];
    excludes?: string[];
  };
  investment?: { roi?: string; rentalYield?: string; capitalAppreciation?: string; highlights?: string[] };
  seo?: { metaTitle?: string; metaDescription?: string; metaKeywords?: string };
  status: "draft" | "published" | "archived";
  featured?: boolean;
  order?: number;
  views?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDoc {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  ogImage?: string;
  authorName: string;
  categories?: string[];
  tags?: string[];
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  featured?: boolean;
  views?: number;
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
}
