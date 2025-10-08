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
        reported: cols[0],
        start_date: cols[1],
        start_time: cols[2],
        end_date: cols[3],
        end_time: cols[4],
        location: cols[5],
        case_number: cols[6],
        nature: cols[7],
        disposition: cols[9] // skip 8 (Hate Crime), 10 (Include in log?)
      });
    }
  });

  writeFileSync("crime-data.json", JSON.stringify(entries, null, 2));
  console.log(`✅ Saved ${entries.length} entries to crime-data.json`);
}

scrapeCrimeLog();