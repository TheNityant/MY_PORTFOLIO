import { portfolioAsset } from "@/lib/portfolioAssets";

export type HoverFeatureMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster?: string };

export const experiencePreviewMedia: Record<string, string> = {
  "genai-academy": portfolioAsset("EXPERIENCE AND BLOGS", "gen-ai-academy.png"),
  "robocon-applied": portfolioAsset("EXPERIENCE AND BLOGS", "robocon.jpg"),
  "iitd-hackathon": portfolioAsset("EXPERIENCE AND BLOGS", "IIT Delhi.png"),
};

export const experienceFeatureMedia: Record<string, HoverFeatureMedia> = {
  "genai-academy": { kind: "image", src: portfolioAsset("EXPERIENCE AND BLOGS", "gen-ai-academy.png") },
  "robocon-applied": { kind: "image", src: portfolioAsset("EXPERIENCE AND BLOGS", "robocon.jpg") },
  "iitd-hackathon": {
    kind: "image",
    src: portfolioAsset("EXPERIENCE AND BLOGS", "IIT Delhi.png"),
  },
};

export const writingPreviewMedia: Record<string, string> = {
  "llm-engineering-notebook": "/media/writing/llm-engineering-notebook.svg",
};

export const writingFeatureMedia: Record<string, HoverFeatureMedia> = {
  "llm-engineering-notebook": { kind: "image", src: "/media/writing/llm-engineering-notebook.svg" },
};

export const fallbackExperiencePreview = "/media/experience/placeholder.svg";
export const fallbackWritingPreview = "/media/writing/placeholder.svg";

export const fallbackExperienceFeatureMedia: HoverFeatureMedia = {
  kind: "image",
  src: fallbackExperiencePreview,
};

export const fallbackWritingFeatureMedia: HoverFeatureMedia = {
  kind: "image",
  src: fallbackWritingPreview,
};
