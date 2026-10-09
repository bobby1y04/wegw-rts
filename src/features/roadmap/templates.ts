import type { RoadmapLink } from "../../db/schema";
import type { EducationPhase } from "../profile/schema";

export type { EducationPhase } from "../profile/schema";

export interface RoadmapChecklistTemplate {
  id: string;
  text: string;
}

export interface RoadmapTaskTemplate {
  id: string;
  version: number;
  phase: EducationPhase;
  title: string;
  description: string;
  category: string;
  sortOrder: number;
  checklist: readonly RoadmapChecklistTemplate[];
  links: readonly RoadmapLink[];
}

export const ROADMAP_TEMPLATE_VERSION = 1;

const beforeStudyTemplates = [
  {
    id: "vor-studium-interessen-ziele",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Studieninteressen und Ziele sammeln",
    description:
      "Halte fest, was dich interessiert und was du dir von einem Studium wünschst. Das gibt deiner Suche eine klare Richtung.",
    category: "Studienwahl",
    sortOrder: 10,
    checklist: [
      {
        id: "interessen-notieren",
        text: "Themen, Schulfächer und Tätigkeiten notieren, die dir Freude machen",
      },
      {
        id: "ziele-notieren",
        text: "Persönliche und berufliche Ziele in eigenen Worten festhalten",
      },
      {
        id: "kriterien-priorisieren",
        text: "Drei wichtige Kriterien für deinen Studienweg priorisieren",
      },
    ],
    links: [
      {
        label: "Hochschulkompass: Studium-Interessentest",
        url: "https://www.hochschulkompass.de/studium-interessentest.html",
      },
    ],
  },
  {
    id: "vor-studium-studiengaenge-recherchieren",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Geeignete Studiengänge recherchieren",
    description:
      "Vergleiche mehrere Studiengänge anhand ihrer Inhalte, Abschlüsse und Studienorte, bevor du dich festlegst.",
    category: "Studienwahl",
    sortOrder: 20,
    checklist: [
      {
        id: "suchbegriffe-sammeln",
        text: "Passende Fachbegriffe und Studienrichtungen aus deinen Interessen ableiten",
      },
      {
        id: "angebote-vergleichen",
        text: "Mindestens drei Studienangebote in einer kurzen Liste vergleichen",
      },
      {
        id: "modulinhalte-pruefen",
        text: "Modulübersichten auf den offiziellen Hochschulseiten ansehen",
      },
    ],
    links: [
      {
        label: "Hochschulkompass: Studiengangsuche",
        url: "https://www.hochschulkompass.de/studium/suche.html",
      },
    ],
  },
  {
    id: "vor-studium-zulassung-pruefen",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Zulassungsvoraussetzungen prüfen",
    description:
      "Prüfe für deine Favoriten direkt bei der jeweiligen Hochschule, welche Voraussetzungen gelten.",
    category: "Bewerbung",
    sortOrder: 30,
    checklist: [
      {
        id: "voraussetzungen-offiziell",
        text: "Zulassungsseite jedes favorisierten Studiengangs öffnen",
      },
      {
        id: "nachweise-notieren",
        text: "Benötigte Abschlüsse, Sprachkenntnisse und weitere Nachweise notieren",
      },
      {
        id: "unklarheiten-klaeren",
        text: "Offene Fragen bei der offiziellen Studienberatung klären",
      },
    ],
    links: [
      {
        label: "Hochschulkompass: Zulassung",
        url: "https://www.hochschulkompass.de/studium/bewerbung-zulassung.html",
      },
    ],
  },
  {
    id: "vor-studium-bewerbungswege-fristen",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Bewerbungswege und Fristen finden",
    description:
      "Ermittle den offiziellen Bewerbungsweg und prüfe Fristen direkt bei der Hochschule. Wegwärts setzt hier bewusst keine ungeprüfte Frist.",
    category: "Bewerbung",
    sortOrder: 40,
    checklist: [
      {
        id: "bewerbungsweg-ermitteln",
        text: "Prüfen, ob die Bewerbung über Hochschule, Hochschulstart oder ein anderes offizielles Portal läuft",
      },
      {
        id: "fristen-pruefen",
        text: "Fristen auf der offiziellen Seite prüfen und selbst im Kalender eintragen",
      },
      {
        id: "konto-vorbereiten",
        text: "Erforderliches Bewerbungskonto rechtzeitig anlegen",
      },
    ],
    links: [
      {
        label: "Hochschulstart",
        url: "https://www.hochschulstart.de/",
      },
    ],
  },
  {
    id: "vor-studium-unterlagen",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Bewerbungsunterlagen zusammenstellen",
    description:
      "Sammle die offiziell geforderten Unterlagen und prüfe, in welcher Form sie eingereicht werden müssen.",
    category: "Bewerbung",
    sortOrder: 50,
    checklist: [
      {
        id: "unterlagenliste",
        text: "Individuelle Unterlagenliste aus den offiziellen Anforderungen erstellen",
      },
      {
        id: "dokumente-beschaffen",
        text: "Zeugnisse und weitere geforderte Nachweise beschaffen",
      },
      {
        id: "formate-pruefen",
        text: "Dateiformate, Beglaubigungen und Einreichungsweg prüfen",
      },
    ],
    links: [],
  },
  {
    id: "vor-studium-finanzierung",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "BAföG und weitere Finanzierung prüfen",
    description:
      "Verschaffe dir früh einen Überblick über mögliche Finanzierungsbausteine und lass dich bei Unsicherheiten beraten.",
    category: "Finanzierung",
    sortOrder: 60,
    checklist: [
      {
        id: "budget-schaetzen",
        text: "Monatliche Einnahmen und typische Ausgaben grob gegenüberstellen",
      },
      {
        id: "bafoeg-informieren",
        text: "Offizielle BAföG-Informationen und zuständiges Amt prüfen",
      },
      {
        id: "beratung-planen",
        text: "Bei Bedarf eine unabhängige Finanzierungsberatung vormerken",
      },
    ],
    links: [
      {
        label: "Offizielles BAföG-Portal",
        url: "https://www.bafög.de/",
      },
      {
        label: "Deutsches Studierendenwerk: Studienfinanzierung",
        url: "https://www.studierendenwerke.de/themen/studienfinanzierung",
      },
    ],
  },
  {
    id: "vor-studium-stipendien",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Stipendien recherchieren",
    description:
      "Informiere dich über unterschiedliche Förderwerke und Programme. Prüfe Bedingungen und Fristen immer bei der jeweiligen offiziellen Stelle.",
    category: "Stipendien",
    sortOrder: 70,
    checklist: [
      {
        id: "programme-ansehen",
        text: "Begabtenförderungswerke und Deutschlandstipendium als Einstieg ansehen",
      },
      {
        id: "bedingungen-vergleichen",
        text: "Voraussetzungen und Auswahlverfahren auf offiziellen Seiten vergleichen",
      },
      {
        id: "naechster-schritt",
        text: "Für ein passendes Programm den ersten Bewerbungsschritt notieren",
      },
    ],
    links: [
      {
        label: "StipendiumPlus",
        url: "https://www.stipendiumplus.de/",
      },
      {
        label: "Deutschlandstipendium",
        url: "https://www.deutschlandstipendium.de/",
      },
    ],
  },
  {
    id: "vor-studium-einschreibung-start",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "vor_dem_studium",
    title: "Einschreibung und Studienstart vorbereiten",
    description:
      "Nach einer Zusage folgen Einschreibung und organisatorische Schritte. Nutze dafür die offiziellen Hinweise deiner Hochschule.",
    category: "Studienalltag",
    sortOrder: 80,
    checklist: [
      {
        id: "einschreibung-pruefen",
        text: "Einschreibeschritte und einzureichende Nachweise offiziell prüfen",
      },
      {
        id: "zugang-aktivieren",
        text: "Hochschulzugang, E-Mail und Lernplattform aktivieren",
      },
      {
        id: "termine-finden",
        text: "Orientierungsangebote und Semesterstart im offiziellen Kalender finden",
      },
    ],
    links: [],
  },
] as const satisfies readonly RoadmapTaskTemplate[];

