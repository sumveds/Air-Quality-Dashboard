import {
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "../constants";

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
}
