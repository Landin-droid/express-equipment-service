import { afterAll } from "@jest/globals";
import { sequelize } from "../src/database/sequelize.js";

afterAll(async () => {
  await sequelize.close();
});
