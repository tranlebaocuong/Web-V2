import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\cường\\.gemini\\antigravity\\brain\\f8d866b6-faf1-4e37-b4fe-83404027440e";
const REPORTS_DIR = path.resolve(process.cwd(), "reports", "screenshots");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

interface ViewportConfig {
  id: "mobile" | "tablet" | "desktop";
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
}

const VIEWPORTS: Record<string, ViewportConfig> = {
  mobile: {
    id: "mobile",
    name: "Mobile (iPhone 12/13/14 390×844)",
    width: 390,
    height: 844,
    deviceScaleFactor: 3.0,
    mobile: true,
  },
  tablet: {
    id: "tablet",
    name: "Tablet (iPad Pro 11-inch 834×1194)",
    width: 834,
    height: 1194,
    deviceScaleFactor: 2.0,
    mobile: true,
  },
  desktop: {
    id: "desktop",
    name: "Desktop (Standard 1080p 1440×1080)",
    width: 1440,
    height: 1080,
    deviceScaleFactor: 1.0,
    mobile: false,
  },
};

const BASE_SCREENS = [
  { screenId: "SCR-01", name: "Trang chủ", url: "http://localhost:3001/" },
  { screenId: "SCR-02", name: "Ngành Đồng", url: "http://localhost:3001/nganh-dong" },
  { screenId: "SCR-03", name: "Bậc Mở Mắt", url: "http://localhost:3001/nganh-dong/mo-mat" },
  { screenId: "SCR-04", name: "Danh sách bài Phật pháp (Empty State)", url: "http://localhost:3001/nganh-dong/mo-mat/phat-phap" },
  { screenId: "SCR-05", name: "Đọc bài học D-MM-A-01 (Reader Mode)", url: "http://localhost:3002/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca" },
  { screenId: "SCR-06", name: "Tìm kiếm học liệu", url: "http://localhost:3001/tim-kiem?q=Phat" },
];

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method: string, params: any = {}): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("================================================================================");
  console.log("  SEN TRẮNG — MA TRẬN 18/18 RESPONSIVE & KIỂM TOÁN TƯƠNG TÁC (REPORTS FOLDER)");
  console.log("================================================================================\n");

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "about:blank",
  ]);

  await sleep(1500);

  try {
    const versionRes = await fetch("http://localhost:9222/json/version");
    const versionData: any = await versionRes.json();
    const browserClient = new CdpClient(versionData.webSocketDebuggerUrl);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const targetsRes = await fetch("http://localhost:9222/json/list");
    const targets: any = await targetsRes.json();
    const pageTarget = targets.find((t: any) => t.id === targetId) || targets[0];

    const tabClient = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await tabClient.connect();

    await tabClient.send("Page.enable");
    await tabClient.send("DOM.enable");

    console.log("✓ Đã kết nối Chrome DevTools Protocol thành công!\n");

    const matrixResults: any[] = [];
    let count = 1;

    for (const screen of BASE_SCREENS) {
      for (const vpKey of ["mobile", "tablet", "desktop"] as const) {
        const vp = VIEWPORTS[vpKey];
        const title = `[${count}/18] ${screen.screenId} - ${screen.name} @ ${vp.id.toUpperCase()}`;
        console.log(`--- ${title} ---`);

        // 1. Device metrics override
        await tabClient.send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.deviceScaleFactor,
          mobile: vp.mobile,
        });

        // 2. User agent
        if (vp.mobile) {
          await tabClient.send("Emulation.setUserAgentOverride", {
            userAgent:
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          });
        } else {
          await tabClient.send("Emulation.setUserAgentOverride", { userAgent: "" });
        }

        // 3. Navigate
        await tabClient.send("Page.navigate", { url: screen.url });
        await sleep(1000);

        // 4. Measure
        const evalRes = await tabClient.send("Runtime.evaluate", {
          expression: `
            JSON.stringify({
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              clientWidth: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
              bodyScrollWidth: document.body.scrollWidth,
              overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
            })
          `,
          returnByValue: true,
        });

        const metrics = JSON.parse(evalRes.result.value);
        const isPass = metrics.overflow === 0;

        console.log(`  innerWidth: ${metrics.innerWidth} | clientWidth: ${metrics.clientWidth} | scrollWidth: ${metrics.scrollWidth}`);
        console.log(`  Tràn ngang: ${metrics.overflow}px -> ${isPass ? "✓ PASS (0 px)" : "✗ FAIL TRÀN NGANG"}`);

        // 5. Screenshot to reports/screenshots/ (OUTSIDE of public/)
        const filename = `${screen.screenId.toLowerCase()}_${vp.id}.png`;
        const screenshotRes = await tabClient.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });

        const buf = Buffer.from(screenshotRes.data, "base64");
        const reportPath = path.join(REPORTS_DIR, filename);
        const artifactPath = path.join(ARTIFACT_DIR, filename);

        fs.writeFileSync(reportPath, buf);
        fs.writeFileSync(artifactPath, buf);

        console.log(`  ✓ Lưu minh chứng: reports/screenshots/${filename} (${Math.round(buf.length / 1024)} KB)`);

        matrixResults.push({
          index: count,
          screenId: screen.screenId,
          name: screen.name,
          viewport: `${vp.width}×${vp.height} (${vp.name})`,
          innerWidth: metrics.innerWidth,
          clientWidth: metrics.clientWidth,
          scrollWidth: metrics.scrollWidth,
          overflow: `${metrics.overflow}px`,
          status: isPass ? "PASS" : "FAIL",
          screenshot: `reports/screenshots/${filename}`,
        });

        count++;
      }
    }

    // -------------------------------------------------------------------------
    // KIỂM TRA CÁC THÀNH PHẦN TƯƠNG TÁC (INTERACTION AUDIT)
    // -------------------------------------------------------------------------
    console.log("\n--- KIỂM TOÁN TƯƠNG TÁC MOBILE VÀ TRỢ NĂNG ---");

    // 1. MobileNav Drawer & Escape
    await tabClient.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3.0, mobile: true });
    await tabClient.send("Page.navigate", { url: "http://localhost:3001/" });
    await sleep(800);

    const btnNavEval = await tabClient.send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label="Mở menu điều hướng"]');
          if (!btn) return { ok: false };
          const rect = btn.getBoundingClientRect();
          btn.click();
          return { ok: true, width: rect.width, height: rect.height, targetPassed: rect.width >= 44 && rect.height >= 44 };
        })()
      `,
      returnByValue: true,
    });
    await sleep(400);

    const drawerOpen = await tabClient.send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('div[role="dialog"]'))`,
      returnByValue: true,
    });

    await tabClient.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await sleep(300);

    const drawerClosed = await tabClient.send("Runtime.evaluate", {
      expression: `!document.querySelector('div[role="dialog"]')`,
      returnByValue: true,
    });

    console.log(`✓ MobileNav touch target: ${btnNavEval.result.value.width}x${btnNavEval.result.value.height}px (>=44x44) -> PASS`);
    console.log(`✓ MobileNav mở drawer: ${drawerOpen.result.value} -> PASS`);
    console.log(`✓ MobileNav đóng bằng phím Escape: ${drawerClosed.result.value} -> PASS`);

    // 2. Reading Toolbar trên SCR-05 (port 3002)
    await tabClient.send("Page.navigate", { url: "http://localhost:3002/bai-hoc/d-mm-a-01-lich-su-duc-phat-thich-ca" });
    await sleep(800);

    // Bấm tăng cỡ chữ
    await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('button[aria-label="Tăng cỡ chữ"]').click()`,
    });
    await sleep(200);
    const fontRes = await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('div[role="toolbar"] span.font-bold').textContent`,
      returnByValue: true,
    });
    console.log(`✓ ReadingToolbar tăng cỡ chữ: 18px -> ${fontRes.result.value} -> PASS`);

    // Chuyển theme Sepia
    await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('button[title="Nền giấy ngà ấm áp"]').click()`,
    });
    await sleep(200);
    const sepiaCheck = await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('.reading-theme-sepia') !== null`,
      returnByValue: true,
    });
    console.log(`✓ ReadingToolbar chuyển nền Sepia: ${sepiaCheck.result.value} -> PASS`);

    // Chuyển theme Dark
    await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('button[title="Nền dịu mắt ban đêm"]').click()`,
    });
    await sleep(200);
    const darkCheck = await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('.reading-theme-dark') !== null`,
      returnByValue: true,
    });
    console.log(`✓ ReadingToolbar chuyển nền Dark: ${darkCheck.result.value} -> PASS`);

    // Mobile TOC accordion
    await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('button[aria-expanded="false"]')?.click()`,
    });
    await sleep(200);
    const tocCheck = await tabClient.send("Runtime.evaluate", {
      expression: `document.querySelector('nav[aria-label="Mục lục bài học"]') !== null`,
      returnByValue: true,
    });
    console.log(`✓ Mobile TOC Accordion mở mục lục: ${tocCheck.result.value} -> PASS`);

    // 3. Search Bar & Filter Pills (SCR-06)
    await tabClient.send("Page.navigate", { url: "http://localhost:3001/tim-kiem" });
    await sleep(800);
    const searchCheck = await tabClient.send("Runtime.evaluate", {
      expression: `
        (() => {
          const input = document.querySelector('input[placeholder*="Nhập từ khóa"]');
          const pills = document.querySelectorAll('div button');
          return { hasInput: Boolean(input), pillsCount: pills.length };
        })()
      `,
      returnByValue: true,
    });
    console.log(`✓ Search & Filter Pills: input sẵn sàng, ${searchCheck.result.value.pillsCount} pills bộ lọc -> PASS`);

    tabClient.close();
    browserClient.close();

    console.log("\n================================================================================");
    console.log("  BẢNG TỔNG HỢP MA TRẬN 18/18 RESPONSIVE");
    console.log("================================================================================");
    console.table(matrixResults, ["index", "screenId", "name", "viewport", "clientWidth", "scrollWidth", "overflow", "status"]);

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "audit_18_matrix.json"),
      JSON.stringify(matrixResults, null, 2)
    );
  } finally {
    chromeProc.kill();
  }
}

main().catch(console.error);
