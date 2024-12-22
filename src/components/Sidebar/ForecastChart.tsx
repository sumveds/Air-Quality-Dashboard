import React, { useEffect } from "react";
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
import { TSelectedStation } from "../../types";

type ForecastChartProps = {
  selectedStationInfo: TSelectedStation;
  activePollutant: string;
  setActivePollutant: (pollutant: string) => void;
  isDarkMode: boolean;
};

/**
 * If you prefer to keep your custom tooltip in the same file, define it here.
 * You can also keep it separate and simply import it.
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

const ForecastChart: React.FC<ForecastChartProps> = ({
  selectedStationInfo,
  activePollutant,
  setActivePollutant,
  isDarkMode,
}) => {
  useEffect(() => {
    if (!selectedStationInfo?.forecast) return;
    if (activePollutant !== "") return;

    if (selectedStationInfo.forecast.daily.no2) {
      setActivePollutant("no2");
    } else if (selectedStationInfo.forecast.daily.pm10) {
      setActivePollutant("pm10");
    } else if (selectedStationInfo.forecast.daily.pm25) {
      setActivePollutant("pm25");
    } else if (selectedStationInfo.forecast.daily.o3) {
      setActivePollutant("o3");
    }
  }, [selectedStationInfo?.forecast, activePollutant]);

  // If the station doesn't have forecast data, just render nothing (or fallback UI).
  if (!selectedStationInfo.forecast?.daily) {
    return null;
  }

  return (
    <div
      className={`p-4 flex flex-col gap-y-4 transition-colors duration-300 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <p className="text-base">Air Quality Forecast</p>
      {/* Tabs */}
      <ul
        className={`flex items-center px-2 py-1 rounded-3xl justify-between gap-x-1 transition-colors duration-300 ${
          isDarkMode ? "bg-[#383841] text-[#9D9DA1]" : "bg-gray-200 text-black"
        }`}
      >
        {selectedStationInfo.forecast.daily.pm25 && (
          <li
            className={`cursor-pointer p-2 text-sm ${
              activePollutant === "pm25" && "bg-black text-white rounded-3xl"
            }`}
            onClick={() => setActivePollutant("pm25")}
          >
            PM 2.5
          </li>
        )}
        {selectedStationInfo.forecast.daily.pm10 && (
          <li
            className={`cursor-pointer p-2 text-sm ${
              activePollutant === "pm10" && "bg-black text-white rounded-3xl"
            }`}
            onClick={() => setActivePollutant("pm10")}
          >
            PM10
          </li>
        )}
        {selectedStationInfo.forecast.daily.no2 && (
          <li
            className={`cursor-pointer p-2 text-sm ${
              activePollutant === "no2" && "bg-black text-white rounded-3xl"
            }`}
            onClick={() => setActivePollutant("no2")}
          >
            NO2
          </li>
        )}
        {selectedStationInfo.forecast.daily.o3 && (
          <li
            className={`cursor-pointer p-2 text-sm ${
              activePollutant === "o3" && "bg-black text-white rounded-3xl"
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
              <Tooltip content={<CustomTooltip />} />
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
  );
};

export default ForecastChart;
