export interface Opportunity {
  id: string;
  category: string;
  title: string;
  description: string;
  audience: string;
  firstStep: string;
  link?: { label: string; url: string };
  studentsOnly?: boolean;
}

export const opportunities: readonly Opportunity[] = [
  {
    id: "stipendiumplus",
    category: "Stipendien",
    title: "Begabtenförderungswerke",
    description:
      "Staatlich unterstützte Werke fördern Studierende mit unterschiedlichen fachlichen, gesellschaftlichen und persönlichen Profilen.",
    audience:
      "Interessant, wenn du studieren möchtest oder studierst und dich mit den Profilen der Werke auseinandersetzen willst.",
    firstStep: "Die Werke vergleichen und die offiziellen Auswahlkriterien lesen.",
    link: { label: "StipendiumPlus", url: "https://www.stipendiumplus.de/" },
  },
  {
    id: "deutschlandstipendium",
    category: "Stipendien",
    title: "Deutschlandstipendium",
    description:
      "Viele Hochschulen vergeben dieses Förderprogramm in eigenen Auswahlverfahren.",
    audience:
      "Interessant für Studieninteressierte und Studierende; die konkrete Vergabe organisiert die jeweilige Hochschule.",
    firstStep:
      "Auf der offiziellen Website und bei deiner Hochschule prüfen, ob und wie sie teilnimmt.",
    link: {
      label: "Offizielle Programmseite",
      url: "https://www.deutschlandstipendium.de/",
    },
  },
  {
    id: "bafoeg",
    category: "Finanzierung",
    title: "BAföG und Studienfinanzierung",
    description:
      "BAföG ist ein staatliches Instrument der Ausbildungsförderung. Ergänzend gibt es weitere seriöse Finanzierungsbausteine.",
    audience:
      "Interessant, wenn du deine Studienfinanzierung planst oder sich deine finanzielle Situation verändert hat.",
    firstStep:
      "Das zuständige Amt für Ausbildungsförderung finden und eine Beratung nutzen.",
    link: { label: "Offizielles BAföG-Portal", url: "https://www.bafög.de/" },
  },
  {
    id: "beratung",
    category: "Beratung",
    title: "Hochschulberatung und Studierendenwerke",
    description:
      "Studienberatungen helfen bei fachlichen und organisatorischen Fragen; Studierendenwerke bieten soziale und psychologische Beratung.",
    audience:
      "Interessant in jeder Phase – auch wenn du noch nicht genau weißt, welche Stelle zuständig ist.",
    firstStep:
      "Die zentrale Studienberatung deiner Hochschule oder ein Studierendenwerk in deiner Region suchen.",
    link: {
      label: "Deutsches Studierendenwerk",
      url: "https://www.studierendenwerke.de/",
    },
  },
  {
    id: "praxis",
    category: "Beruf & Praxis",
    title: "Praktika, HiWi- und Werkstudierendentätigkeiten",
    description:
      "Praxiserfahrungen können dir helfen, Arbeitsfelder kennenzulernen und Fähigkeiten auszuprobieren.",
    audience:
      "Interessant für Studierende, die ein Berufsfeld erkunden oder ihr Studium praktisch ergänzen möchten.",
    firstStep:
      "Beim Career Service und auf den offiziellen Stellenportalen deiner Hochschule beginnen.",
    link: {
      label: "Bundesagentur für Arbeit",
      url: "https://www.arbeitsagentur.de/bildung/studium",
    },
    studentsOnly: true,
  },
];
