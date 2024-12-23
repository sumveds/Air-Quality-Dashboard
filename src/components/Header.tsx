import React from "react";

type HeaderProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
};

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  toggleSidebar,
}) => {
  return (
    <header
      className={`p-4 flex items-center justify-between ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
      }`}
    >
      {/* Sidebar Toggle Button for Mobile */}
      <button className="md:hidden" onClick={toggleSidebar}>
        ☰
      </button>

      <h1 className="text-lg font-bold">Air Quality App</h1>

      {/* Theme Toggle Button */}
      <button onClick={toggleTheme}>
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
