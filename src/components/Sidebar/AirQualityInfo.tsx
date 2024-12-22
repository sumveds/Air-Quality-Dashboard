import React from "react";
import { TSelectedStation } from "../../types";

type AirQualityInfoProps = {
  selectedStationInfo: TSelectedStation;
  isDarkMode: boolean;
};

/**
 * If you keep "getAirQualitySituation" and "backgroundColors" logic
 * in `AirQualityInfo`, you don’t have to pass them down as props.
 */
const getAirQualitySituation = (
  aqi: number = 0,
): { text: string; color: string; message: string } => {
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
};

const backgroundColors: Record<string, string> = {
  green: "bg-[#9BD74E]",
  red: "bg-red-500",
  orange: "bg-orange-500",
};

const AirQualityInfo: React.FC<AirQualityInfoProps> = ({
  selectedStationInfo,
  isDarkMode,
}) => {
  const { color, text, message } = getAirQualitySituation(
    selectedStationInfo.aqi,
  );

  return (
    <>
      <div
        className={`p-6 flex flex-col gap-y-3 ${backgroundColors[color]} text-black`}
      >
        <a href={selectedStationInfo.city.url} target="_blank" rel="noreferrer">
          <p className="text-base">{selectedStationInfo.city.name}</p>
        </a>
        <p className="text-3xl">{text}</p>
        <p className="text-3xl">
          AQI <span className="font-semibold">{selectedStationInfo.aqi}</span>
        </p>
        <p className="text-base">{message}</p>
      </div>

      {/* Main Pollutants */}
      <div
        className={`p-4 flex flex-col gap-y-4 transition-colors duration-300 ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <small>Last updated: {selectedStationInfo.time.s}</small>
        <p className="text-base">Main Pollutants</p>
        <ul className="flex items-center justify-between gap-x-1">
          {/* PM 2.5 */}
          {selectedStationInfo.iaqi.pm25 && (
            <li className="flex flex-col gap-y-2 items-center">
              <span
                className={`text-base px-4 py-1 rounded-2xl ${
                  isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                }`}
              >
                {selectedStationInfo.iaqi.pm25.v}
              </span>
              <span
                className={`text-xs font-light ${
                  isDarkMode ? "text-white" : "text-[#1A1A1D]"
                }`}
              >
                PM 2.5
              </span>
            </li>
          )}
          {/* PM 10 */}
          {selectedStationInfo.iaqi.pm10 && (
            <li className="flex flex-col gap-y-2 items-center">
              <span
                className={`text-base px-4 py-1 rounded-2xl ${
                  isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                }`}
              >
                {selectedStationInfo.iaqi.pm10.v}
              </span>
              <span
                className={`text-xs font-light ${
                  isDarkMode ? "text-white" : "text-[#1A1A1D]"
                }`}
              >
                PM 10
              </span>
            </li>
          )}
          {/* NO2 */}
          {selectedStationInfo.iaqi.no2 && (
            <li className="flex flex-col gap-y-2 items-center">
              <span
                className={`text-base px-4 py-1 rounded-2xl ${
                  isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                }`}
              >
                {selectedStationInfo.iaqi.no2.v}
              </span>
              <span
                className={`text-xs font-light ${
                  isDarkMode ? "text-white" : "text-[#1A1A1D]"
                }`}
              >
                NO2
              </span>
            </li>
          )}
          {/* Ozone */}
          {selectedStationInfo.iaqi.o3 && (
            <li className="flex flex-col gap-y-2 items-center">
              <span
                className={`text-base px-4 py-1 rounded-2xl ${
                  isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                }`}
              >
                {selectedStationInfo.iaqi.o3.v}
              </span>
              <span
                className={`text-xs font-light ${
                  isDarkMode ? "text-white" : "text-[#1A1A1D]"
                }`}
              >
                Ozone
              </span>
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

export default AirQualityInfo;
