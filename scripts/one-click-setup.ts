import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { execSync, execFileSync } from "child_process";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const PORT = 3333;
const HOST = "127.0.0.1";

// Blacklist mật khẩu và email demo
const FORBIDDEN_PASSWORDS = [
  "sentrang@admin2026!",
  "admin",
  "admin123",
  "password",
  "12345678",
  "tusachaolam2026",
];

const FORBIDDEN_EMAILS = [
  "admin@sentrang.gdpt.vn",
  "demo.admin@sentrang.gdpt.vn",
  "admin@sentrang.local",
];

function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (password.length < 12) {
    return { valid: false, reason: "Mật khẩu phải có tối thiểu 12 ký tự." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải có ít nhất 1 chữ in hoa (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải có ít nhất 1 chữ thường (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải có ít nhất 1 chữ số (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...)." };
  }
  if (FORBIDDEN_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, reason: "Không được sử dụng mật khẩu mặc định hoặc mật khẩu demo." };
  }
  return { valid: true };
}

function maskUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const user = parsed.username || "";
    return `${parsed.protocol}//${user ? user + ":***@" : ""}${parsed.host}${parsed.pathname}`;
  } catch {
    return "[MASKED_URL]";
  }
}

function cleanConnectionUrl(rawUrl: string): { valid: boolean; url: string; error?: string; host?: string; dbName?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, url: "", error: "Vui lòng nhập chuỗi kết nối Database Supabase." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err: any) {
    return {
      valid: false,
      url: "",
      error: "Định dạng chuỗi kết nối chưa hợp lệ. Chuỗi phải bắt đầu bằng 'postgresql://...'",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const dbName = parsed.pathname.replace(/^\//, "");

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") {
    return {
      valid: false,
      url: "",
      error: "Bạn đang nhập địa chỉ máy tính cá nhân. Thao tác tiếp theo: Hãy vào Supabase Dashboard, sao chép chuỗi kết nối Cloud bắt đầu bằng 'postgresql://postgres...' và dán vào đây.",
    };
  }

  if (dbName.includes("sentrang_test") || dbName.endsWith("_test")) {
    return {
      valid: false,
      url: "",
      error: "Phát hiện database thử nghiệm. Thao tác tiếp theo: Hãy chọn đúng database chính thức của dự án trên Supabase.",
    };
  }

  return { valid: true, url: trimmed, host: hostname, dbName };
}

// Giao diện Web Wizard nội bộ (HTML/CSS/JS thuần, phong cách Tủ Sách Áo Lam)
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khởi Tạo Quản Trị Viên 1-Click | Tủ Sách Áo Lam</title>
  <style>
    :root {
      --primary: #176B4A;
      --primary-hover: #12543A;
      --primary-light: #EBF4F0;
      --text: #24352E;
      --text-muted: #536B61;
      --bg: #F8F7F2;
      --card-bg: #FFFFFF;
      --border: #E3E1D8;
      --error: #D32F2F;
      --error-bg: #FDE8E8;
      --success: #2E7D32;
      --success-bg: #E8F5E9;
      --warning: #ED6C02;
      --warning-bg: #FFF4E5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px 16px; min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; }
    .container { max-width: 680px; width: 100%; background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden; }
    .header { background: var(--primary); color: white; padding: 28px 32px; text-align: center; }
    .header-logo { width: 48px; height: 48px; fill: white; margin: 0 auto 12px; display: block; }
    .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { font-size: 14px; opacity: 0.9; margin-top: 6px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    
    .body { padding: 32px; }
    .step-box { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px dashed var(--border); }
    .step-box:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .step-title { font-size: 16px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .step-num { width: 26px; height: 26px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
    .step-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5; }
    
    .form-group { margin-bottom: 16px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
    .input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border); font-size: 14px; outline: none; transition: border-color 0.2s; }
    .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(23,107,74,0.12); }
    .btn { background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s, opacity 0.2s; width: 100%; }
    .btn:hover:not(:disabled) { background: var(--primary-hover); }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover:not(:disabled) { background: var(--bg); }
    
    .alert { padding: 14px 16px; border-radius: 10px; font-size: 13px; line-height: 1.5; margin-top: 14px; display: none; }
    .alert-error { background: var(--error-bg); color: var(--error); border: 1px solid #FFCDD2; }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #C8E6C9; }
    .alert-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid #FFE0B2; }

    .help-card { background: #FAFAF7; border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.6; }
    .code-box { background: #24352E; color: #E8F5E9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; margin-top: 8px; position: relative; }
    .copy-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; }
    .copy-btn:hover { background: rgba(255,255,255,0.3); }

    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg class="header-logo" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
      <h1>TỦ SÁCH ÁO LAM</h1>
      <p>CÔNG CỤ KHỞI TẠO QUẢN TRỊ VIÊN PRODUCTION 1-CLICK</p>
      <div class="badge">Bảo mật Nội bộ (Localhost:3333) • Xác minh TLS</div>
    </div>

    <div class="body">
      <!-- BƯỚC 1: KẾT NỐI SUPABASE -->
      <div class="step-box" id="box-step1">
        <div class="step-title">
          <div class="step-num">1</div>
          <span>Kết nối Cơ sở dữ liệu Supabase Production</span>
        </div>
        <div class="step-desc">
          Công cụ sẽ tự động kiểm tra kết nối an toàn với máy chủ Cloud qua kênh mã hóa TLS chính quy.
        </div>
        <div class="help-card">
          💡 <strong>Cách lấy chuỗi kết nối:</strong> Đăng nhập Supabase Dashboard ➜ Chọn dự án ➜ <strong>Project Settings</strong> ➜ <strong>Database</strong> ➜ cuộn xuống <strong>Connection string</strong> ➜ Chọn thẻ <strong>URI</strong> ➜ Chọn <strong>Session</strong> (cổng 5432) hoặc <strong>Transaction</strong> (cổng 6543) ➜ Bấm <strong>Copy URI</strong> và dán vào dưới đây.
        </div>
        <div class="form-group">
          <label class="label">Chuỗi kết nối Supabase (Connection String URI)</label>
          <input type="text" id="supabase-url" class="input" placeholder="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require">
        </div>
        <button id="btn-check-db" class="btn" onclick="checkConnection()">
          <span>Kiểm tra kết nối Supabase</span>
        </button>
        <div id="alert-db" class="alert"></div>

        <!-- Khung nạp Migration khi database chưa có bảng -->
        <div id="migration-box" style="display:none; margin-top:16px; padding:14px; background:#FFF8E1; border:1px solid #FFE082; border-radius:10px;">
          <p style="font-size:13px; font-weight:600; color:#F57F17; margin-bottom:8px;">⚠️ Database chưa có bảng dữ liệu (Bảng trống 0/156 bài).</p>
          <p style="font-size:12px; color:#5D4037; margin-bottom:12px;">Bấm nút dưới đây để hệ thống tự động khởi tạo cấu trúc bảng và nạp 156 bài học Master Data V1.2 vào Supabase (Bảo toàn 100% bản nháp Draft, 0 bài Published).</p>
          <button id="btn-run-migration" class="btn" style="background:#F57F17;" onclick="runMigration()">
            <span>Tự động Tạo Bảng & Nạp 156 Bài Học</span>
          </button>
        </div>
      </div>

      <!-- BƯỚC 2: TẠO TÀI KHOẢN ADMIN -->
      <div class="step-box" id="box-step2" style="opacity: 0.5; pointer-events: none;">
        <div class="step-title">
          <div class="step-num">2</div>
          <span>Tạo Tài khoản Quản trị viên (Admin Production)</span>
        </div>
        <div class="step-desc">
          Nhập thông tin Admin đầu tiên của Bạn. Mật khẩu sẽ được băm bằng thuật toán bcrypt cost 12 và tuyệt đối không bao giờ ghi ra file, log hay lưu vào Git.
        </div>
        <div class="form-group">
          <label class="label">Email Quản trị viên</label>
          <input type="email" id="admin-email" class="input" placeholder="admin@gdptvietnam.org">
        </div>
        <div class="form-group">
          <label class="label">Mật khẩu (Tối thiểu 12 ký tự, đủ chữ hoa, thường, số, ký tự đặc biệt)</label>
          <input type="password" id="admin-pass" class="input" placeholder="Nhập mật khẩu an toàn...">
        </div>
        <div class="form-group">
          <label class="label">Xác nhận lại Mật khẩu</label>
          <input type="password" id="admin-confirm-pass" class="input" placeholder="Nhập lại mật khẩu để xác nhận...">
        </div>
        <button id="btn-create-admin" class="btn" onclick="createAdmin()">
          <span>Tạo Tài Khoản Quản Trị Viên</span>
        </button>
        <div id="alert-admin" class="alert"></div>
      </div>

      <!-- BƯỚC 3: CẤU HÌNH NETLIFY VÀ ĐĂNG NHẬP -->
      <div class="step-box" id="box-step3" style="display: none;">
        <div class="step-title">
          <div class="step-num">3</div>
          <span>Hoàn tất & Cấu hình Netlify (Thao tác cuối cùng)</span>
        </div>
        <div class="step-desc">
          🎉 <strong>Tài khoản Quản trị viên đã được tạo thành công trên Supabase!</strong><br>
          Bây giờ Bạn chỉ cần làm <strong>đúng 1 thao tác duy nhất</strong>: Sao chép 4 biến bên dưới và dán vào Netlify Dashboard ➜ <strong>Site configuration</strong> ➜ <strong>Environment variables</strong> (chọn <strong>Production only</strong>), sau đó bấm <strong>Trigger deploy</strong>.
        </div>
        
        <div class="label" style="margin-top:10px;">Các biến môi trường Production đã sẵn sàng:</div>
        <div class="code-box">
          <button class="copy-btn" onclick="copyNetlifyVars()">Sao chép Tất cả</button>
          <pre id="netlify-vars-content"></pre>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 12px;">
          <a href="https://cuonghoclaptrinh.io.vn/admin/login" target="_blank" class="btn" style="text-decoration:none; text-align:center;">
            <span>Truy cập Đăng nhập Quản trị</span>
          </a>
          <button class="btn btn-secondary" onclick="stopServer()">
            <span>Đóng công cụ cài đặt</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let verifiedUrl = '';
    let generatedSecret = '';

    function showAlert(elemId, type, msg) {
      const el = document.getElementById(elemId);
      el.className = 'alert alert-' + type;
      el.innerHTML = msg;
      el.style.display = 'block';
    }

    function hideAlert(elemId) {
      const el = document.getElementById(elemId);
      el.style.display = 'none';
    }

    async function checkConnection() {
      const url = document.getElementById('supabase-url').value.trim();
      const btn = document.getElementById('btn-check-db');
      hideAlert('alert-db');
      document.getElementById('migration-box').style.display = 'none';

      if (!url) {
        showAlert('alert-db', 'error', 'Vui lòng dán chuỗi kết nối Supabase vào ô trên.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang kiểm tra kết nối TLS...';

      try {
        const res = await fetch('/api/check-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (data.success) {
          verifiedUrl = url;
          generatedSecret = data.authSecret;
          if (data.hasTables) {
            showAlert('alert-db', 'success', '✓ Kết nối thành công tới Supabase (' + data.host + ') qua kênh Strict TLS! Database đã có sẵn đầy đủ bảng dữ liệu (' + data.lessonCount + ' bài học). Mời Bạn chuyển sang Bước 2.');
            unlockStep2();
          } else {
            showAlert('alert-db', 'warning', '✓ Đã kết nối thành công tới máy chủ Supabase (' + data.host + ')! Tuy nhiên Database chưa có cấu trúc bảng.');
            document.getElementById('migration-box').style.display = 'block';
          }
        } else {
          showAlert('alert-db', 'error', '<strong>Thao tác cần làm:</strong> ' + data.error);
        }
      } catch (err) {
        showAlert('alert-db', 'error', 'Lỗi kết nối nội bộ: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Kiểm tra kết nối Supabase</span>';
      }
    }

    async function runMigration() {
      const btn = document.getElementById('btn-run-migration');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang tạo bảng & nạp 156 bài học... (khoảng 30 giây)';

      try {
        const res = await fetch('/api/migrate-and-seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: verifiedUrl })
        });
        const data = await res.json();

        if (data.success) {
          document.getElementById('migration-box').style.display = 'none';
          showAlert('alert-db', 'success', '🎉 ' + data.message + ' Bất biến dữ liệu đạt 100%: 156 bài học Draft / 0 bài Published. Mời Bạn chuyển sang Bước 2.');
          unlockStep2();
        } else {
          showAlert('alert-db', 'error', '<strong>Thao tác cần làm:</strong> ' + data.error);
        }
      } catch (err) {
        showAlert('alert-db', 'error', 'Lỗi tiến trình nạp: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Tự động Tạo Bảng & Nạp 156 Bài Học</span>';
      }
    }

    function unlockStep2() {
      const box2 = document.getElementById('box-step2');
      box2.style.opacity = '1';
      box2.style.pointerEvents = 'auto';
      document.getElementById('admin-email').focus();
    }

    async function createAdmin() {
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-pass').value;
      const confirmPass = document.getElementById('admin-confirm-pass').value;
      const btn = document.getElementById('btn-create-admin');
      hideAlert('alert-admin');

      if (!email) {
        showAlert('alert-admin', 'error', 'Vui lòng nhập email quản trị.');
        return;
      }
      if (!password) {
        showAlert('alert-admin', 'error', 'Vui lòng nhập mật khẩu.');
        return;
      }
      if (password !== confirmPass) {
        showAlert('alert-admin', 'error', 'Mật khẩu xác nhận không khớp. Vui lòng gõ lại.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Đang băm mật khẩu và tạo tài khoản...';

      try {
        const res = await fetch('/api/create-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: verifiedUrl, email, password })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('alert-admin', 'success', '✓ ' + data.message);
          showStep3(data.netlifyVars);
        } else {
          showAlert('alert-admin', 'error', '<strong>Thao tác cần làm:</strong> ' + data.error);
        }
      } catch (err) {
        showAlert('alert-admin', 'error', 'Lỗi khởi tạo: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Tạo Tài Khoản Quản Trị Viên</span>';
      }
    }

    function showStep3(netlifyVars) {
      document.getElementById('box-step3').style.display = 'block';
      document.getElementById('netlify-vars-content').innerText = netlifyVars;
      document.getElementById('box-step3').scrollIntoView({ behavior: 'smooth' });
    }

    function copyNetlifyVars() {
      const text = document.getElementById('netlify-vars-content').innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Đã sao chép 4 biến môi trường vào clipboard!');
      });
    }

    async function stopServer() {
      if (confirm('Xác nhận hoàn tất và đóng công cụ cài đặt nội bộ?')) {
        await fetch('/api/stop-server', { method: 'POST' });
        document.body.innerHTML = '<div style="text-align:center; padding:60px; font-family:sans-serif;"><h2>Đã đóng công cụ cài đặt an toàn.</h2><p style="color:#666; margin-top:10px;">Bạn có thể tắt tab trình duyệt này.</p></div>';
      }
    }
  </script>
</body>
</html>`;

export function startSetupServer() {
  const server = http.createServer(async (req, res) => {
    // Chỉ chấp nhận kết nối từ loopback 127.0.0.1
    const clientIp = req.socket.remoteAddress;
    if (clientIp !== "127.0.0.1" && clientIp !== "::1" && clientIp !== "::ffff:127.0.0.1") {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden: Localhost access only");
      return;
    }

    if (req.method === "GET" && (req.url === "/" || req.url === "/setup")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML_CONTENT);
      return;
    }

    // Helper đọc JSON body
    const readJson = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(new Error("Invalid JSON body"));
          }
        });
        req.on("error", reject);
      });
    };

    // 1. API Kiểm tra kết nối Supabase
    if (req.method === "POST" && req.url === "/api/check-connection") {
      try {
        const { url } = await readJson();
        const check = cleanConnectionUrl(url || "");
        if (!check.valid) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: check.error }));
          return;
        }

        const pool = new Pool({
          connectionString: check.url,
          ssl: { rejectUnauthorized: true },
          connectionTimeoutMillis: 10000,
        });

        try {
          await pool.query("SELECT 1;");

          // Kiểm tra xem đã có bảng lessons và users chưa
          const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('lessons', 'users', 'levels');
          `);

          const tableNames = tableCheck.rows.map((r) => r.table_name);
          const hasTables = tableNames.includes("lessons") && tableNames.includes("users");

          let lessonCount = 0;
          if (hasTables) {
            const countRes = await pool.query("SELECT COUNT(*) as cnt FROM lessons;");
            lessonCount = parseInt(countRes.rows[0].cnt, 10);
          }

          // Sinh khóa AUTH_SECRET ngẫu nhiên 256-bit
          const authSecret = crypto.randomBytes(32).toString("hex");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              host: check.host,
              dbName: check.dbName,
              hasTables,
              lessonCount,
              authSecret,
            })
          );
        } catch (dbErr: any) {
          let userGuidance = `Không thể kết nối tới cơ sở dữ liệu: ${dbErr.message}`;
          if (dbErr.message.includes("password authentication failed")) {
            userGuidance =
              "Mật khẩu database Supabase chưa đúng. Thao tác tiếp theo: Hãy vào Supabase Dashboard ➜ Project Settings ➜ Database ➜ Bấm 'Reset Database Password' để đặt mật khẩu mới, sau đó dán lại vào đây.";
          } else if (dbErr.message.includes("ENOTFOUND") || dbErr.message.includes("getaddrinfo")) {
            userGuidance =
              "Không tìm thấy máy chủ Supabase. Thao tác tiếp theo: Kiểm tra lại chuỗi kết nối và đảm bảo Bạn đã copy đúng thẻ URI trên Supabase Dashboard.";
          } else if (dbErr.message.includes("self signed") || dbErr.message.includes("certificate")) {
            userGuidance =
              "Lỗi chứng chỉ số TLS máy chủ. Thao tác tiếp theo: Đảm bảo chuỗi kết nối sử dụng hostname chính thức của Supabase có chứng chỉ hợp lệ.";
          }

          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: userGuidance }));
        } finally {
          await pool.end().catch(() => {});
        }
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // 2. API Khởi tạo bảng và nạp Master Data V1.2 (Migration & Seed)
    if (req.method === "POST" && req.url === "/api/migrate-and-seed") {
      try {
        const { url } = await readJson();
        const check = cleanConnectionUrl(url || "");
        if (!check.valid) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: check.error }));
          return;
        }

        const childEnv: NodeJS.ProcessEnv = {
          ...process.env,
          DATABASE_URL: check.url,
          DIRECT_URL: check.url,
          APP_ENV: "production",
          NODE_ENV: "production",
        };

        // Chạy migration deploy
        try {
          execFileSync("pnpm", ["prisma", "migrate", "deploy"], {
            env: childEnv,
            cwd: process.cwd(),
            shell: process.platform === "win32",
          });
        } catch (migErr: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: `Lỗi khi chạy migration cấu trúc bảng: ${migErr.message}. Thao tác tiếp theo: Kiểm tra quyền tài khoản database trên Supabase.`,
            })
          );
          return;
        }

        // Chạy seed 156 bài học
        try {
          execFileSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], {
            env: childEnv,
            cwd: process.cwd(),
            shell: process.platform === "win32",
          });
        } catch (seedErr: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: `Lỗi khi nạp Master Data: ${seedErr.message}. Thao tác tiếp theo: Thử bấm nạp lại lần nữa.`,
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Đã khởi tạo thành công cấu trúc bảng và nạp đủ 156 bài học Master Data V1.2!",
          })
        );
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // 3. API Tạo tài khoản Admin Production
    if (req.method === "POST" && req.url === "/api/create-admin") {
      try {
        const { url, email, password } = await readJson();
        const check = cleanConnectionUrl(url || "");
        if (!check.valid) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: check.error }));
          return;
        }

        const trimmedEmail = (email || "").trim().toLowerCase();
        if (!trimmedEmail) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Vui lòng nhập địa chỉ email quản trị." }));
          return;
        }

        if (FORBIDDEN_EMAILS.includes(trimmedEmail)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Email này là email demo/mặc định bị cấm. Thao tác tiếp theo: Hãy nhập email thực tế của Ban Quản Trị.",
            })
          );
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Định dạng email không hợp lệ." }));
          return;
        }

        const policyCheck = validatePasswordPolicy(password || "");
        if (!policyCheck.valid) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: policyCheck.reason }));
          return;
        }

        const pool = new Pool({
          connectionString: check.url,
          ssl: { rejectUnauthorized: true },
          connectionTimeoutMillis: 10000,
        });

        try {
          const passwordHash = await bcrypt.hash(password, 12);
          const userId = crypto.randomUUID();

          const query = `
            INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())
            ON CONFLICT (email)
            DO UPDATE SET
              password_hash = $3,
              role = 'admin',
              is_active = true,
              updated_at = NOW()
            RETURNING id, email, role, is_active;
          `;

          const resDb = await pool.query(query, [userId, trimmedEmail, passwordHash]);
          const user = resDb.rows[0];

          // Ghi nhật ký audit
          await pool.query(
            `
            INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
            VALUES ($1, $2, 'ADMIN_ACCOUNT_INITIALIZED', 'user', $3, $4, NOW());
          `,
            [
              crypto.randomUUID(),
              user.id,
              user.id,
              JSON.stringify({
                email: user.email,
                role: user.role,
                source: "one_click_setup_wizard",
                timestamp: new Date().toISOString(),
              }),
            ]
          );

          // Tạo mẫu biến môi trường cho Netlify
          const authSecret = crypto.randomBytes(32).toString("hex");
          const netlifyVars = `DATABASE_URL="${check.url}"\nDIRECT_URL="${check.url}"\nAUTH_SECRET="${authSecret}"\nAPP_ENV="production"`;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              message: `Đã khởi tạo thành công Quản trị viên: ${user.email}`,
              userId: user.id,
              netlifyVars,
            })
          );
        } finally {
          await pool.end().catch(() => {});
        }
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // 4. API Đóng server
    if (req.method === "POST" && req.url === "/api/stop-server") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
      setTimeout(() => {
        console.log("\n[SETUP] Người dùng đã đóng công cụ cài đặt an toàn. Tạm biệt!");
        process.exit(0);
      }, 500);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(PORT, HOST, () => {
    console.log("==================================================================");
    console.log("   TỦ SÁCH ÁO LAM — CÔNG CỤ KHỞI TẠO QUẢN TRỊ VIÊN 1-CLICK        ");
    console.log("   (Môi trường nội bộ bảo mật: http://127.0.0.1:3333)             ");
    console.log("==================================================================\n");
    console.log(`• Đang mở trình duyệt tại: http://localhost:${PORT} ...`);
    console.log("• Để dừng công cụ, Bạn có thể nhấn Ctrl+C trên cửa sổ này bất kỳ lúc nào.\n");

    // Tự động mở trình duyệt web của người dùng
    try {
      const openCmd =
        process.platform === "win32"
          ? `start http://localhost:${PORT}`
          : process.platform === "darwin"
          ? `open http://localhost:${PORT}`
          : `xdg-open http://localhost:${PORT}`;
      execSync(openCmd);
    } catch {
      console.log(`• Vui lòng mở trình duyệt và truy cập: http://localhost:${PORT}`);
    }
  });
}

if (require.main === module) {
  startSetupServer();
}
