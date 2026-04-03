import React, { Fragment } from 'react';
import { C } from '../../constants/colors';

export const Highlight = ({ text="", query="" }) => {
  if (!query.trim()) return <Fragment>{text}</Fragment>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return <Fragment>{parts.map((p,i) => p.toLowerCase()===query.toLowerCase()
    ? <mark key={i} style={{ background:"#f5c842", color:C.brown, borderRadius:2, padding:"0 1px" }}>{p}</mark>
    : p)}</Fragment>;
};
