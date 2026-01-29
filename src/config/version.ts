export interface VersionCompatibility {
  xform2lstsv: string;
  limeSurvey: {
    tested: string[];
  };
  notes?: string;
}

export const VERSION_COMPATIBILITY: VersionCompatibility = {
  xform2lstsv: "1.0.0", // This will be updated automatically
  limeSurvey: {
    tested: [
      "6.16.0", "6.16.1", "6.16.2", "6.16.3", "6.16.4"
    ]
  },
  notes: "Full support for LimeSurvey 6.16.0+ features"
};