import React, { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps,
} from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

// If `TSelectedStation` is in a separate file, adjust the import accordingly.
type TSelectedStation = {
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

const getAirQualitySituation = (
  aqi: number = 0,
): {
  text: string;
  color: string;
  message: string;
} => {
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

type SidebarProps = {
  selectedStationInfo: TSelectedStation | null;
  activePollutant: string;
  setActivePollutant: (pollutant: string) => void;
  isDarkMode: boolean;
};

/**
 * Properly typed Recharts Custom Tooltip
 * Using `TooltipProps<ValueType, NameType>` so Recharts can pass the right props.
 */
const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length >= 3) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">Avg: {payload[0].value}</p>
        <p className="text-sm text-gray-500">Max: {payload[1].value}</p>
        <p className="text-sm text-gray-500">Min: {payload[2].value}</p>
      </div>
    );
  }
  return null;
};

const Sidebar: React.FC<SidebarProps> = ({
  selectedStationInfo,
  activePollutant,
  setActivePollutant,
  isDarkMode,
}) => {
  const panelContent = useMemo(() => {
    if (!selectedStationInfo) return null;

    const backgroundColors: Record<string, string> = {
      green: "bg-[#9BD74E]",
      red: "bg-red-500",
      orange: "bg-orange-500",
    };

    const { color, text, message } = getAirQualitySituation(
      selectedStationInfo.aqi,
    );

    return (
      <div
        className={`col-span-3 space-y-1.5 h-[95dvh] overflow-scroll transition-colors duration-300 ${
          isDarkMode ? "bg-[#383841] text-white" : "bg-gray-100 text-black"
        }`}
      >
        {/* Top Station Summary */}
        <div
          className={`p-6 flex flex-col gap-y-3 ${backgroundColors[color]} text-black`}
        >
          <a
            href={selectedStationInfo.city.url}
            target="_blank"
            rel="noreferrer"
          >
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

        {/* Forecast Chart */}
        {selectedStationInfo.forecast?.daily && (
          <div
            className={`p-4 flex flex-col gap-y-4 transition-colors duration-300 ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            <p className="text-base">Air Quality Forecast</p>
            {/* Tabs */}
            <ul
              className={`flex items-center px-2 py-1 rounded-3xl justify-between gap-x-1 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#383841] text-[#9D9DA1]"
                  : "bg-gray-200 text-black"
              }`}
            >
              {selectedStationInfo.forecast.daily.pm25 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "pm25" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("pm25")}
                >
                  PM 2.5
                </li>
              )}
              {selectedStationInfo.forecast.daily.pm10 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "pm10" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("pm10")}
                >
                  PM10
                </li>
              )}
              {selectedStationInfo.forecast.daily.no2 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "no2" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("no2")}
                >
                  NO2
                </li>
              )}
              {selectedStationInfo.forecast.daily.o3 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "o3" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("o3")}
                >
                  Ozone
                </li>
              )}
            </ul>

            {/* Chart */}
            <div className="w-full h-[300px]">
              {activePollutant && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    // @ts-expect-error - ignoring mismatched Recharts definitions
                    data={selectedStationInfo.forecast.daily[activePollutant]}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="1 1" />
                    <XAxis
                      dataKey="day"
                      stroke={isDarkMode ? "#fff" : "#000"}
                      tick={{ fill: isDarkMode ? "#fff" : "#000" }}
                      tickLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      axisLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      dy={10}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#fff" : "#000"}
                      tick={{ fill: isDarkMode ? "#fff" : "#000" }}
                      tickLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      axisLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      dx={-10}
                    />
                    {/* 
                      Pass your tooltip component reference here.
                      Recharts will automatically provide (active, payload, label) with correct types.
                    */}
                    <Tooltip content={CustomTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#8884d8" />
                    <Line type="monotone" dataKey="max" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="min" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Attributions */}
            <small className="text-xs">Attributions:</small>
            <ul className="text-xs">
              {selectedStationInfo.attributions.map((attr, idx) => (
                <li key={idx} className="flex items-center gap-x-2">
                  {attr.logo && (
                    <img
                      src={`https://aqicn.org/images/feeds/${attr.logo}`}
                      width={20}
                      height={20}
                      alt="logo"
                    />
                  )}
                  <small>
                    <a href={attr.url} target="_blank" rel="noreferrer">
                      {attr.name}
                    </a>
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }, [selectedStationInfo, activePollutant, isDarkMode]);

  // Placeholder if no station is selected
  return (
    panelContent || (
      <div
        className={`col-span-3 flex items-center justify-center h-[95dvh] transition-colors duration-300 ${
          isDarkMode ? "bg-[#383841] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <p>No station selected yet.</p>
      </div>
    )
  );
};

export default Sidebar;
