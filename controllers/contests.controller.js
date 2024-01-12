const awsConfig = require("../config/aws_config");
const fs = awsConfig.initializeS3();
const scraper = require("../utils/scraper");

const OUTPUT_DIR = "output";

exports.getContests = async (req, res) => {
  const { platform } = req.params;
  const filePath = `${OUTPUT_DIR}/${platform}_contests.json`;

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const contests = JSON.parse(fileContent);
    res.json(contests);
  } catch (error) {
    console.error("Error loading contests:", error);
    res.status(500).json({ error: "Failed to load contests" });
  }
};

exports.getAllContests = async (req, res) => {
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const contestData = {};

    for (const file of files) {
      if (file.endsWith("_contests.json")) {
        const platform = file.replace("_contests.json", "");
        const fileContent = await fs.readFile(`${OUTPUT_DIR}/${file}`, "utf-8");
        contestData[platform] = JSON.parse(fileContent);
      }
    }
    res.status(200).json(contestData);
  } catch (error) {
    console.error("Error loading all contests:", error);
    res.status(500).json({ error: "Failed to load all contests" });
  }
};

exports.scrape = async (req, res) => {
  try {
    await scraper.runScraper();
    res.status(200).json({ message: "Scraping completed successfully" });
  } catch (error) {
    console.error("Scraping failed:", error);
    res.status(500).json({ error: "Scraping job failed" });
  }
};
