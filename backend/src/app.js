const path = require("node:path");

const cors = require("cors");
const express = require("express");

const env = require("./config/env");
const createMainRouter = require("./routes");
const ApiError = require("./utils/ApiError");
const errorMiddleware = require("./middlewares/error_middleware");
const logMiddleware = require("./middlewares/log_middleware");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  "/uploads/products",
  express.static(path.resolve(process.cwd(), env.uploadDir)),
);

app.use(logMiddleware);

const mainRouter = createMainRouter();

app.use("/", mainRouter);
app.use("/api", mainRouter);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found", "ROUTE_NOT_FOUND"));
});

app.use(errorMiddleware);

module.exports = app;
