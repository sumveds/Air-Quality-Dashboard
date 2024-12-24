import React from "react";
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
      className={`p-4 flex items-center justify-between ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
      }`}
    >
      <button
        className="md:hidden text-2xl sm:text-[2.5rem]"
        onClick={toggleSidebar}
      >
        ☰
      </button>
      <h1 className="text-lg font-bold xs:hidden">Air Quality App</h1>
      <PlaceSearch onSearch={onSearch} isDarkMode={isDarkMode} />
      <button onClick={toggleTheme}>
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
