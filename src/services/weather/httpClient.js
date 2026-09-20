const DEFAULT_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 5000;

export class HttpError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.cause = cause;
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

export async function fetchJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new TimeoutError(
        `Превышен таймаут запроса (${timeoutMs} мс): ${url}`,
      );
    }
    throw new HttpError(`Сетевая ошибка при запросе: ${url}`, { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const statusType = response.status >= 500 ? "сервера" : "запроса";
    throw new HttpError(
      `Ошибка ${statusType} (${response.status}) при запросе: ${url}`,
      {
        status: response.status,
      },
    );
  }

  try {
    return await response.json();
  } catch (err) {
    throw new HttpError(`Некорректный JSON в ответе: ${url}`, { cause: err });
  }
}
