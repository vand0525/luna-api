import { Router } from "express";
import * as validate from "./stories.validation";
import * as service from "./stories.service"

const router = Router();

// generate story
router.post("/generate", async (req, res, next) => {
  try {
    const validated = validate.generate(req.body);
    const story = await service.generate(validated);
    res.status(201).json(story); 
  } catch (e) {
    next(e);
  }
});

export default router;
