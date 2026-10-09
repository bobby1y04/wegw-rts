import { describe, expect, it } from "vitest";

import {
  ROADMAP_TEMPLATE_VERSION,
  roadmapTemplatesByPhase,
} from "../../src/features/roadmap/templates";

describe("roadmap templates", () => {
  it("provides a versioned roadmap for both education phases", () => {
    expect(roadmapTemplatesByPhase.vor_dem_studium).toHaveLength(8);
    expect(roadmapTemplatesByPhase.im_studium).toHaveLength(7);

    for (const [phase, templates] of Object.entries(
      roadmapTemplatesByPhase,
    )) {
      expect(templates.every((template) => template.phase === phase)).toBe(
        true,
      );
      expect(
        templates.every(
          (template) => template.version === ROADMAP_TEMPLATE_VERSION,
        ),
      ).toBe(true);
    }
  });

  it("uses unique stable ids and actionable checklists", () => {
    const templates = Object.values(roadmapTemplatesByPhase).flat();
    const templateIds = templates.map((template) => template.id);

    expect(new Set(templateIds).size).toBe(templateIds.length);

    for (const template of templates) {
      expect(template.checklist.length).toBeGreaterThanOrEqual(2);
      expect(template.checklist.length).toBeLessThanOrEqual(5);
      expect(
        new Set(template.checklist.map((item) => item.id)).size,
      ).toBe(template.checklist.length);

      for (const link of template.links) {
        expect(() => new URL(link.url)).not.toThrow();
        expect(link.url.startsWith("https://")).toBe(true);
      }
    }
  });
});
