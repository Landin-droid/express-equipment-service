import { fetchJson } from "./httpClient.js";

const BASE_URL =
  process.env.WEATHER_API_URL ?? "https://api.open-meteo.com/v1/forecast";

export async function getForecast({ latitude, longitude, days = 3 }) {
  const url = new URL(BASE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
  );
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson(url);

  return data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }));
}
