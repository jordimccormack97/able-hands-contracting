import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function hasAdminSession(req: Request): boolean {
  return !!(req.session as Record<string, unknown>)?.admin;
}

router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body || {};

  if (!name || !contentType) {
    res.status(400).json({ error: "Missing required fields: name, contentType" });
    return;
  }

  if (size && size > 10 * 1024 * 1024) {
    res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json({ uploadURL, objectPath });
  } catch (err) {
    console.error("Upload URL generation failed:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.get("/storage/objects/{*objectPath}", async (req: Request, res: Response) => {
  if (!hasAdminSession(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const objectPath = "/objects/" + (req.params as Record<string, string>).objectPath;

  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(file);

    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
    if (response.headers.get("cache-control")) {
      res.setHeader("Cache-Control", response.headers.get("cache-control")!);
    }

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      pump().catch(() => res.end());
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
    } else {
      console.error("Object download failed:", err);
      res.status(500).json({ error: "Failed to download object" });
    }
  }
});

export default router;
