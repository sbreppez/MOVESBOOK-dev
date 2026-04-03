import React from 'react';

export const ZoomWrap = ({ children, zoom=1 }) => (
  <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column",
    zoom: zoom, WebkitTextSizeAdjust:"none" }}>
    {children}
  </div>
);
