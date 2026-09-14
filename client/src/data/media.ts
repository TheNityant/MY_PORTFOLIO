export type HoverFeatureMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; poster?: string };

export const experiencePreviewMedia: Record<string, string> = {
  "genai-academy": "/media/experience/genai-academy.svg",
  "robocon-applied": "/media/experience/robocon-applied.svg",
  "iitb-hackathon": "/media/experience/iitb-hackathon.svg",
};

export const experienceFeatureMedia: Record<string, HoverFeatureMedia> = {
  "genai-academy": { kind: "image", src: "/media/experience/genai-academy.svg" },
  "robocon-applied": { kind: "image", src: "/media/experience/robocon-applied.svg" },
  "iitb-hackathon": { kind: "image", src: "/media/experience/iitb-hackathon.svg" },
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
