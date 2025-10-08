import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";

const URL = "https://www.boisestate.edu/publicsafety-security/campus-crime/campus-crime-log/";

async function scrapeCrimeLog() {
  const { data } = await axios.get(URL);
  const $ = cheerio.load(data);

  const entries = [];

  $("table tbody tr").each((i, row) => {
    const cols = $(row).find("td").map((_, td) => $(td).text().trim()).get();

    if (cols.length >= 5) {
      entries.push({
        date: cols[0],
        time: cols[1],
        type: cols[2],
        location: cols[3],
        status: cols[4],
      });
    }
  });

  writeFileSync("crime-data.json", JSON.stringify(entries, null, 2));
  console.log(`✅ Saved ${entries.length} entries to crime-data.json`);
}

scrapeCrimeLog();