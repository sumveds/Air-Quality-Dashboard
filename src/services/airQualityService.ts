const WORLD_AIR_QUALITY_BASE_API_URL = "https://api.waqi.info/";
const WORLD_AIR_QUALITY_API_TOKEN = "e4e922828e41a73cfe4645c0db52103229422e8a";

export default class AirQualityService {
  /**
   * Fetches air quality data for a specific station based on its UID.
   * @param stationUID The unique ID of the station.
   * @returns A Promise resolving to the JSON data from the API.
   */
  static async getAirQuality(stationUID: string): Promise<any> {
    const url = `${WORLD_AIR_QUALITY_BASE_API_URL}feed/@${stationUID}/?token=${WORLD_AIR_QUALITY_API_TOKEN}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch station info (status: ${response.status})`,
      );
    }

    return response.json();
  }

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
