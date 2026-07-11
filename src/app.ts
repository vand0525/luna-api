import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/errors";
import * as request from "./middleware/requests";
import storiesRouter from "./features/stories/stories.routes";

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(request.logWithBody);
} else {
  app.use(request.log);
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/stories", storiesRouter);

app.use(errorMiddleware);

export default app;
