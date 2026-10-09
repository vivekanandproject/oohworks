import type { IconName } from "@ohworks/ui";

/**
 * Twelve well-known, real OOH sites around the world, recorded the way ohworks records every face.
 * They are reference entries, not listings: no owner is named, no price shown, no enquiry offered.
 * Coordinates are of the public spot each site stands at.
 */
export interface WorldSite {
  id: string;
  name: string;
  city: string;
  country: string;
  /** The local term for the format. */
  format: string;
  icon: IconName;
  lat: number;
  lon: number;
  labelSide?: "left" | "right";
}

export const WORLD_SITES: WorldSite[] = [
  {
    id: "london",
    name: "Piccadilly Lights",
    city: "London",
    country: "United Kingdom",
    format: "LED screen",
    icon: "led-screen",
    lat: 51.5101,
    lon: -0.1347,
    labelSide: "left",
  },
  {
    id: "berlin",
    name: "Alexanderplatz",
    city: "Berlin",
    country: "Germany",
    format: "LED screen",
    icon: "led-screen",
    lat: 52.5217,
    lon: 13.4132,
  },
  {
    id: "new-york",
    name: "One Times Square",
    city: "New York",
    country: "United States",
    format: "spectacular",
    icon: "led-screen",
    lat: 40.7574,
    lon: -73.9856,
  },
  {
    id: "los-angeles",
    name: "Sunset Strip",
    city: "Los Angeles",
    country: "United States",
    format: "bulletin",
    icon: "hoarding",
    lat: 34.0905,
    lon: -118.385,
  },
  {
    id: "mexico-city",
    name: "Paseo de la Reforma",
    city: "Mexico City",
    country: "Mexico",
    format: "espectacular",
    icon: "unipole",
    lat: 19.4269,
    lon: -99.1677,
  },
  {
    id: "lagos",
    name: "Ozumba Mbadiwe Avenue",
    city: "Lagos",
    country: "Nigeria",
    format: "LED screen",
    icon: "led-screen",
    lat: 6.4421,
    lon: 3.428,
  },
  {
    id: "dubai",
    name: "Sheikh Zayed Road",
    city: "Dubai",
    country: "United Arab Emirates",
    format: "unipole",
    icon: "unipole",
    lat: 25.1997,
    lon: 55.2741,
  },
  {
    id: "mumbai",
    name: "Haji Ali junction",
    city: "Mumbai",
    country: "India",
    format: "hoarding",
    icon: "hoarding",
    lat: 18.9827,
    lon: 72.8099,
  },
  {
    id: "bengaluru",
    name: "Silk Board junction",
    city: "Bengaluru",
    country: "India",
    format: "hoarding",
    icon: "hoarding",
    lat: 12.9172,
    lon: 77.6229,
  },
  {
    id: "tokyo",
    name: "Shibuya Scramble",
    city: "Tokyo",
    country: "Japan",
    format: "LED screen",
    icon: "led-screen",
    lat: 35.6596,
    lon: 139.7006,
  },
  {
    id: "seoul",
    name: "COEX, Gangnam",
    city: "Seoul",
    country: "South Korea",
    format: "LED screen",
    icon: "led-screen",
    lat: 37.5119,
    lon: 127.0589,
    labelSide: "left",
  },
  {
    id: "sydney",
    name: "George Street",
    city: "Sydney",
    country: "Australia",
    format: "digital large format",
    icon: "led-screen",
    lat: -33.8733,
    lon: 151.207,
  },
];
