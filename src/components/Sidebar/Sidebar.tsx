import React, { useMemo } from "react";
import { TSelectedStation } from "../../types";
import AirQualityInfo from "./AirQualityInfo";
import ForecastChart from "./ForecastChart";

type SidebarProps = {
  selectedStationInfo: TSelectedStation | null;
  activePollutant: string;
  setActivePollutant: (pollutant: string) => void;
  isDarkMode: boolean;
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
