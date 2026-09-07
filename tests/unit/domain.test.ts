import { describe, it, expect } from "vitest";
import { extractHostname, matchesDomainPattern } from "@/utils/domain";

describe("domain matching utilities", () => {
  it("extracts hostname from URLs, strings, and location-like objects", () => {
    expect(extractHostname("https://www.youtube.com/watch?v=123")).toBe("www.youtube.com");
    expect(extractHostname("http://coursera.org/learn/math")).toBe("coursera.org");
    expect(extractHostname("sub.domain.co.uk:8080/path")).toBe("sub.domain.co.uk");
    expect(extractHostname("localhost:3000")).toBe("localhost");
    expect(extractHostname({ hostname: "NETFLIX.COM" } as Location)).toBe("netflix.com");
    expect(extractHostname("")).toBe("");
  });

  it("matches exact domains", () => {
    expect(matchesDomainPattern("youtube.com", "youtube.com")).toBe(true);
    expect(matchesDomainPattern("youtube.com", "vimeo.com")).toBe(false);
  });

  it("matches wildcard subdomains", () => {
    expect(matchesDomainPattern("*.coursera.org", "coursera.org")).toBe(true);
    expect(matchesDomainPattern("*.coursera.org", "sub.coursera.org")).toBe(true);
    expect(matchesDomainPattern("*.coursera.org", "nested.sub.coursera.org")).toBe(true);
    expect(matchesDomainPattern("*.coursera.org", "othercoursera.org")).toBe(false);
    expect(matchesDomainPattern("*.coursera.org", "coursera.com")).toBe(false);
  });
});
