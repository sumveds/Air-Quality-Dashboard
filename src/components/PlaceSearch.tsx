import React, { useState, useEffect } from "react";
import Select from "react-select";
import GeoService from "../services/geoService";

type PlaceSearchProps = {
  onSearch: (lat: number, lon: number) => void;
  isDarkMode?: boolean;
};

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onSearch, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchEnabled, setFetchEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<
    {
      text: string;
      place_name: string;
      coordinates: { lat: number; lon: number };
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{
    label: string;
    value: { lat: number; lon: number };
  } | null>(null);

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
    if (fetchEnabled) {
      const debounceTimeout = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    }
  }, [searchQuery, fetchEnabled]);

  const options = suggestions.map((suggestion) => ({
    label: suggestion.place_name,
    value: suggestion.coordinates,
  }));

  return (
    <div className="place-search w-full">
      <Select
        options={options}
        onInputChange={(inputValue, action) => {
          if (action.action === "input-change") {
            setSearchQuery(inputValue);
            setFetchEnabled(true);
          }
        }}
        onChange={(option) => {
          if (option) {
            const { lat, lon } = option.value;
            setSelectedOption(null); // Clear the selected option
            setSearchQuery(""); // Clear the input field
            onSearch(lat, lon); // Trigger the search callback
          }
        }}
        value={selectedOption} // Controlled value for the select
        placeholder="Search location..."
        isLoading={isLoading}
        isClearable
        classNamePrefix="react-select"
        styles={{
          control: (provided) => ({
            ...provided,
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
            borderColor: "#ccc",
            width: "100%",
            maxWidth: "100%",
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
          }),
          singleValue: (provided) => ({
            ...provided,
            color: isDarkMode ? "#ffffff" : "#000000",
          }),
          input: (provided) => ({
            ...provided,
            color: isDarkMode ? "#ffffff" : "#000000", // Ensures input text is visible
          }),
          placeholder: (provided) => ({
            ...provided,
            color: isDarkMode ? "#9ca3af" : "#6b7280", // Lighter color for placeholder text
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused
              ? isDarkMode
                ? "#374151" // Darker shade for focused item in dark mode
                : "#f0f0f0" // Lighter shade for focused item in light mode
              : isDarkMode
                ? "#1f2937" // Default dark mode background
                : "#ffffff", // Default light mode background
            color: isDarkMode ? "#ffffff" : "#000000", // Text color for the option
          }),
        }}
        className="w-full"
      />
    </div>
  );
};

export default PlaceSearch;
