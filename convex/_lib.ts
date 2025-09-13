// convex/_lib.ts
export const norm = (s: unknown) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const slugify = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const now = () => Date.now();
