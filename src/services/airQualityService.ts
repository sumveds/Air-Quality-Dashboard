import {
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "../constants";
import GeoService from "./geoService";

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
   * Fetches air quality data by geographic coordinates (latitude & longitude).
   * @param latitude  The latitude of the location.
   * @param longitude The longitude of the location.
   */
  static async getAirQualityByCoords(
    latitude: number,
    longitude: number,
  ): Promise<any> {
    const url = `${WORLD_AIR_QUALITY_BASE_API_URL}feed/geo:${latitude};${longitude}/?token=${WORLD_AIR_QUALITY_API_TOKEN}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch coords-based AQI (status: ${response.status})`,
      );
    }

    return response.json();
  }

  static async getAirQualityOfNearestStation(
    latitude: number,
    longitude: number,
  ): Promise<any> {
    const nearestStation = await GeoService.getNearestStation(
      latitude,
      longitude,
    );
    if (nearestStation) {
      const stationInfo = await AirQualityService.getAirQuality(
        nearestStation?.uid,
      );
      return stationInfo;
    } else {
      // TODO Throw an error
      console.log("getAirQualityOfNearestStation: No nearest station found!!!");
    }
  }
}
