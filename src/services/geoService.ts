import {
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
}
