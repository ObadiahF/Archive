describe("config", () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.resetModules();
  });

  it("loads with the test env values from setup.ts", () => {
    jest.resetModules();
    const { config } = require("../../src/config");
    expect(config.auth.username).toBe("testuser");
    expect(config.auth.password).toBe("testpass");
    expect(config.jwt.secret).toBe("test-secret-do-not-use-in-prod");
    expect(config.jwt.ttlHours).toBe(1);
    expect(config.upload.maxFileBytes).toBe(10 * 1024 * 1024);
    expect(config.upload.maxFilesPerRequest).toBe(5);
    expect(config.port).toBe(3000);
  });

  it("throws when a required env var is missing", () => {
    delete process.env.AUTH_USERNAME;
    jest.resetModules();
    expect(() => require("../../src/config")).toThrow(/AUTH_USERNAME/);
  });

  it("throws when an int env var is non-numeric", () => {
    process.env.JWT_TTL_HOURS = "not-a-number";
    jest.resetModules();
    expect(() => require("../../src/config")).toThrow(/JWT_TTL_HOURS/);
  });

  it("falls back to defaults when int env vars are unset", () => {
    delete process.env.JWT_TTL_HOURS;
    delete process.env.MAX_FILE_BYTES;
    delete process.env.MAX_FILES_PER_REQUEST;
    delete process.env.PORT;
    jest.resetModules();
    const { config } = require("../../src/config");
    expect(config.jwt.ttlHours).toBe(24);
    expect(config.upload.maxFileBytes).toBe(100 * 1024 * 1024);
    expect(config.upload.maxFilesPerRequest).toBe(20);
    expect(config.port).toBe(3000);
  });
});
