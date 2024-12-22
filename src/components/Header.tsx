import React from "react";

type HeaderProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header
      className={`font-sans h-14 flex items-center justify-between px-6 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Apply your application font to the text */}
      <p className="font-sans">
        Global Real-Time Air Quality Monitoring Dashboard
      </p>

      {/* Add vertical margin (my-2) to create space, and the same font utility */}
      <button
        onClick={toggleTheme}
        className={`my-2 px-4 py-2 rounded-md font-sans ${
          isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
        } hover:opacity-90 transition`}
      >
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
