import {
  MAPBOX_API_TOKEN,
  MAPBOX_BASE_API_URL,
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "../constants";
import { TStation } from "../types";

export default class GeoService {
  /**
   * Fetches air quality data for a bounding box, if you need station data in an area.
   * @param latNorth The north latitude
   * @param lngWest  The west longitude
   * @param latSouth The south latitude
   * @param lngEast  The east longitude
   */
  static async getStationsWithinBounds(
    latNorth: number,
    lngWest: number,
    latSouth: number,
    lngEast: number,
  ): Promise<any> {
    const url = `${WORLD_AIR_QUALITY_BASE_API_URL}v2/map/bounds/?latlng=${latNorth},${lngWest},${latSouth},${lngEast}&token=${WORLD_AIR_QUALITY_API_TOKEN}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch stations within bounds (status: ${response.status})`,
      );
    }

    return response.json();
  }

  static async searchPlace(query: string): Promise<
    {
      id: string;
      map_id: string;
      text: string;
      place_name: string;
      coordinates: { lat: number; lon: number };
    }[]
  > {
    const url = `${MAPBOX_BASE_API_URL}${encodeURIComponent(query)}.json?access_token=${MAPBOX_API_TOKEN}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch suggestions for query "${query}" (status: ${response.status})`,
      );
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map((feature: any) => ({
      id: feature.id,
      map_id: feature.properties.mapbox_id,
      text: feature.text,
      place_name: feature.place_name,
      coordinates: {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
      },
    }));
  }

  private static async fetchNearestStations(
    lat: number,
    lon: number,
  ): Promise<any> {
    const boundingBox = `${lat - 0.1},${lon - 0.1},${lat + 0.1},${lon + 0.1}`;
    const url = `${WORLD_AIR_QUALITY_BASE_API_URL}v2/map/bounds/?token=${WORLD_AIR_QUALITY_API_TOKEN}&latlng=${boundingBox}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching stations: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error(`API returned an error: ${data.status}`);
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching nearest station:", error);
      return null;
    }
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private static findNearestStation(
    lat: number,
    lon: number,
    stations: any[],
  ): any {
    let nearestStation = null;
    let minDistance = Infinity;

    stations.forEach((station) => {
      const distance = GeoService.calculateDistance(
        lat,
        lon,
        station.lat,
        station.lon,
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    });

    return nearestStation;
  }

  static async getNearestStation(
    lat: number,
    lon: number,
  ): Promise<TStation | null> {
    console.log(`Fetching nearest station around: ${lat}, ${lon}`);
    const stations = await GeoService.fetchNearestStations(lat, lon);
    if (!stations || stations.length === 0) {
      console.error("No stations found in the vicinity.");
      return null;
    }

    const nearestStation = GeoService.findNearestStation(lat, lon, stations);
    console.log("Nearest station:", nearestStation);
    return nearestStation;
  }
}
