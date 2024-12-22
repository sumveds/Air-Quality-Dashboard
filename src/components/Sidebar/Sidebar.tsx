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
import { TSelectedStation } from "../../types";
import AirQualityInfo from "./AirQualityInfo";
import ForecastChart from "./ForecastChart";

type SidebarProps = {
  selectedStationInfo: TSelectedStation | null;
  activePollutant: string;
  setActivePollutant: (pollutant: string) => void;
  isDarkMode: boolean;
};

// CustomTooltip left as is
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

    return (
      <div
        className={`col-span-3 space-y-1.5 h-[95dvh] overflow-scroll transition-colors duration-300 ${
          isDarkMode ? "bg-[#383841] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <AirQualityInfo
          selectedStationInfo={selectedStationInfo}
          isDarkMode={isDarkMode}
        />
        <ForecastChart
          selectedStationInfo={selectedStationInfo}
          activePollutant={activePollutant}
          setActivePollutant={setActivePollutant}
          isDarkMode={isDarkMode}
        />
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