const duringStudyTemplates = [
  {
    id: "im-studium-verlaufsplan-modulhandbuch",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Studienverlaufsplan und Modulhandbuch finden",
    description:
      "Diese Dokumente zeigen dir, welche Module vorgesehen sind und welche Inhalte und Leistungen dazugehören.",
    category: "Studienalltag",
    sortOrder: 10,
    checklist: [
      {
        id: "dokumente-finden",
        text: "Aktuellen Studienverlaufsplan und aktuelles Modulhandbuch finden",
      },
      {
        id: "semester-module",
        text: "Für dein Semester vorgesehene Module markieren",
      },
      {
        id: "offene-fragen",
        text: "Unklare Modulbegriffe für die Fachberatung notieren",
      },
    ],
    links: [],
  },
  {
    id: "im-studium-pruefungsregeln",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Prüfungsordnung und Prüfungsanmeldung verstehen",
    description:
      "Informiere dich anhand der für dich gültigen Prüfungsordnung und des offiziellen Prüfungsportals.",
    category: "Studienalltag",
    sortOrder: 20,
    checklist: [
      {
        id: "ordnung-finden",
        text: "Die für deinen Studiengang und Startzeitpunkt gültige Prüfungsordnung finden",
      },
      {
        id: "anmeldung-verstehen",
        text: "Offiziellen Ablauf für Prüfungsan- und -abmeldungen prüfen",
      },
      {
        id: "fristen-selbst-notieren",
        text: "Relevante Fristen aus dem offiziellen Portal selbst notieren",
      },
    ],
    links: [],
  },
  {
    id: "im-studium-ansprechpersonen",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Ansprechpersonen und Beratung kennenlernen",
    description:
      "Finde heraus, wer bei fachlichen, organisatorischen, sozialen oder persönlichen Fragen helfen kann.",
    category: "Studienalltag",
    sortOrder: 30,
    checklist: [
      {
        id: "fachberatung",
        text: "Kontakt der Fachstudienberatung oder Studienkoordination speichern",
      },
      {
        id: "pruefungsamt",
        text: "Zuständiges Prüfungsamt und dessen offizielle Hinweise finden",
      },
      {
        id: "weitere-beratung",
        text: "Beratungsangebote von Hochschule und Studierendenwerk ansehen",
      },
    ],
    links: [
      {
        label: "Deutsches Studierendenwerk: Beratung",
        url: "https://www.studierendenwerke.de/themen/beratungsangebote",
      },
    ],
  },
  {
    id: "im-studium-finanzierung",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Studienfinanzierung prüfen",
    description:
      "Überprüfe regelmäßig dein Budget und informiere dich bei Veränderungen über passende Beratungsstellen und Optionen.",
    category: "Finanzierung",
    sortOrder: 40,
    checklist: [
      {
        id: "budget-aktualisieren",
        text: "Monatliches Budget und absehbare größere Ausgaben aktualisieren",
      },
      {
        id: "optionen-pruefen",
        text: "BAföG, Nebenjob und weitere seriöse Optionen anhand offizieller Informationen prüfen",
      },
      {
        id: "beratung-nutzen",
        text: "Bei offenen Fragen die Sozialberatung des Studierendenwerks kontaktieren",
      },
    ],
    links: [
      {
        label: "Offizielles BAföG-Portal",
        url: "https://www.bafög.de/",
      },
      {
        label: "Deutsches Studierendenwerk: Studienfinanzierung",
        url: "https://www.studierendenwerke.de/themen/studienfinanzierung",
      },
    ],
  },
  {
    id: "im-studium-stipendien",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Stipendien und Förderprogramme recherchieren",
    description:
      "Prüfe Programme nicht nur nach Noten, sondern auch nach Engagement, Lebensweg und fachlichen Schwerpunkten.",
    category: "Stipendien",
    sortOrder: 50,
    checklist: [
      {
        id: "einstiege-recherchieren",
        text: "StipendiumPlus und Angebote deiner Hochschule ansehen",
      },
      {
        id: "kriterien-pruefen",
        text: "Bedingungen und Fristen auf den offiziellen Programmseiten prüfen",
      },
      {
        id: "unterlagen-planen",
        text: "Für ein passendes Programm benötigte Unterlagen notieren",
      },
    ],
    links: [
      {
        label: "StipendiumPlus",
        url: "https://www.stipendiumplus.de/",
      },
      {
        label: "Deutschlandstipendium",
        url: "https://www.deutschlandstipendium.de/",
      },
    ],
  },
  {
    id: "im-studium-organisation",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Lern- und Semesterorganisation festlegen",
    description:
      "Plane Lehrveranstaltungen, Selbstlernzeiten und Erholung so, dass dein Semester realistisch bleibt.",
    category: "Studienalltag",
    sortOrder: 60,
    checklist: [
      {
        id: "termine-buendeln",
        text: "Lehrveranstaltungen und selbst gesetzte Lernzeiten in einem Kalender bündeln",
      },
      {
        id: "wochenrhythmus",
        text: "Einen realistischen Wochenrhythmus mit Pausen festlegen",
      },
      {
        id: "review-planen",
        text: "Kurzen wöchentlichen Termin zum Prüfen und Anpassen einplanen",
      },
    ],
    links: [],
  },
  {
    id: "im-studium-karriere-praxis",
    version: ROADMAP_TEMPLATE_VERSION,
    phase: "im_studium",
    title: "Berufliche Orientierung und Praxisoptionen erkunden",
    description:
      "Erkunde Tätigkeitsfelder und Praxiserfahrungen schrittweise, ohne dich sofort auf einen einzigen Weg festlegen zu müssen.",
    category: "Karriere",
    sortOrder: 70,
    checklist: [
      {
        id: "taetigkeitsfelder",
        text: "Zwei bis drei interessante Tätigkeitsfelder sammeln",
      },
      {
        id: "praxisformate",
        text: "Praktikum, HiWi-Tätigkeit und Werkstudierendenstelle vergleichen",
      },
      {
        id: "hochschulangebote",
        text: "Career Service und Praxisangebote deiner Hochschule finden",
      },
    ],
    links: [
      {
        label: "Bundesagentur für Arbeit: Studium",
        url: "https://www.arbeitsagentur.de/bildung/studium",
      },
    ],
  },
] as const satisfies readonly RoadmapTaskTemplate[];

export const roadmapTemplatesByPhase: Readonly<
  Record<EducationPhase, readonly RoadmapTaskTemplate[]>
> = {
  vor_dem_studium: beforeStudyTemplates,
  im_studium: duringStudyTemplates,
};

export function getRoadmapTemplates(
  phase: EducationPhase,
): readonly RoadmapTaskTemplate[] {
  return roadmapTemplatesByPhase[phase];
}
