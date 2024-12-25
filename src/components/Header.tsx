import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import PlaceSearch from "./PlaceSearch";

type HeaderProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  onSearch: (lat: number, lon: number) => void;
};

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  toggleSidebar,
  onSearch,
}) => {
  return (
    <header
      className={`p-4 flex items-center justify-between w-full ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
      }`}
    >
      <button
        className="md:hidden text-2xl sm:text-[2.5rem]"
        onClick={toggleSidebar}
      >
        ☰
      </button>
      <h1 className="text-lg font-bold hidden md:block">Air Quality App</h1>
      <div className="flex-1 max-w-[500px] mx-4">
        {/* Ensures the PlaceSearch has space to grow */}
        <PlaceSearch onSearch={onSearch} isDarkMode={isDarkMode} />
      </div>
      <button onClick={toggleTheme} className="text-2xl">
        {isDarkMode ? (
          <FiSun title="Switch to Light Mode" />
        ) : (
          <FiMoon title="Switch to Dark Mode" />
        )}
      </button>
    </header>
  );
};

export default Header;
