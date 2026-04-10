import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { MasterySlider } from '../shared/MasterySlider';
import { masteryColor } from '../../constants/styles';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { computeDecay } from '../../utils/masteryDecay';
import { CAT_COLORS } from '../../constants/categories';
import { MoveModal } from './MoveModal';

const NW=114, NH=50;
export const MapView = ({ moves, category, onAddMove, onDeleteMove, onUpdateMove }) => {
  const t = useT();
  const { settings } = useSettings();
  const decaySensitivity = settings.decaySensitivity || "normal";
  const catColor = CAT_COLORS[category]||C.accent;
  const initNodes = useCallback((mvs)=>{
    const root = { id:"root", label:category, x:180, y:30, isRoot:true, color:catColor, moveId:null };
    const n=mvs.length;
    const children = mvs.map((m,i)=>{
      const angle = n===1 ? -Math.PI/2 : (i/n)*2*Math.PI-Math.PI/2;
      const r = Math.max(130,n*22);
      const { displayMastery } = computeDecay(m, decaySensitivity);
      return { id:`m${m.id}`, label:m.name, x:180+r*Math.cos(angle)-NW/2, y:120+(r*0.65)*Math.sin(angle)-NH/2, isRoot:false, color:masteryColor(displayMastery), moveId:m.id, mastery:displayMastery };
    });
    return [root,...children];
  },[category,catColor,decaySensitivity]);
  const [nodes,setNodes]=useState(()=>initNodes(moves));
  const [edges,setEdges]=useState(()=>moves.map(m=>({from:"root",to:`m${m.id}`})));
  const [scale,setScale]=useState(0.95); const [pan,setPan]=useState({x:20,y:20});
  const [dragging,setDragging]=useState(null); const [dragOff,setDragOff]=useState({x:0,y:0});
  const [panning,setPanning]=useState(false); const [panStart,setPanStart]=useState({});
  const [selected,setSelected]=useState(null); const [connectFrom,setConnectFrom]=useState(null);
  const [mousePos,setMousePos]=useState({x:0,y:0}); const [editNode,setEditNode]=useState(null);
  const svgRef=useRef();

  useEffect(()=>{
    setNodes(prev=>{
      const prevIds=new Set(prev.map(n=>n.id));
      const moveIds=new Set(moves.map(m=>`m${m.id}`));
      const added=moves.filter(m=>!prevIds.has(`m${m.id}`)).map(m=>{
        const angle=Math.random()*2*Math.PI, r=130+Math.random()*70;
        const { displayMastery } = computeDecay(m, decaySensitivity);
        return { id:`m${m.id}`, label:m.name, x:180+r*Math.cos(angle)-NW/2, y:130+r*0.65*Math.sin(angle)-NH/2, isRoot:false, color:masteryColor(displayMastery), moveId:m.id, mastery:displayMastery };
      });
      return [...prev.filter(n=>n.isRoot||moveIds.has(n.id)).map(n=>{ if(n.isRoot)return n; const m=moves.find(mv=>`m${mv.id}`===n.id); if(!m)return n; const { displayMastery } = computeDecay(m, decaySensitivity); return {...n,label:m.name,color:masteryColor(displayMastery),mastery:displayMastery}; }),...added];
    });
    setEdges(prev=>{
      const moveIds=new Set(moves.map(m=>`m${m.id}`));
      const filtered=prev.filter(e=>(e.from==="root"||moveIds.has(e.from))&&(e.to==="root"||moveIds.has(e.to)));
      const existing=new Set(filtered.map(e=>e.to));
      const newEdges=moves.filter(m=>!existing.has(`m${m.id}`)).map(m=>({from:"root",to:`m${m.id}`}));
      return [...filtered,...newEdges];
    });
  },[moves,decaySensitivity]);

  const getNode=id=>nodes.find(n=>n.id===id);
  const svgXY=e=>{ const r=svgRef.current.getBoundingClientRect(); return {x:(e.clientX-r.left-pan.x)/scale,y:(e.clientY-r.top-pan.y)/scale}; };
  const onMDNode=(e,id)=>{ e.stopPropagation(); const {x,y}=svgXY(e); const nd=nodes.find(n=>n.id===id); setDragging(id); setSelected(id); setDragOff({x:x-nd.x,y:y-nd.y}); };
  const onMM=e=>{ const {x,y}=svgXY(e); setMousePos({x,y}); if(dragging)setNodes(p=>p.map(n=>n.id===dragging?{...n,x:x-dragOff.x,y:y-dragOff.y}:n)); else if(panning)setPan({x:panStart.px+(e.clientX-panStart.mx),y:panStart.py+(e.clientY-panStart.my)}); };
  const onMU=()=>{ setDragging(null); setPanning(false); if(connectFrom)setConnectFrom(null); };
  const onMDSvg=e=>{ if(e.target===svgRef.current||e.target.tagName==="svg"){ setSelected(null); setPanning(true); setPanStart({px:pan.x,py:pan.y,mx:e.clientX,my:e.clientY}); } };
  const onNMU=(e,id)=>{ e.stopPropagation(); if(connectFrom&&connectFrom!==id){ const ex=edges.some(ed=>(ed.from===connectFrom&&ed.to===id)||(ed.from===id&&ed.to===connectFrom)); if(!ex)setEdges(p=>[...p,{from:connectFrom,to:id}]); setConnectFrom(null); } };
  const delSel=()=>{ if(!selected||selected==="root")return; const nd=nodes.find(n=>n.id===selected); if(nd?.moveId)onDeleteMove(nd.moveId); setNodes(p=>p.filter(n=>n.id!==selected)); setEdges(p=>p.filter(e=>e.from!==selected&&e.to!==selected)); setSelected(null); };

  return (
    <div style={{ position:"relative", flex:1, overflow:"hidden", background:C.surfaceAlt }}>
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
        <defs><pattern id="woodgrain" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill={C.border} opacity="0.4"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#woodgrain)"/>
      </svg>
      <div style={{ position:"absolute", top:10, left:10, zIndex:10, display:"flex", gap:5 }}>
        <button onClick={onAddMove} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 11px", cursor:"pointer", color:C.text, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:5, fontFamily:"'Georgia',serif" }}>
          <Ic n="plus" s={12} c={C.green}/> {t("addMove")}
        </button>
        {selected&&selected!=="root"&&<Fragment>
          <button onClick={()=>{ const nd=nodes.find(x=>x.id===selected); if(nd?.moveId){ const m=moves.find(mv=>mv.id===nd.moveId); if(m)setEditNode({...nd,...m}); }}} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 11px", cursor:"pointer", color:C.brownMid, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:5, fontFamily:"'Georgia',serif" }}>
            <Ic n="edit" s={12} c={C.brownMid}/> {t("edit")}
          </button>
          <button onClick={delSel} style={{ background:C.surface, border:`1px solid ${C.accent}66`, borderRadius:7, padding:"6px 11px", cursor:"pointer", color:C.accent, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:5, fontFamily:"'Georgia',serif" }}>
            <Ic n="trash" s={12} c={C.accent}/> {t("delete")}
          </button>
        </Fragment>}
      </div>
      <div style={{ position:"absolute", bottom:12, left:12, zIndex:10, display:"flex", flexDirection:"column", gap:4 }}>
        {[["zIn",()=>setScale(s=>Math.min(2.2,s+0.15))],["zOut",()=>setScale(s=>Math.max(0.3,s-0.15))]].map(([ic,fn])=>(
          <button key={ic} onClick={fn} style={{ width:30, height:30, background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic n={ic} s={15} c={C.textSec}/></button>
        ))}
        <button onClick={()=>{setScale(0.95);setPan({x:20,y:20});}} style={{ width:30, height:30, background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.textSec }}>⊙</button>
      </div>
      <svg ref={svgRef} style={{ width:"100%", height:"100%", cursor:panning?"grabbing":connectFrom?"crosshair":"grab" }}
        onMouseMove={onMM} onMouseUp={onMU} onMouseDown={onMDSvg} onMouseLeave={onMU}>
        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {connectFrom&&(()=>{ const fn=getNode(connectFrom); return fn?<line x1={fn.x+NW/2} y1={fn.y+NH/2} x2={mousePos.x} y2={mousePos.y} stroke={C.brownLight} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.8}/>:null; })()}
          {edges.map((e,i)=>{
            const f=getNode(e.from), t=getNode(e.to); if(!f||!t)return null;
            const fx=f.x+NW/2,fy=f.y+NH/2,tx=t.x+NW/2,ty=t.y+NH/2,mx=(fx+tx)/2,my=(fy+ty)/2;
            return <g key={i}><line x1={fx} y1={fy} x2={tx} y2={ty} stroke={C.border} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7}/>
              <g onClick={()=>setEdges(p=>p.filter((_,idx)=>idx!==i))} style={{cursor:"pointer"}}>
                <circle cx={mx} cy={my} r={7} fill={C.surfaceAlt} stroke={C.border} strokeWidth={1}/>
                <text x={mx} y={my+4} textAnchor="middle" fill={C.textMuted} fontSize={10} fontWeight={700} style={{pointerEvents:"none",userSelect:"none"}}>×</text>
              </g>
            </g>;
          })}
          {nodes.map(node=>{
            const isSel=selected===node.id, col=node.isRoot?catColor:node.color;
            return <g key={node.id} transform={`translate(${node.x},${node.y})`} onMouseDown={e=>onMDNode(e,node.id)} onMouseUp={e=>onNMU(e,node.id)} onDoubleClick={e=>{e.stopPropagation();if(!node.isRoot){const m=moves.find(mv=>mv.id===node.moveId);if(m)setEditNode({...node,...m});}}} style={{cursor:dragging===node.id?"grabbing":"grab"}}>
              {isSel&&<rect x={-5} y={-5} width={NW+10} height={NH+10} rx={13} fill={`${col}18`} stroke={col} strokeWidth={1.5}/>}
              <rect x={0} y={0} width={NW} height={NH} rx={9} fill={node.isRoot?C.surface:C.bg} stroke={isSel?col:node.isRoot?`${col}88`:C.border} strokeWidth={node.isRoot?2:1}/>
              <rect x={0} y={0} width={NW} height={3} rx={2} fill={col}/>
              <text x={NW/2} y={node.isRoot?27:19} textAnchor="middle" fill={C.brown} fontSize={node.isRoot?11:10} fontWeight={node.isRoot?800:700} fontFamily="'Georgia',serif" style={{pointerEvents:"none",userSelect:"none"}}>{node.label.length>14?node.label.slice(0,13)+"…":node.label}</text>
              {!node.isRoot&&<Fragment>
                <rect x={10} y={32} width={NW-20} height={3} rx={1.5} fill={C.border}/>
                <rect x={10} y={32} width={(NW-20)*(node.mastery/100)} height={3} rx={1.5} fill={col}/>
                <text x={NW/2} y={43} textAnchor="middle" fill={col} fontSize={8} fontWeight={800} style={{pointerEvents:"none",userSelect:"none"}}>{node.mastery}%</text>
              </Fragment>}
              {!node.isRoot&&<g onMouseDown={e=>{e.stopPropagation();setConnectFrom(node.id);}} style={{cursor:"crosshair"}}>
                <circle cx={NW+1} cy={NH/2} r={6} fill={C.bg} stroke={connectFrom===node.id?C.accent:C.border} strokeWidth={1.5}/>
                <circle cx={NW+1} cy={NH/2} r={2.5} fill={connectFrom===node.id?C.accent:C.textMuted}/>
              </g>}
            </g>;
          })}
        </g>
      </svg>
      <div style={{ position:"absolute", bottom:12, right:12, fontSize:11, color:C.textMuted, textAlign:"right", lineHeight:1.7, pointerEvents:"none" }}>{t("mapHelpDrag")}<br/>{t("mapHelpConnect")}</div>
      {editNode&&<MoveModal move={editNode} onClose={()=>setEditNode(null)} onSave={f=>{onUpdateMove(editNode.moveId,f);setEditNode(null);}}/>}
    </div>
  );
};
