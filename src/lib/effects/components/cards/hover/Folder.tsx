// @ts-nocheck
"use client";

import { useState } from 'react';

const folderStyles = `
.folder { transition:all 0.2s ease-in; cursor:pointer; }
.folder:not(.folder--click):hover { transform:translateY(-8px); }
.folder:not(.folder--click):hover .folder-paper { transform:translate(-50%,0%); }
.folder:not(.folder--click):hover .folder__front { transform:skew(15deg) scaleY(0.6); }
.folder:not(.folder--click):hover .folder-right { transform:skew(-15deg) scaleY(0.6); }
.folder.open { transform:translateY(-8px); }
.folder.open .folder-paper:nth-child(1) { transform:translate(-120%,-70%) rotateZ(-15deg); }
.folder.open .folder-paper:nth-child(1):hover { transform:translate(-120%,-70%) rotateZ(-15deg) scale(1.1); }
.folder.open .folder-paper:nth-child(2) { transform:translate(10%,-70%) rotateZ(15deg); height:80%; }
.folder.open .folder-paper:nth-child(2):hover { transform:translate(10%,-70%) rotateZ(15deg) scale(1.1); }
.folder.open .folder-paper:nth-child(3) { transform:translate(-50%,-100%) rotateZ(5deg); height:80%; }
.folder.open .folder-paper:nth-child(3):hover { transform:translate(-50%,-100%) rotateZ(5deg) scale(1.1); }
.folder.open .folder__front { transform:skew(15deg) scaleY(0.6); }
.folder.open .folder-right { transform:skew(-15deg) scaleY(0.6); }
.folder__back { position:relative; width:100px; height:80px; background:var(--folder-back-color); border-radius:0px 10px 10px 10px; }
.folder__back::after { position:absolute; z-index:0; bottom:98%; left:0; content:''; width:30px; height:10px; background:var(--folder-back-color); border-radius:5px 5px 0 0; }
.folder-paper { position:absolute; z-index:2; bottom:10%; left:50%; transform:translate(-50%,10%); width:70%; height:80%; background:var(--paper-1); border-radius:10px; transition:all 0.3s ease-in-out; }
.folder-paper:nth-child(2) { background:var(--paper-2); width:80%; height:70%; }
.folder-paper:nth-child(3) { background:var(--paper-3); width:90%; height:60%; }
.folder__front { position:absolute; z-index:3; width:100%; height:100%; background:var(--folder-color); border-radius:5px 10px 10px 10px; transform-origin:bottom; transition:all 0.3s ease-in-out; }
`;

const darkenColor = (hex, percent) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 - percent))));
  const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 - percent))));
  const b = Math.max(0, Math.min(255, Math.floor((num & 0xff) * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const Folder = ({ color = '#5227FF', size = 1, items = [], className = '' }) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor('#ffffff', 0.1);
  const paper2 = darkenColor('#ffffff', 0.05);

  const handleClick = () => {
    setOpen(prev => !prev);
    if (open) setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const offsetY = (e.clientY - rect.top - rect.height / 2) * 0.15;
    setPaperOffsets(prev => { const n = [...prev]; n[index] = { x: offsetX, y: offsetY }; return n; });
  };

  const handlePaperMouseLeave = (e, index) => {
    setPaperOffsets(prev => { const n = [...prev]; n[index] = { x: 0, y: 0 }; return n; });
  };

  return (
    <>
      <style>{folderStyles}</style>
      <div style={{ transform: `scale(${size})` }} className={className}>
        <div className={`folder ${open ? 'open' : ''}`} style={{ '--folder-color': color, '--folder-back-color': folderBackColor, '--paper-1': paper1, '--paper-2': paper2, '--paper-3': '#ffffff' }} onClick={handleClick}>
          <div className="folder__back">
            {papers.map((item, i) => (
              <div key={i} className={`folder-paper paper-${i+1}`}
                onMouseMove={e => handlePaperMouseMove(e, i)}
                onMouseLeave={e => handlePaperMouseLeave(e, i)}
                style={open ? { '--magnet-x': `${paperOffsets[i]?.x || 0}px`, '--magnet-y': `${paperOffsets[i]?.y || 0}px` } : {}}>
                {item}
              </div>
            ))}
            <div className="folder__front"></div>
            <div className="folder__front folder-right"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Folder;
