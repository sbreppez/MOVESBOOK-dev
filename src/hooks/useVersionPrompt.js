import { useState } from 'react';

export const VERSION_CHIPS = [
  { key: "entry",  label: "changeEntry" },
  { key: "exit",   label: "changeExit" },
  { key: "speed",  label: "changeSpeed" },
  { key: "level",  label: "changeLevel" },
  { key: "mirror", label: "mirrorIt" },
];

export const useVersionPrompt = ({ moves, vocabTab, versionPromptsShown, onSettingsChange }) => {
  const [versionMove, setVersionMove] = useState(null);

  const versionShown = versionPromptsShown || [];
  const today = new Date();

  const versionEligible = vocabTab === "moves" ? moves.find(m => {
    if ((m.mastery || 0) < 75) return false;
    if (versionShown.includes(m.id)) return false;
    if (!m.date) return false;
    const d = new Date(m.date);
    return (today - d) / (1000 * 60 * 60 * 24) >= 30;
  }) : null;

  const dismissVersion = (id) => {
    if (onSettingsChange) {
      onSettingsChange(p => ({
        ...p,
        versionPromptsShown: [...(p.versionPromptsShown || []), id]
      }));
    }
  };

  const openVersion = (move, chipKey) => {
    dismissVersion(move.id);
    setVersionMove({ ...move, _versionChip: chipKey });
  };

  const closeVersion = () => setVersionMove(null);

  return {
    versionEligible,
    versionMove,
    openVersion,
    closeVersion,
    dismissVersion,
    VERSION_CHIPS,
  };
};
