import React from "react";

type HeaderProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header
      className={`h-14 flex items-center justify-between px-6 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <p>Global Real-Time Air Quality Monitoring Dashboard</p>
      <button
        onClick={toggleTheme}
        className={`px-4 py-2 rounded-md ${
          isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
        } hover:opacity-90 transition`}
      >
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
