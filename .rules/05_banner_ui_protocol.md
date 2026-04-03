---
description: "Core UI/UX guidelines for Foxmon banner alignment and responsive scaling."
---

# UI/UX Banner Synchronization Protocol

This document enforces the strict layout mathematically required bounds for maintaining exact proportions between Main Banners and Wing (Side) Banners across the Foxmon Web App.

## 1. Absolute Golden Ratio Equality
**Rule**: The side banners MUST be an exact 90-degree rotated reflection of the main grid banners.
- **Main Horizontal Banners**: Set to `aspect-[3/2]` (Width 1.5 : Height 1).
- **Side Vertical Banners**: Set to `aspect-[2/3]` (Width 1 : Height 1.5).

If a main banner renders as exactly `180px` wide and `120px` tall, the corresponding side banner MUST render as `120px` wide and `180px` tall at that exact same breakpoint. Any deviation from this symmetry violates the UI/UX protocol.

## 2. Dynamic Wing Calculations (The 1:1 Equation)
Because the responsive CSS Grid automatically scales grid items based on container fractions, the side banners must manually clamp their widths to match the mathematical height of the grid cells.
- Calculate the Grid Cell Width: `(ContainerWidth - MainPadding - (Gaps * GapWidth)) / NumberOfColumns`.
- Calculate the Grid Cell Height: `GridCellWidth / 1.5`.
- **Enforcement**: This computed Grid Cell Height MUST be used as the strict width (`w-[...]`) of the side wing elements for that breakpoint.

### Reference Map
- `xl` (1280px): Container 920px (Grid 4 Cols) -> Side Wing Width: `132px`
- `2xl` (1440px): Container 1100px (Grid 5 Cols) -> Side Wing Width: `127px`
- `3xl` (1920px): Container 1500px (Grid 6 Cols) -> Side Wing Width: `148px`
- `4xl` (2560px): Container 2040px (Grid 6 Cols) -> Side Wing Width: `208px`

## 3. Margin Clamping
Never allow side banners to overlap the main container boundaries. Always assign dynamic fixed positions using CSS `calc()` corresponding directly to half the container width plus the exact wing width plus a `15px` safety margin.
