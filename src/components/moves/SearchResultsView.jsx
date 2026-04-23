import React, { Fragment } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { masteryColor } from '../../constants/styles';
import { CatTile } from './CatTile';
import { Highlight } from '../shared/Highlight';

export const SearchResultsView = ({
  searchResults,
  search,
  catColors,
  setCats,
  renameCategory,
  dupCategory,
  changeCatColor,
  inCat,
  masteredCount,
  setOpenCat,
  setEditMove,
  showMastery,
  showMoveCount,
}) => {
  const { C } = useSettings();
  const t = useT();
  const { catHits, moveHits } = searchResults;

  const sectionHeaderStyle = {
    fontSize:11, fontWeight:800, letterSpacing:1.5,
    color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:6,
  };

  return (
    <>
      {catHits.length>0&&<Fragment>
        <div style={sectionHeaderStyle}>{t("categories")}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {catHits.map(cat=>(
            <CatTile key={cat} name={cat} color={catColors[cat]||C.accent} total={inCat(cat).length} mastered={masteredCount(cat)}
              moves={inCat(cat)} viewMode="tiles"
              showMastery={showMastery} showMoveCount={showMoveCount}
              onClick={()=>setOpenCat(cat)}
              onDelete={()=>setCats(prev=>prev.filter(c=>c!==cat))}
              onRename={n=>renameCategory(cat,n)}
              onDuplicate={()=>dupCategory(cat)}
              onChangeColor={col=>changeCatColor(cat,col)}/>
          ))}
        </div>
      </Fragment>}
      {moveHits.length>0&&<Fragment>
        <div style={sectionHeaderStyle}>{t("moves")}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {moveHits.map(m=>(
            <div key={m.id} onClick={()=>{ setOpenCat(m._cat); setEditMove(m); }}
              style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", borderLeft:`4px solid ${catColors[m._cat]||C.accent}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.text, fontFamily:FONT_DISPLAY, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}><Highlight text={m.name} query={search}/></div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>{m._cat}</div>
              </div>
              <span style={{ fontSize:11, color:masteryColor(m.mastery), fontWeight:700 }}>{m.mastery}%</span>
            </div>
          ))}
        </div>
      </Fragment>}
      {catHits.length===0&&moveHits.length===0&&
        <div style={{ textAlign:"center", padding:30, color:C.textMuted }}><p style={{fontSize:13}}>{t("searchNoResults")} "{search}"</p></div>}
    </>
  );
};
