import { getForecast } from "./weather/forecastApi.js";
import {
  HttpError as WeatherHttpError,
  TimeoutError,
} from "./weather/httpClient.js";
import { HttpError } from "../errors/httpError.js";
import { weatherConfig } from "../config/weatherConfig.js";

function isSuitable(day) {
  return (
    day.precipitation <= weatherConfig.maxPrecipitationMm &&
    day.windSpeedMax < weatherConfig.maxWindSpeedKmh
  );
}

async function getForecastForLocation({ lat, lon }, days = 3) {
  let forecast;
  try {
    forecast = await getForecast({ latitude: lat, longitude: lon, days });
  } catch (err) {
    if (err instanceof TimeoutError) {
      throw new HttpError(
        503,
        "WEATHER_TIMEOUT",
        "Погодный сервис не ответил вовремя. Попробуйте позже.",
      );
    }
    if (err instanceof WeatherHttpError) {
      throw new HttpError(
        503,
        "WEATHER_UNAVAILABLE",
        "Погодный сервис временно недоступен.",
      );
    }
    throw new HttpError(
      503,
      "WEATHER_UNAVAILABLE",
      "Не удалось получить прогноз погоды.",
    );
  }

  return forecast.map((day) => ({
    ...day,
    suitableForOutdoorWork: isSuitable(day),
  }));
}

export default { getForecastForLocation };
