import type { RequestHandler } from "express";

export const log: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    console.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      "HTTP request"
    );
  });

  next();
}

export const logWithBody: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    console.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        body: JSON.stringify(req.body)
      },
      "HTTP request"
    );
  });

  next();
}