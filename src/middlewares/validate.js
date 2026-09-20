import { ValidationError } from "../errors/ValidationError.js";

export function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};

    for (const part of ["body", "query", "params"]) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part]);
      if (!result.success) {
        return next(new ValidationError(result.error));
      }
      req.valid[part] = result.data;
    }

    next();
  };
}
