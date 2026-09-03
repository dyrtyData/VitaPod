from __future__ import annotations

import json

from pipeline import setup_pipeline


def main() -> None:
    manifest = setup_pipeline()
    print(
        json.dumps(
            {
                "status": "ready",
                "ezklVersion": manifest["ezklVersion"],
                "modelSha256": manifest["modelSha256"],
                "settingsSha256": manifest["settingsSha256"],
                "verificationKeySha256": manifest["verificationKeySha256"],
                "setupSeconds": manifest["timingsSeconds"]["setup"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
