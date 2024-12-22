export type TSelectedStation = {
  aqi: number;
  city: {
    name: string;
    url: string;
  };
  attributions: { logo: string; name: string; url: string }[];
  time: {
    iso: string;
    s: string;
  };
  forecast: {
    daily: {
      o3: { avg: number; day: string; max: number; min: number }[];
      pm10: { avg: number; day: string; max: number; min: number }[];
      pm25: { avg: number; day: string; max: number; min: number }[];
      no2: { avg: number; day: string; max: number; min: number }[];
    };
  };
  iaqi: {
    pm10?: { v: number };
    pm25?: { v: number };
    no2?: { v: number };
    o3?: { v: number };
  };
};
