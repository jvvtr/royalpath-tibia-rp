# Item sprites

The PNG files in this directory reproduce item artwork from **Tibia** so
players can visually identify the equipment discussed by RoyalPath.

- Tibia and its item artwork are owned by CipSoft GmbH.
- RoyalPath is an unofficial, non-commercial fan project and is not endorsed
  by CipSoft.
- These third-party images are **not covered by RoyalPath's MIT license**.
- Source records were obtained from the
  [TibiaData Item API by ByteWizards](https://tibiadata.bytewizards.de/) and,
  for ammunition absent from that catalog, the
  [TibiaWiki on Fandom](https://tibia.fandom.com/).
- The catalog synchronizer keeps Paladin-compatible equipment and ammunition,
  excludes entries marked unobtainable, and stores each active sprite locally
  so the GitHub Pages build does not depend on a third-party image request at
  runtime.
- Original WebP/GIF files were converted to 32 × 32 transparent PNGs without
  redrawing the artwork.

`manifest.json` records the source URL, source type, dimensions and SHA-256
checksum for every local PNG. If a rights holder requests removal, these files
should be removed and the application's built-in text fallback will remain
usable.
