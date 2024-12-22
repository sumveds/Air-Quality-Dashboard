export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "green"; // Good
  if (aqi <= 100) return "orange"; // Moderate
  // if (aqi <= 150) return "#FF9900"; // Unhealthy for sensitive groups
  // if (aqi <= 200) return "#FF0000"; // Unhealthy
  // if (aqi <= 300) return "#99004C"; // Very Unhealthy
  return "red"; // Hazardous
};
