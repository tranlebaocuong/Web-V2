@echo off
chcp 65001 > nul
title TỦ SÁCH ÁO LAM - One-Click Admin Setup
cd /d "%~dp0"

echo ====================================================================
echo    TỦ SÁCH ÁO LAM — CÔNG CỤ KHỞI TẠO QUẢN TRỊ VIÊN 1-CLICK
echo ====================================================================
echo.
echo Đang khởi động giao diện cài đặt tại http://localhost:3333 ...
echo Trình duyệt web sẽ tự động mở trong giây lát.
echo.

pnpm exec tsx scripts/one-click-setup.ts

pause
