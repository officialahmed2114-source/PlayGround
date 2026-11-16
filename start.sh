#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
RUNNER_TEMP="${RUNNER_TEMP:-/home/runner/work/_temp}"
OUTPUT_DIR="$PROJECT_DIR/dist"

# Keep the deployed app self-contained inside the project directory.
/usr/bin/time -p npm install --no-audit --no-fund
/usr/bin/time -p mkdir -p "$OUTPUT_DIR"
/usr/bin/time -p cp index.html "$OUTPUT_DIR/index.html"
/usr/bin/time -p cp styles.css "$OUTPUT_DIR/styles.css"
/usr/bin/time -p cp game.js "$OUTPUT_DIR/game.js"
/usr/bin/time -p mkdir -p "$RUNNER_TEMP/omgithub-web"
/usr/bin/time -p env RUNNER_TEMP="$RUNNER_TEMP" PROJECT_DIR="$PROJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" node --input-type=module -e 'import { writeFileSync } from "node:fs"; writeFileSync(`${process.env.RUNNER_TEMP}/omgithub-web/deployment-output.json`, JSON.stringify({ project: process.env.PROJECT_DIR, directory: process.env.OUTPUT_DIR }))'

# npm start remains the foreground server process managed by the controller.
/usr/bin/time -p env PORT="$PORT" STATIC_DIR="$OUTPUT_DIR" npm start
