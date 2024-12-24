import {
  MAPBOX_API_TOKEN,
  MAPBOX_BASE_API_URL,
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "../constants";

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
}
