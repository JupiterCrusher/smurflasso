const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/";

async function scrape() {
  const { data: html } = await axios.get(URL);
  const $ = cheerio.load(html);

  const rows = $("table tbody tr");
  const output = [];

  rows.each((i, row) => {
    const cells = $(row).find("td").map((_, el) => $(el).text().trim()).get();
    if (cells.length < 10) return;

    output.push({
      date: cells[0],
      type: cells[7],
      location: cells[5],
      time: `${cells[2]} - ${cells[4]}`,
      status: cells[9],
    });
  });

  const existing = JSON.parse(fs.readFileSync("public/crime-data.json", "utf8"));
  const changed = JSON.stringify(output) !== JSON.stringify(existing);

  if (changed) {
    fs.writeFileSync("public/crime-data.json", JSON.stringify(output, null, 2));
    console.log("Crime data updated.");
  } else {
    console.log("No changes to crime data.");
  }
}

scrape();