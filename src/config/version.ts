export interface VersionCompatibility {
  xform2lstsv: string;
  limeSurvey: {
    min: string;
    max: string;
    tested: string[];
  };
  notes?: string;
}

export const VERSION_COMPATIBILITY: VersionCompatibility = {
  xform2lstsv: "1.0.0", // This will be updated automatically
  limeSurvey: {
    min: "6.16.0",
    max: "6.16.4",
    tested: ["6.16.4", "6.16.0"]
  },
  notes: "Full support for LimeSurvey 6.16.4+ features"
};