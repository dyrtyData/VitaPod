# VitaPod toolchain image: one pinned linux/arm64 image carries Node, Python, and the
# official EZKL CLI. This file doubles as the reproducibility manifest alongside
# prover/manifest.json. Every dependency below is pinned by version and checksum.
FROM node:22.23.1-bookworm@sha256:5647be709086c696ff32edaaf1c70cd26d1da6ab2b39c32f3c7b4c4a31957e37

# Official EZKL CLI release binary for linux/aarch64 (glibc). The tarball checksum is
# verified here; prover/scripts/check_environment.py re-verifies the extracted binary
# against the digest pinned in prover/src/ezkl_cli.py at runtime.
ARG EZKL_VERSION=v23.0.5
ARG EZKL_TARBALL_SHA256=384af10d6d6c24379789ba29559c7deacf1b4e287a89ad48e13949939d9dffa6

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /tmp/ezkl.tar.gz \
        "https://github.com/zkonduit/ezkl/releases/download/${EZKL_VERSION}/ezkl-linux-aarch64.tar.gz" \
    && echo "${EZKL_TARBALL_SHA256}  /tmp/ezkl.tar.gz" | sha256sum -c - \
    && tar -xzf /tmp/ezkl.tar.gz -C /usr/local/bin ezkl \
    && chmod 0755 /usr/local/bin/ezkl \
    && rm /tmp/ezkl.tar.gz \
    && ldd /usr/local/bin/ezkl \
    && ezkl --version

COPY prover/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/prover \
    && /opt/prover/bin/pip install --no-cache-dir --require-hashes -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

ENV PATH="/opt/prover/bin:${PATH}" \
    PYTHONPATH=/workspace/prover/src \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY contracts/package.json contracts/
RUN npm ci

CMD ["bash"]
