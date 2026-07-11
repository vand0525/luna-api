import { Router } from "express";
import * as validate from "./stories.validation";
import * as service from "./stories.service"

const router = Router();

// generate story
router.post("/generate", async (req, res, next) => {
  try {
    const validated = validate.generate(req.body);

    const audioStream = await service.generate(validated);

    res.setHeader("Content-Type", "audio/mpeg");

    for await (const chunk of audioStream){
      res.write(chunk)
    }

    res.end()
  } catch (e) {
    next(e);
  }
});

export default router;
