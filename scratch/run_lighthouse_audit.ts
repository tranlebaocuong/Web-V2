import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

const auditTargets = [
  { name: "SCR-01 Trang chủ", url: "http://localhost:3001/", filename: "lh_scr01_home.json" },
  { name: "SCR-02 Ngành Đồng", url: "http://localhost:3001/nganh-dong", filename: "lh_scr02_overview.json" },
  { name: "SCR-03 Bậc Mở Mắt", url: "http://localhost:3001/nganh-dong/mo-mat", filename: "lh_scr03_level.json" },
  { name: "SCR-06 Tìm kiếm", url: "http://localhost:3001/tim-kiem", filename: "lh_scr06_search.json" },
  { name: "SCR-05 Đọc bài học", url: "http://localhost:3002/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca", filename: "lh_scr05_reader.json" },
];

async function runAudit() {
  const reportsDir = path.resolve(process.cwd(), "reports", "lighthouse");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const tempDir = path.resolve(process.env.TEMP || "C:\\Users\\cường\\AppData\\Local\\Temp", "lighthouse_chrome_temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const results: Array<{ name: string; url: string; scores: LighthouseScores }> = [];

  for (const target of auditTargets) {
    console.log(`\n[Lighthouse] Đang chạy kiểm toán cho: ${target.name} (${target.url})...`);
    const tempOutputPath = path.join(tempDir, target.filename);
    const finalOutputPath = path.join(reportsDir, target.filename);

    const args = [
      "--yes",
      "lighthouse",
      target.url,
      "--output=json",
      `--output-path=${tempOutputPath}`,
      `--chrome-flags="--headless=new --no-sandbox --disable-gpu"`,
      "--quiet",
    ];

    try {
      execFileSync("npx", args, {
        cwd: tempDir,
        stdio: "inherit",
        timeout: 90000,
        shell: true,
      });

      if (fs.existsSync(tempOutputPath)) {
        fs.copyFileSync(tempOutputPath, finalOutputPath);
        const rawJson = JSON.parse(fs.readFileSync(finalOutputPath, "utf8"));
        const categories = rawJson.categories;
        const scores: LighthouseScores = {
          performance: Math.round((categories.performance?.score || 0) * 100),
          accessibility: Math.round((categories.accessibility?.score || 0) * 100),
          bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
          seo: Math.round((categories.seo?.score || 0) * 100),
        };

        results.push({ name: target.name, url: target.url, scores });
        console.log(`[Lighthouse] Kết quả ${target.name}:`, scores);
      }
    } catch (err: any) {
      console.error(`[Lighthouse] Lỗi kiểm toán ${target.name}:`, err.message);
    }
  }

  const summaryPath = path.join(reportsDir, "lighthouse_summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n[Lighthouse] Đã ghi tổng hợp kết quả: ${summaryPath}`);
}

runAudit();
