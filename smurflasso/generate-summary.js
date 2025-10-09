import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateSummary() {
  const dataPath = "public/crime-data.json";
  if (!fs.existsSync(dataPath)) {
    console.error("crime-data.json not found");
    process.exit(1);
  }

  const crimes = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const recentCrimes = crimes.slice(0, 30);

  const prompt = `
You are an analyst summarizing campus crime data for Boise State University.
Write a short, professional summary of the latest incidents using plain language.
Avoid redundancy, don't use bullet points, and emphasize notable patterns or changes.
Here is the latest data:
${JSON.stringify(recentCrimes, null, 2)}
`;

  console.log("Generating AI summary...");
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const summary = completion.choices[0].message?.content?.trim() || "No summary generated.";

    fs.writeFileSync("public/summary.json", JSON.stringify({ summary }, null, 2));
    console.log("✅ AI summary updated.");
  } catch (err) {
    console.error("❌ Failed to generate summary:", err);
  }
}

generateSummary();