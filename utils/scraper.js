const axios = require("axios");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");
const { DateTime } = require("luxon"); // Luxon for date-time handling
const awsConfig = require("../config/aws_config");
const fs = awsConfig.initializeS3();

const BASE_URL = "https://clist.by/";
const OUTPUT_DIR = "output";

let allContests = [];

async function getContests() {
  try {
    const response = await axios.get(BASE_URL);
    const contests = [];

    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const contestElements = $(
        ".contest.row:not(.subcontest) > div + div > i + a"
      );

      contestElements.each((index, element) => {
        const dataAce = $(element).attr("data-ace");
        if (dataAce) {
          const contestInfo = parseContestData(dataAce);
          contests.push(contestInfo);
        }
      });
    }

    // allContests.push(contests);
    return contests;
  } catch (error) {
    console.error("Error fetching contests:", error);
    // console.log("Problematic data:", dataAce);
    return null;
  }
}

function extractSiteName(url) {
  try {
    const domain = new URL(url).hostname;
    const parts = domain.split(".");
    return parts[parts.length - 2];
  } catch (error) {
    console.error("Error extracting site name:", error);
    return null;
  }
}

function parseContestData(dataAce) {
  try {
    const contestData = JSON.parse(htmlDecode(dataAce));
    console.log("Parsed contestData:", contestData);

    const startDateTime = DateTime.fromFormat(
      contestData.time.start,
      "MMMM dd',' yyyy HH:mm:ss",
      { zone: "utc" }
    );
    const endDateTime = DateTime.fromFormat(
      contestData.time.end,
      "MMMM dd',' yyyy HH:mm:ss",
      { zone: "utc" }
    );

    // const startISO = startDateTime.toISO({ suppressMilliseconds: true });
    // const endISO = endDateTime.toISO({ suppressMilliseconds: true });

    const startMillis = startDateTime.toMillis();
    const endMillis = endDateTime.toMillis();

    const durationSeconds = endDateTime.diff(startDateTime).as("seconds");

    const uniqueId = uuidv4();
    const apiSchema = {
      id: uniqueId,
      name: contestData.title || "Unknown",
      url: (contestData.desc || "Unknown").replace("url: ", ""),
      start_time: startMillis,
      end_time: endMillis,
      duration: formatDuration(durationSeconds),
      type_: "Unknown",
      in_24_hours: startDateTime.diffNow().as("days") <= 1 ? "Yes" : "No",
      status:
        startDateTime <= DateTime.utc() && DateTime.utc() <= endDateTime
          ? "CODING"
          : "BEFORE",
      site: extractSiteName(
        (contestData.desc || "Unknown").replace("url: ", "")
      ),
    };

    return apiSchema;
  } catch (error) {
    console.error("Error parsing contest data:", error);
    return null;
  }
}

function formatDuration(seconds) {
  if (seconds < 0) {
    return "Invalid duration";
  }

  return Number(seconds);
}

function htmlDecode(input) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const PLATFORMS = [
  "codeforces",
  "topcoder",
  "atcoder",
  "codechef",
  "leetcode",
  "hackerrank",
  "hackerearth",
  "kickstart",
  "geeksforgeeks",
  "codingninja",
  "codingame",
  "spoj",
];

async function saveContestsByPlatform(contests) {
  try {
    const platformContests = {};

    if (contests && Array.isArray(contests)) {
      contests.forEach((contest) => {
        if (contest && contest.url) {
          for (const platform of PLATFORMS) {
            if (contest.url.includes(platform)) {
              if (!platformContests[platform]) {
                platformContests[platform] = [];
              }
              platformContests[platform].push(contest);
              allContests.push(contest);
              break;
            }
          }
        }
      });
    }

    for (const platform in platformContests) {
      // Removed directory existence check and creation for S3

      const filePath = `${OUTPUT_DIR}/${platform}_contests.json`;

      await fs.writeFile(
        filePath,
        JSON.stringify(platformContests[platform], null, 2),
        "utf8"
      );
    }

    const allContestsFilePath = `${OUTPUT_DIR}/all_contests.json`;

    // Write all contests to S3
    await fs.writeFile(
      allContestsFilePath,
      JSON.stringify(allContests.flat(), null, 2),
      "utf8"
    );

    console.log("Contests saved successfully");
  } catch (error) {
    console.error("Error saving contests:", error);
  }
}

async function runScraper() {
  try {
    console.log("Contest scraper execution started");
    const contests = await getContests();
    await saveContestsByPlatform(contests);
    console.log("Contest scraper execution completed");
  } catch (error) {
    console.error("Error running scraper:", error);
  }
}

module.exports = { runScraper };
