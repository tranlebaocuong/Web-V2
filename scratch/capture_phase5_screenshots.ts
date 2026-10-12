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
  console.log("       SEN TRẮNG — CHỤP ẢNH MINH CHỨNG SCR-07 GIAO DIỆN QUẢN TRỊ ADMIN         ");
  console.log("================================================================================\n");

  // Step 1: Obtain session token via API
  console.log("Obtaining admin session token...");
  const loginRes = await fetch("http://localhost:3002/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@sentrang.gdpt.vn",
      password: "SenTrang@Admin2026!",
    }),
  });
  const setCookieHeader = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = setCookieHeader.match(/sentrang_admin_session=([^;]+)/);
  const sessionToken = tokenMatch ? tokenMatch[1] : "";
  console.log("Session token acquired:", sessionToken ? "✓ YES" : "✗ NO");

  // Launch Chrome headless
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9223",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "about:blank",
  ]);

  await sleep(1500);

  try {
    const versionRes = await fetch("http://localhost:9223/json/version");
    const versionData: any = await versionRes.json();
    const browserClient = new CdpClient(versionData.webSocketDebuggerUrl);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const targetsRes = await fetch("http://localhost:9223/json/list");
    const targets: any = await targetsRes.json();
    const pageTarget = targets.find((t: any) => t.id === targetId) || targets[0];

    const tabClient = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await tabClient.connect();

    await tabClient.send("Page.enable");
    await tabClient.send("DOM.enable");
    await tabClient.send("Network.enable");

    // Set cookie in browser
    if (sessionToken) {
      await tabClient.send("Network.setCookie", {
        name: "sentrang_admin_session",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
      console.log("✓ Cookie injected into headless Chrome");
    }

    // Set viewport: Desktop 1440x1080
    await tabClient.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1080,
      deviceScaleFactor: 1.0,
      mobile: false,
    });

    const screens = [
      {
        id: "admin-01_login",
        title: "SCR-07A — Đăng nhập Quản trị",
        url: "http://localhost:3002/admin/login",
        needLogout: true,
      },
      {
        id: "admin-02_dashboard",
        title: "SCR-07B — Dashboard Học vụ",
        url: "http://localhost:3002/admin",
      },
      {
        id: "admin-03_lessons",
        title: "SCR-07C — Quản lý 156 bài học",
        url: "http://localhost:3002/admin/lessons",
      },
      {
        id: "admin-04_editor_3col",
        title: "SCR-07D — Trình biên tập 3 cột & Bản thô PDF",
        url: "http://localhost:3002/admin/lessons/D-MM-A-01",
      },
      {
        id: "admin-05_media",
        title: "SCR-07E — Thư viện tài sản hình ảnh",
        url: "http://localhost:3002/admin/media",
      },
      {
        id: "admin-06_audit_logs",
        title: "SCR-07F — Nhật ký kiểm toán hệ thống",
        url: "http://localhost:3002/admin/audit-logs",
      },
    ];

    for (const scr of screens) {
      console.log(`\nCapturing: ${scr.title} (${scr.url})...`);

      if (scr.needLogout) {
        // Clear cookie for login screen
        await tabClient.send("Network.clearBrowserCookies");
      } else if (sessionToken) {
        // Re-inject cookie
        await tabClient.send("Network.setCookie", {
          name: "sentrang_admin_session",
          value: sessionToken,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      }

      await tabClient.send("Page.navigate", { url: scr.url });
      await sleep(2500);

      const captureResult = await tabClient.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const buffer = Buffer.from(captureResult.data, "base64");
      const filename = `${scr.id}.png`;
      const reportPath = path.join(REPORTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);

      fs.writeFileSync(reportPath, buffer);
      fs.writeFileSync(artifactPath, buffer);

      console.log(`✓ Saved screenshot: ${filename} (${buffer.length} bytes)`);
    }

    tabClient.close();
    browserClient.close();
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    chromeProc.kill("SIGKILL");
    console.log("\n✓ All Admin screenshots captured successfully!");
  }
}

main().catch(console.error);
