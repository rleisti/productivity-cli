import Config from "./Config";

describe("Config", () => {
  test("should load a non-existent file to create a default configuration", async () => {
    const config = await Config.load("non-existent.toml");
    expect(config).toEqual(new Config(".", 6));
  });

  test("should load a configuration file with all configurable options", async () => {
    const config = await Config.load("testResource/config/all_options.toml");
    expect(config).toEqual(
      new Config(
        "~/journal",
        0,
        "nova_scotia",
        "anthropic",
        [
          {
            client: "ClientA",
            targetHoursPerDay: 7,
            activityRoundingIncrement: 15,
            activityRoundingMethod: "roundUp",
          },
          {
            client: "ClientB",
            targetHoursPerDay: 8,
            activityRoundingIncrement: 30,
            activityRoundingMethod: "round",
          },
          {
            client: "ClientC",
            targetHoursPerDay: 8,
            activityRoundingIncrement: 0,
            activityRoundingMethod: "none",
          },
          {
            client: "ClientD",
            targetHoursPerDay: 8,
            activityRoundingIncrement: 0,
            activityRoundingMethod: "none",
          },
        ],
        {
          model: "claude-3-5-haiku-latest",
          apiKey: "api key value",
        },
      ),
    );
  });
});
