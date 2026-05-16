// Adds a Log Today log as a HOME note + pushes it onto the default home stack.
// One-shot: caller decides whether to invoke (checkbox state). No back-link to
// the source log; the home note is independent thereafter.
export function createHomeNoteFromLog({ section, date, summary, setIdeas, setHomeStack }) {
  if (!setIdeas || !setHomeStack || !summary) return;
  const [y, m, d] = String(date).split("-");
  const datePart = (y && m && d) ? `${d}/${m}/${y}` : String(date);
  const id = Date.now().toString();
  setIdeas(prev => [{
    id,
    type: "note",
    title: `${section} ${datePart}`,
    text: summary,
    link: "",
    showDate: null,
    createdDate: new Date().toISOString(),
  }, ...prev]);
  setHomeStack(prev => ({
    ...prev,
    defaultStack: [{ id, type: "note" }, ...((prev && prev.defaultStack) || [])],
  }));
}
