function noteTokens(note: string): Set<string> {
  const normalized = note
    .toLocaleLowerCase()
    .replace(/^\s*\d+\s*세트(?:에서|의)?\s*/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  return new Set(normalized.split(/\s+/u).filter((token) => token.length > 0));
}

export function notesAreEquivalent(left: string, right: string): boolean {
  const leftTokens = noteTokens(left);
  const rightTokens = noteTokens(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) return false;

  const leftText = [...leftTokens].join(" ");
  const rightText = [...rightTokens].join(" ");
  if (leftText === rightText) return true;

  const sharedCount = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const smallerSize = Math.min(leftTokens.size, rightTokens.size);

  return sharedCount >= 5 && sharedCount / smallerSize >= 0.6;
}

export function nonRedundantExerciseNote(
  exerciseNote: string | undefined,
  setNotes: Array<string | undefined>,
): string | undefined {
  const note = exerciseNote?.trim();
  if (!note) return undefined;

  const duplicatesSetNote = setNotes.some(
    (setNote) => setNote && notesAreEquivalent(note, setNote),
  );

  return duplicatesSetNote ? undefined : note;
}
