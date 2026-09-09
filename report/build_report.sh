#!/usr/bin/env bash
# Build the VitaPod research report PDF.
# Renders the report markdown -> PDF with pandoc + xelatex (Latin Modern serif,
# 1in margins, blue links — matching the vectox/vigilAI report style).
# Requires: pandoc, a TeX engine (xelatex)
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$PATH:/Library/TeX/texbin"

MD="vitapod-zkml-eligibility.md"
OUT="vitapod-zkml-eligibility_paper.pdf"

echo "Building $OUT from $MD..."

pandoc "$MD" -o "$OUT" --resource-path "." \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V linkcolor:blue \
  -V documentclass=article \
  -V fontsize=11pt \
  --metadata title=

echo "Built $OUT"
ls -la "$OUT"
