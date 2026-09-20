import { ValidationError } from "../errors/ValidationError.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));
      return next(new ValidationError("Некорректные данные запроса", details));
    }

    req[source] = result.data;
    next();
  };
}
