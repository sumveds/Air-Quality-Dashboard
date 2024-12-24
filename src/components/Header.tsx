import React, { useState, useEffect } from "react";
import GeoService from "../services/geoService";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    {
      text: string;
      place_name: string;
      coordinates: { lat: number; lon: number };
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSuggestion = suggestions.find(
      (suggestion) => suggestion.text === searchQuery,
    );
    if (selectedSuggestion) {
      onSearch(
        selectedSuggestion.coordinates.lat,
        selectedSuggestion.coordinates.lon,
      );
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await GeoService.searchPlace(query);
      setSuggestions(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // Debounce API calls
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

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
      <h1 className="text-lg font-bold">Air Quality App</h1>
      <form onSubmit={handleSearch} className="flex items-center relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="p-2 border rounded-lg mr-2"
        />
        {isLoading && (
          <div className="absolute top-full mt-2 text-sm">Loading...</div>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg w-full z-10">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSearchQuery(suggestion.text);
                  setSuggestions([]);
                  onSearch(
                    suggestion.coordinates.lat,
                    suggestion.coordinates.lon,
                  );
                }}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Search
        </button>
      </form>
      <button onClick={toggleTheme}>
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </header>
  );
};

export default Header;
