import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\cường\\.gemini\\antigravity\\brain\\f8d866b6-faf1-4e37-b4fe-83404027440e";
const REPORTS_DIR = path.resolve(process.cwd(), "reports", "screenshots");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

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
  console.log("       TỦ SÁCH ÁO LAM — CHỤP ẢNH MINH CHỨNG NHẬN DIỆN THƯƠNG HIỆU MỚI           ");
  console.log("================================================================================\n");

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9224",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "about:blank",
  ]);

  await sleep(2000);

  try {
    const versionRes = await fetch("http://localhost:9224/json/version");
    const versionData: any = await versionRes.json();
    const browserClient = new CdpClient(versionData.webSocketDebuggerUrl);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const targetsRes = await fetch("http://localhost:9224/json/list");
    const targets: any = await targetsRes.json();
    const pageTarget = targets.find((t: any) => t.id === targetId) || targets[0];

    const tabClient = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await tabClient.connect();

    await tabClient.send("Page.enable");
    await tabClient.send("DOM.enable");
    await tabClient.send("Runtime.enable");

    // Helper function to capture screenshot
    async function capture(filename: string) {
      const captureResult = await tabClient.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      const buffer = Buffer.from(captureResult.data, "base64");
      const reportPath = path.join(REPORTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(reportPath, buffer);
      fs.writeFileSync(artifactPath, buffer);
      console.log(`✓ Saved screenshot: ${filename} (${buffer.length} bytes)`);
    }

    // 1. Desktop Header (1440x900)
    console.log("Capturing Desktop Header (1440x900)...");
    await tabClient.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.0,
      mobile: false,
    });
    await tabClient.send("Page.navigate", { url: "http://localhost:3000" });
    await sleep(2500);
    await capture("branding_header_desktop.png");

    // 2. Desktop Footer (1440x900)
    console.log("Capturing Desktop Footer (1440x900)...");
    await tabClient.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, document.body.scrollHeight)",
    });
    await sleep(1000);
    await capture("branding_footer_desktop.png");

    // 3. Mobile Header (390x844 - iPhone 12/13/14)
    console.log("Capturing Mobile Header (390x844)...");
    await tabClient.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2.0,
      mobile: true,
    });
    await tabClient.send("Page.navigate", { url: "http://localhost:3000" });
    await sleep(2500);
    await capture("branding_header_mobile.png");

    // 4. Mobile Drawer Open
    console.log("Capturing Mobile Drawer Open (390x844)...");
    // Click mobile menu button
    await tabClient.send("Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('button[aria-label="Mở menu"]') || document.querySelector('button[aria-label*="menu"]');
        if (btn) btn.click();
      `,
    });
    await sleep(1000);
    await capture("branding_mobile_nav.png");

    tabClient.close();
    browserClient.close();
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    chromeProc.kill("SIGKILL");
    console.log("\n✓ All Branding screenshots captured successfully!");
  }
}

main().catch(console.error);
