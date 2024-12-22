import { useMemo } from "react";
import { categorizeAQI } from "../utils/airQualityUtils";
import { getAQIColor } from "../utils/colorUtils";

interface AirQualitySituation {
  text: string;
  color: string;
  message: string;
}

/**
 * A custom hook that takes an AQI value and returns
 * information about the air quality situation (text, color, message).
 */
export function useAirQuality(aqi: number = 0): AirQualitySituation {
  return useMemo(() => {
    const { category, message } = categorizeAQI(aqi);
    const color = getAQIColor(aqi);
    console.log("Color:", color);
    return {
      text: category,
      color,
      message,
    };
  }, [aqi]);
}

/*export function useAirQuality(aqi: number = 0): AirQualitySituation {
  return useMemo(() => {
    if (aqi <= 50) {
      return {
        text: "Good",
        color: "green",
        message: `An AQI of ${aqi}µg/m³ indicates that the air quality is healthy.`,
      };
    } else if (aqi > 50 && aqi <= 100) {
      return {
        text: "Moderate",
        color: "orange",
        message: `An AQI of ${aqi}µg/m³ indicates that the air quality is moderate.`,
      };
    } else {
      return {
        text: "Poor",
        color: "red",
        message: `An AQI of ${aqi}µg/m³ indicates that the air quality is unhealthy.`,
      };
    }
  }, [aqi]);
}*/
