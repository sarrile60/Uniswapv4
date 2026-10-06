# Fix BITUSDT Vertical Alignment in Header

A one-line CSS fix to vertically center the BITUSDT nav item with the other header links.

For the platform owner who noticed BITUSDT sits slightly lower than the other nav items.

---

## What changes

The BITUSDT `<li>` in the header nav is misaligned because the inline SVG fire icon pushes the baseline down. Fix: add `align-items: center` to the `.bitusdt-item a` rule and set the SVG to `vertical-align: middle` so the text and icon share the same vertical center as the other nav links.

## What stays the same

Everything else — no JS changes, no layout changes, no functionality changes. Pure CSS tweak on the existing `.bitusdt-item` selector.

## Assumptions

- The fix targets only the BITUSDT nav item; all other nav items are already correctly aligned.
