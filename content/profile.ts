/**
 * Every factual claim on this site comes from here or from content/projects.ts,
 * and every claim in these two files traces back to Part 4 of the build brief.
 *
 * If you want to add something that is not already here, get the fact confirmed
 * first. Harshal has to defend every sentence on this site in an interview, and
 * a plausible-sounding line nobody verified is the one that sinks it.
 *
 * Permanently excluded, never add: the restaurant's name in any context, any
 * phone number, visa or immigration status, InLighnX / InLighn Tech, LinkedIn
 * Learning certificates, or any claim from an older CV that is not written here.
 */

export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  period: string;
  grade?: string;
  modules: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  type: string;
  lines: string[];
}

export const PROFILE = {
  name: "Harshal Abdulla",
  location: "Leixlip, Co. Kildare, Ireland",

  // Part 4.2. The positioning line, first person, no adjectives about himself.
  headline: "I build systems that are not allowed to get money or messages wrong.",

  // Rendered with the project names at full weight and the rest dimmed, so the
  // eye lands on what he built rather than on the connective tissue.
  supporting: {
    lead: "A restaurant till",
    leadRest: " running daily in Co. Kildare, and a ",
    second: "notification pipeline",
    secondRest:
      " that will not lose or duplicate a message. MSc Computer Science, Maynooth, First Class Honours.",
  },

  // Screeners look for this line and its absence costs shortlists. One sentence.
  availability: "Open to associate software engineer roles, Ireland",

  email: "harshalabdulla1999@gmail.com",
  github: "https://github.com/Harshal-Abdulla",
  linkedin: "https://www.linkedin.com/in/harshal-abdulla",

  /**
   * CV download. Part 6.7.
   *
   * ▸ WHEN THE CV CHANGES: drop the new PDF into `public/`, rename it with the
   *   new year and month, and update BOTH `cvPath` and `cvSize` below. The date
   *   lives in the filename on purpose, so a stale file is obvious to anyone who
   *   downloads it. Nothing else needs touching: the nav, the hero and the about
   *   page all read these two values.
   */
  cvPath: "/Harshal-Abdulla-CV-2026-09.pdf",
  cvSize: "110 KB",

  education: [
    {
      degree: "MSc Computer Science (Software Engineering)",
      institution: "Maynooth University",
      location: "Ireland",
      period: "2024 to 2025",
      grade: "First Class Honours",
      modules: [
        "Advanced object-oriented programming, scalable systems",
        "Requirements engineering and system design",
        "Software testing and quality assurance",
        "Software development methodologies and distributed systems",
        "Applied cryptography and deep learning foundations",
        "Individual research project: Sketchpad Retro",
      ],
    },
    {
      degree: "B.Tech Computer Science and Technology",
      institution: "Jyothi Engineering College",
      location: "Kerala, India",
      period: "2019 to 2023",
      modules: [
        "Python programming and scripting",
        "Data structures, algorithms and object-oriented design",
        "Database management systems and relational schema design",
        "Operating systems, systems programming and computer networks",
        "IoT automation training and technical seminars",
      ],
    },
  ] satisfies EducationEntry[],

  experience: [
    {
      role: "Frontend Engineer",
      company: "Cofount Labs LLP",
      period: "September 2023 to August 2024",
      type: "Remote",
      // Asked, 31 Aug 2026. The answer was "whatever a fresher frontend does",
      // which is not something that can go on a page. So this stays as the one
      // factual line the brief permits rather than being padded out with
      // generalities, which read worse than brevity does.
      //
      // Still worth reopening. Anything concrete beats this: a named feature, a
      // framework, the size of the team, whether anyone reviewed the code, or
      // the hardest bug shipped. Two or three real lines here are worth more to
      // an associate application than anything else on the About page.
      lines: [
        "Built and shipped client-facing web applications for agency clients.",
      ],
    },
  ] satisfies ExperienceEntry[],

  certifications: [
    {
      name: "Microsoft Certified: Azure Fundamentals (AZ-900)",
      date: "March 2026",
    },
  ],
};

export const SITE_URL = "https://harshal-abdulla.github.io";
