// Parsing défensif basé sur des ancres texte stables (insensible aux classes hashées RTS).

function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n').map((s) => s.trim()).filter(Boolean);
}

function sectionBounds(lines, startLabel, endLabels) {
  const start = lines.findIndex((l) => l.includes(startLabel));
  if (start === -1) return null;
  let end = lines.length;
  for (const lbl of endLabels) {
    const e = lines.findIndex((l, i) => i > start && l.includes(lbl));
    if (e !== -1 && e < end) end = e;
  }
  return { start, end };
}

export function parseCommunity(html) {
  const lines = stripToText(html);

  // --- Membres : motif #rang / "Points totaux : N Pts" / nom / [admin] / "N Pkt" ---
  const ids = (html.match(/\/users\/([A-Za-z0-9]+)/g) || []).map((s) => s.split('/').pop());
  const members = [];
  const mb = sectionBounds(lines, 'Classement des membres', ['Classement des groupes', 'Experts']);
  const range = mb ? lines.slice(mb.start, mb.end) : lines;
  for (let i = 0; i < range.length; i++) {
    const rm = /^#(\d+)$/.exec(range[i]);
    const pm = /^Points totaux\s*:\s*(\d+)/.exec(range[i + 1] || '');
    if (rm && pm) {
      const name = range[i + 2];
      const isAdmin = range[i + 3] === 'admin';
      members.push({
        id: ids[members.length] || null,
        name,
        rank: Number(rm[1]),
        totalPoints: Number(pm[1]),
        isAdmin,
      });
    }
  }

  // --- Experts : 3 valeurs "N Pts" après "Experts" ---
  const experts = [];
  const ei = lines.findIndex((l) => l === 'Experts');
  if (ei !== -1) {
    for (let i = ei + 1; i < lines.length && experts.length < 3; i++) {
      const m = /^(\d+)\s*Pts$/.exec(lines[i]);
      if (m) experts.push(Number(m[1]));
    }
  }

  return { members, experts };
}
