import { describe, it, expect } from "vitest";
import { generateManifest } from "../../scripts/manifests";

describe("Manifest Generator", () => {
  it("generates valid Chrome MV3 manifest with service worker", () => {
    const manifest = generateManifest("chrome", { version: "1.2.0" }) as Record<string, unknown>;
    const bg = manifest.background as Record<string, unknown>;
    const cs = manifest.content_scripts as Array<{ matches: string[] }>;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe("1.2.0");
    expect(manifest.minimum_chrome_version).toBe("111");
    expect(bg.service_worker).toBe("background.js");
    expect(bg.type).toBe("module");
    expect(cs[0].matches).toContain("<all_urls>");
  });

  it("generates valid Firefox MV3 manifest with gecko settings and background scripts", () => {
    const manifest = generateManifest("firefox", { version: "1.2.0" }) as Record<string, unknown>;
    const settings = manifest.browser_specific_settings as { gecko: { id: string; strict_min_version: string } };
    const bg = manifest.background as { scripts?: string[]; service_worker?: string };

    expect(manifest.manifest_version).toBe(3);
    expect(settings.gecko.id).toBe("velocityx@xenonesis.github.io");
    expect(settings.gecko.strict_min_version).toBe("109.0");
    expect(bg.scripts).toEqual(["background.js"]);
    expect(bg.service_worker).toBeUndefined();
  });

  it("generates valid Safari manifest with safari browser settings", () => {
    const manifest = generateManifest("safari", { version: "1.2.0" }) as Record<string, unknown>;
    const settings = manifest.browser_specific_settings as { safari: { strict_min_version: string } };

    expect(manifest.manifest_version).toBe(3);
    expect(settings.safari.strict_min_version).toBe("15.4");
  });
});
