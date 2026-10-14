# scripts/build_windows.ps1 - RedactLocal Windows MSI & Executable Build Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building RedactLocal for Windows (Tauri v2 / WebView2)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Prerequisites
if (-not (Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Error "Rust and Cargo are required. Install via https://rustup.rs"
    exit 1
}

# 2. Check for Tauri CLI
if (-not (Get-Command "cargo-tauri" -ErrorAction SilentlyContinue)) {
    Write-Host "[1/3] Installing Tauri v2 CLI..." -ForegroundColor Yellow
    cargo install tauri-cli --version "^2.0.0"
}

# 3. Synchronize Web Dist Assets
Write-Host "[2/3] Verifying production dist bundle..." -ForegroundColor Green
if (-not (Test-Path "dist/studio.html")) {
    Write-Error "dist/studio.html not found! Run npm run build or copy web assets first."
    exit 1
}

# 4. Build Windows Installers (.msi and .exe via NSIS / WiX)
Write-Host "[3/3] Compiling RedactLocal Windows application..." -ForegroundColor Green
cargo tauri build --target x86_64-pc-windows-msvc

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ✓ Windows Build Complete!" -ForegroundColor Green
Write-Host " Output Installers located in: src-tauri/target/release/bundle/" -ForegroundColor Green
Write-Host " - NSIS (.exe): src-tauri/target/release/bundle/nsis/" -ForegroundColor Green
Write-Host " - WiX (.msi):  src-tauri/target/release/bundle/msi/" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
