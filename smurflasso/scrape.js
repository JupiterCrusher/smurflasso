const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/";

async function scrape() {
  const { data: html } = await axios.get(URL);
  const $ = cheerio.load(html);

  const rows = $("table tbody tr");
  const output = [];

  rows.each((_, row) => {
    const cells = $(row).find("td").map((_, el) => $(el).text().trim()).get();
    if (cells.length < 10) return;

    output.push({
      reported: cells[0],
      start: `${cells[1]} ${cells[2]}`,
      end: `${cells[3]} ${cells[4]}`,
      location: cells[5],
      case_number: cells[6],
      nature: cells[7],
      disposition: cells[9],
    });
  });

  const filePath = "public/crime-data.json";
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : [];

  const changed = JSON.stringify(output) !== JSON.stringify(existing);

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log("✅ Crime data updated.");
  } else {
    console.log("No changes to crime data.");
  }
}

scrape();