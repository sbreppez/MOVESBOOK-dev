import { useState } from 'react';

export const useSearchFilter = ({ cats, inCat }) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = search.trim() ? (() => {
    const q = search.toLowerCase();
    const catHits = cats.filter(c => c.toLowerCase().includes(q));
    const moveHits = cats.flatMap(cat =>
      inCat(cat)
        .filter(m => m.name.toLowerCase().includes(q))
        .map(m => ({ ...m, _cat: cat }))
    );
    return { catHits, moveHits };
  })() : null;

  return { search, setSearch, showSearch, setShowSearch, searchResults };
};
