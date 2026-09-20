export const weatherConfig = {
  maxPrecipitationMm: Number(process.env.WEATHER_MAX_PRECIPITATION_MM) || 0,
  maxWindSpeedKmh: Number(process.env.WEATHER_MAX_WIND_SPEED_KMH) || 20,
};
