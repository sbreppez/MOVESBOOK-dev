import { useRef, useEffect } from 'react';

export const useWipTriggers = ({
  onAddTrigger,
  onAddTrigger2,
  onBulkTrigger,
  openCat,
  vocabTab,
  setShowAdd,
  setAddingSet,
  setShowLibraryMenu,
  setShowAddCat,
  setBulk,
  onDrill,
}) => {
  const lastAddTrigger = useRef(onAddTrigger);
  useEffect(() => {
    if (onAddTrigger === lastAddTrigger.current) return;
    lastAddTrigger.current = onAddTrigger;
    if (!onAddTrigger) return;
    if (openCat) { setShowAdd(true); return; }
    if (vocabTab === "sets") setAddingSet(true);
    else if (vocabTab === "gap") { if (onDrill) onDrill(null); }
    else setShowLibraryMenu(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire; vocabTab/openCat read fresh from closure
  }, [onAddTrigger]);

  const lastAddTrigger2 = useRef(onAddTrigger2);
  useEffect(() => {
    if (onAddTrigger2 === lastAddTrigger2.current) return;
    lastAddTrigger2.current = onAddTrigger2;
    if (onAddTrigger2) {
      if (vocabTab === "sets") setAddingSet(true);
      else setShowAddCat(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire; vocabTab read fresh from closure
  }, [onAddTrigger2]);

  const lastBulkTrigger = useRef(onBulkTrigger);
  useEffect(() => {
    if (onBulkTrigger === lastBulkTrigger.current) return;
    lastBulkTrigger.current = onBulkTrigger;
    if (onBulkTrigger) setBulk(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-compare guard prevents re-fire
  }, [onBulkTrigger]);
};
