module.exports = function (tok, entry) {
  const { stem, phon, osa } = globalThis.RPG;
  if (tok === entry.form) return 1;
  if (tok.length <= 2 || entry.form.length <= 2) return 0;
  const ts = stem(tok);
  if (ts === entry.stem && ts.length >= 3) return 0.95;
  const tp = phon(tok);
  if (tp.length >= 3 && tp === entry.phon) return 0.9;
  const L = Math.max(ts.length, entry.stem.length);
  const allowed = L <= 3 ? 0 : L <= 5 ? 1 : L <= 8 ? 2 : 3;
  if (allowed) {
    const dist = osa(ts, entry.stem);
    if (dist <= allowed) return 0.88 - 0.08 * dist;
    const dp = tp.length >= 4 ? osa(tp, entry.phon) : 9;
    if (dp === 1 && L >= 5) return 0.74;
  }
  if (ts.length >= 5 && entry.stem.length > ts.length && entry.stem.indexOf(ts) === 0) return 0.7;
  return 0;
};
