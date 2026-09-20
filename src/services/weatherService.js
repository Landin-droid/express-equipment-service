import { getForecast } from "./weather/forecastApi.js";
import {
  HttpError as WeatherHttpError,
  TimeoutError,
} from "./weather/httpClient.js";
import { ServiceUnavailableError } from "../errors/ServiceUnavailableError.js";
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
      throw new ServiceUnavailableError(
        "WEATHER_TIMEOUT",
        "Погодный сервис не ответил вовремя. Попробуйте позже.",
      );
    }
    if (err instanceof WeatherHttpError) {
      throw new ServiceUnavailableError(
        "WEATHER_UNAVAILABLE",
        "Погодный сервис временно недоступен.",
      );
    }
    throw new ServiceUnavailableError(
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
