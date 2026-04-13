@echo off
bun build src/app.tsx --compile --outfile pos.exe --minify --windows-icon=assets/icon.ico
upx --best pos.exe
copy config.json config.json >nul