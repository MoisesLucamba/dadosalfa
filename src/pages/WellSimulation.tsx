import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

/* ─── PALETTE & TOKENS ──────────────────────────────────────── */
const C = {
  bg: "#02040a",
  surface: "#060c18",
  surfaceHigh: "#0b1629",
  border: "rgba(0,168,255,0.12)",
  borderBright: "rgba(0,168,255,0.35)",
  primary: "#00a8ff",
  primaryDim: "rgba(0,168,255,0.15)",
  green: "#00e5a0",
  amber: "#ffb830",
  red: "#ff4365",
  text: "#e8f4ff",
  textMuted: "rgba(180,210,255,0.45)",
  textDim: "rgba(120,165,220,0.6)",
  glow: "0 0 30px rgba(0,168,255,0.25)",
  glowGreen: "0 0 20px rgba(0,229,160,0.3)",
};

/* ─── DATA ───────────────────────────────────────────────────── */
const WELLS = [
  { id:1, name:"Girassol-4", block:"Bloco 17", op:"TotalEnergies", field:"Girassol", basin:"Congo", type:"Produção", depth:4250, wd:1360, status:"Concluído", prob:92, risk:"Baixo", prod:18500, api:30.2, lat:-7.35, lng:11.82 },
  { id:2, name:"Dalia-7", block:"Bloco 17", op:"TotalEnergies", field:"Dalia", basin:"Congo", type:"Desenvolvimento", depth:3890, wd:1400, status:"Em análise", prob:85, risk:"Médio", prod:15200, api:23.6, lat:-7.42, lng:11.75 },
  { id:3, name:"Kaombo Norte-2", block:"Bloco 32", op:"TotalEnergies", field:"Kaombo", basin:"Congo", type:"Exploração", depth:4680, wd:1950, status:"Concluído", prob:78, risk:"Médio", prod:22400, api:27.8, lat:-7.58, lng:11.64 },
  { id:4, name:"Plutónio-A3", block:"Bloco 18", op:"BP", field:"Plutónio", basin:"Congo", type:"Produção", depth:3540, wd:1300, status:"Concluído", prob:88, risk:"Baixo", prod:16800, api:33.1, lat:-7.68, lng:11.55 },
  { id:5, name:"Kissanje-5", block:"Bloco 15/06", op:"Eni Angola", field:"Kissanje", basin:"Kwanza", type:"Avaliação", depth:3980, wd:850, status:"Em análise", prob:71, risk:"Alto", prod:8900, api:29.4, lat:-8.12, lng:12.34 },
  { id:6, name:"Mafumeira Sul-1", block:"Bloco 0", op:"Chevron", field:"Mafumeira Sul", basin:"Cabinda", type:"Exploração", depth:2450, wd:65, status:"Concluído", prob:94, risk:"Baixo", prod:11200, api:36.5, lat:-5.42, lng:12.08 },
  { id:7, name:"Pazflor-B2", block:"Bloco 17", op:"TotalEnergies", field:"Pazflor", basin:"Congo", type:"Desenvolvimento", depth:4120, wd:1200, status:"Pendente", prob:82, risk:"Médio", prod:19600, api:25.9, lat:-7.31, lng:11.88 },
  { id:8, name:"CLOV-E1", block:"Bloco 17", op:"TotalEnergies", field:"CLOV", basin:"Congo", type:"Produção", depth:3750, wd:1350, status:"Concluído", prob:90, risk:"Baixo", prod:21000, api:31.7, lat:-7.39, lng:11.79 },
];

const PROD_DATA = [
  { m:"Jan", real:145200, cap:168000, ai:142000 },
  { m:"Fev", real:142800, cap:168000, ai:139500 },
  { m:"Mar", real:139500, cap:165000, ai:137000 },
  { m:"Abr", real:137200, cap:165000, ai:134500 },
  { m:"Mai", real:135100, cap:162000, ai:132000 },
  { m:"Jun", real:133800, cap:162000, ai:130000 },
  { m:"Jul", real:131500, cap:160000, ai:128000 },
  { m:"Ago", real:129800, cap:160000, ai:126500 },
];

const GEO_RADAR = [
  { s:"Porosidade", A:78, B:65 },
  { s:"Permeab.", A:85, B:72 },
  { s:"Saturação", A:62, B:58 },
  { s:"Net Pay", A:91, B:80 },
  { s:"Conectiv.", A:70, B:55 },
  { s:"Pressão", A:82, B:75 },
];

const RISK_DATA = [
  { f:"Pressão do Reserv.", v:72, t:80 },
  { f:"Integridade", v:88, t:90 },
  { f:"Risco Geológico", v:45, t:60 },
  { f:"Subsidência", v:32, t:50 },
  { f:"Corrosão", v:58, t:70 },
  { f:"H₂S / CO₂", v:25, t:40 },
];

const DECLINE = [
  { y:"2024", r:26500, p:26500 },
  { y:"2025", r:24200, p:24800 },
  { y:"2026", r:22100, p:23200 },
  { y:"2027", r:null, p:21700 },
  { y:"2028", r:null, p:20300 },
  { y:"2029", r:null, p:19100 },
  { y:"2030", r:null, p:18000 },
];

/* ─── 3D MATH HELPERS ────────────────────────────────────────── */
function rotateY(x, y, z, a) { return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}
function rotateX(x, y, z, a) {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}
function project(x, y, z, fov, cx, cy) {
  const scale = fov / (fov + z);
  return [cx + x * scale, cy + y * scale, scale];
}

/* ─── DUAL-MODE INTERACTIVE WELL CANVAS ────────────────────── */
function WellCanvas({ well, viewMode = "3d" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const T = useRef(0);
  const cam = useRef({ yaw: 0.4, pitch: 0.3, zoom: 1, autoSpin: true });
  const drag = useRef({ active:false, lastX:0, lastY:0, velX:0, velY:0 });
  const touch = useRef({ active:false, lastX:0, lastY:0, dist:0 });
  const blend = useRef(1); // 0=2D, 1=3D
  const viewModeRef = useRef(viewMode);
  const particles = useRef([]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    particles.current = Array.from({ length: 90 }, () => ({
      u: (Math.random()-0.5)*8, v: Math.random()*600,
      vy: -(0.4+Math.random()*1.1), r:1+Math.random()*2.5,
      alpha:0.3+Math.random()*0.5, hue:175+Math.random()*50,
    }));

    const onDown = (e) => { drag.current={active:true,lastX:e.clientX,lastY:e.clientY,velX:0,velY:0}; cam.current.autoSpin=false; canvas.style.cursor="grabbing"; };
    const onMove = (e) => {
      if(!drag.current.active) return;
      const dx=e.clientX-drag.current.lastX, dy=e.clientY-drag.current.lastY;
      drag.current.velX=dx; drag.current.velY=dy;
      cam.current.yaw+=dx*0.008;
      cam.current.pitch+=dy*0.006*blend.current;
      cam.current.pitch=Math.max(-1.2,Math.min(1.2,cam.current.pitch));
      drag.current.lastX=e.clientX; drag.current.lastY=e.clientY;
    };
    const onUp = () => { drag.current.active=false; canvas.style.cursor="grab"; };
    const onWheel = (e) => { e.preventDefault(); cam.current.zoom=Math.max(0.35,Math.min(2.8,cam.current.zoom-e.deltaY*0.001)); };
    const onDblClick = () => { cam.current.autoSpin=!cam.current.autoSpin; };
    const onTouchStart = (e) => {
      if(e.touches.length===1){touch.current={active:true,lastX:e.touches[0].clientX,lastY:e.touches[0].clientY,dist:0};cam.current.autoSpin=false;}
      else if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;touch.current.dist=Math.sqrt(dx*dx+dy*dy);}
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if(e.touches.length===1&&touch.current.active){
        const dx=e.touches[0].clientX-touch.current.lastX,dy=e.touches[0].clientY-touch.current.lastY;
        cam.current.yaw+=dx*0.01; cam.current.pitch+=dy*0.008*blend.current;
        cam.current.pitch=Math.max(-1.2,Math.min(1.2,cam.current.pitch));
        touch.current.lastX=e.touches[0].clientX;touch.current.lastY=e.touches[0].clientY;
      } else if(e.touches.length===2){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(touch.current.dist>0) cam.current.zoom=Math.max(0.35,Math.min(2.8,cam.current.zoom*(d/touch.current.dist)));
        touch.current.dist=d;
      }
    };
    const onTouchEnd = () => { touch.current.active=false; };

    canvas.addEventListener("mousedown",onDown); canvas.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp); canvas.addEventListener("wheel",onWheel,{passive:false});
    canvas.addEventListener("dblclick",onDblClick); canvas.addEventListener("touchstart",onTouchStart,{passive:false});
    canvas.addEventListener("touchmove",onTouchMove,{passive:false}); canvas.addEventListener("touchend",onTouchEnd);
    canvas.style.cursor="grab";

    const draw = (ts) => {
      T.current=ts*0.001;
      const W=canvas.offsetWidth, H=canvas.offsetHeight;
      ctx.clearRect(0,0,W,H);

      // smooth blend towards target mode
      const vm=viewModeRef.current;
      const blendTarget = vm==="3d"?1:vm==="2d"?0:0.5;
      blend.current+=(blendTarget-blend.current)*0.055;
      const b=blend.current, b2=1-b;

      // inertia
      if(!drag.current.active){
        drag.current.velX*=0.88; drag.current.velY*=0.88;
        if(!cam.current.autoSpin){
          cam.current.yaw+=drag.current.velX*0.004;
          cam.current.pitch+=drag.current.velY*0.003*b;
          cam.current.pitch=Math.max(-1.2,Math.min(1.2,cam.current.pitch));
        }
      }
      if(cam.current.autoSpin) cam.current.yaw+=(0.004+0.003*b);

      const {yaw,pitch,zoom}=cam.current;
      const ePitch=pitch*b+(-0.04)*b2;
      const eYaw=yaw*b+(Math.PI*0.07)*b2;
      const cx=W/2, cy=H/2;
      const fov=360*zoom;

      const toScreen=(wx,wy,wz)=>{
        let [x,y,z]=rotateX(wx,wy,wz,ePitch);
        [x,y,z]=rotateY(x,y,z,eYaw);
        return project(x,y,z,fov,cx,cy);
      };

      // ── BACKGROUND ──
      const bgR=ctx.createRadialGradient(cx,cy*0.4,0,cx,cy,Math.max(W,H)*0.85);
      bgR.addColorStop(0,"#030e22"); bgR.addColorStop(1,"#010512");
      ctx.fillStyle=bgR; ctx.fillRect(0,0,W,H);
      // scanlines
      ctx.fillStyle=`rgba(0,20,60,${0.018+0.022*b2})`;
      for(let sl=0;sl<H;sl+=2) ctx.fillRect(0,sl,W,1);
      // 2D vertical grid
      if(b2>0.05){
        ctx.globalAlpha=b2*0.07; ctx.strokeStyle="#00a8ff"; ctx.lineWidth=1;
        for(let gx=0;gx<W;gx+=32){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
        ctx.globalAlpha=1;
      }

      // ── SCENE DIMS ──
      const SEA_Y=85, BED_Y=0, HALF=130;
      const TOTAL_D=-420*(well.depth/5000);
      const RES_Y=TOTAL_D*0.75;
      const devX=65*(well.depth/5000);
      const devZ=22*(well.depth/5000);

      // ── GEOLOGICAL LAYERS ──
      const layers=[
        {y0:BED_Y,      y1:BED_Y-30,       col:"#5c2a0a",label:"ARGILA"},
        {y0:BED_Y-30,   y1:BED_Y-68,       col:"#3a1a06",label:"FOLHELHO"},
        {y0:BED_Y-68,   y1:BED_Y-125,      col:"#2a3a15",label:"ARENITO"},
        {y0:BED_Y-125,  y1:BED_Y-192,      col:"#1a2a0f",label:"CALCÁRIO"},
        {y0:BED_Y-192,  y1:TOTAL_D+30,     col:"#0a1c08",label:"RESERVATÓRIO"},
      ];
      layers.forEach(({y0,y1,col,label})=>{
        const corners=[
          [-HALF,y0,HALF],[HALF,y0,HALF],[HALF,y0,-HALF],[-HALF,y0,-HALF],
          [-HALF,y1,HALF],[HALF,y1,HALF],[HALF,y1,-HALF],[-HALF,y1,-HALF],
        ].map(([x,y,z])=>toScreen(x,y,z));
        // 3D faces
        if(b>0.04){
          [[0,1,2,3],[0,1,5,4],[1,2,6,5],[3,2,6,7],[0,3,7,4]].forEach((f,fi)=>{
            ctx.beginPath(); f.forEach((ci,ii)=>{const[sx,sy]=corners[ci];ii===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);}); ctx.closePath();
            ctx.fillStyle=col+Math.round([0.9,0.62,0.72,0.48,0.58][fi]*200).toString(16).padStart(2,"0");
            ctx.globalAlpha=b; ctx.fill();
            ctx.strokeStyle="rgba(0,100,60,0.1)"; ctx.lineWidth=0.5; ctx.stroke();
            ctx.globalAlpha=1;
          });
          const[lx,ly]=toScreen(HALF+5,(y0+y1)/2,-HALF);
          ctx.fillStyle=`rgba(100,190,100,${b*0.42})`; ctx.font="8px 'Courier New',monospace"; ctx.fillText(label,lx,ly);
        }
        // 2D flat bands
        if(b2>0.04){
          const topY=Math.min(corners[0][1],corners[1][1],corners[2][1],corners[3][1]);
          const botY=Math.max(corners[4][1],corners[5][1],corners[6][1],corners[7][1]);
          const gr=ctx.createLinearGradient(0,topY,W,topY);
          gr.addColorStop(0,col+"bb"); gr.addColorStop(0.5,col+"ff"); gr.addColorStop(1,col+"bb");
          ctx.fillStyle=gr; ctx.globalAlpha=b2*0.98; ctx.fillRect(0,topY,W,botY-topY);
          ctx.globalAlpha=b2*0.6; ctx.strokeStyle="rgba(80,150,80,0.25)"; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(W,topY); ctx.stroke();
          ctx.globalAlpha=b2*0.7; ctx.fillStyle="rgba(130,210,130,0.65)"; ctx.font=`bold 10px 'Courier New',monospace`;
          ctx.fillText(label,10,topY+14); ctx.globalAlpha=1;
        }
      });

      // ── WATER VOLUME 3D ──
      if(b>0.06){
        for(let wy2=BED_Y;wy2<=SEA_Y;wy2+=20){
          const a=(wy2-BED_Y)/(SEA_Y-BED_Y);
          const wc=[[-HALF,wy2,HALF],[HALF,wy2,HALF],[HALF,wy2,-HALF],[-HALF,wy2,-HALF]].map(([x,y,z])=>toScreen(x,y,z));
          ctx.beginPath(); wc.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)); ctx.closePath();
          ctx.fillStyle=`rgba(0,60,140,${0.032*a*b})`; ctx.fill();
        }
      }
      // ── WATER 2D ──
      if(b2>0.08){
        const[,sy0]=toScreen(0,SEA_Y,0),[,sy1]=toScreen(0,BED_Y,0);
        const wg=ctx.createLinearGradient(0,sy0,0,sy1);
        wg.addColorStop(0,"rgba(0,60,140,0.2)"); wg.addColorStop(1,"rgba(0,20,80,0.05)");
        ctx.fillStyle=wg; ctx.globalAlpha=b2*0.92; ctx.fillRect(0,sy0,W,sy1-sy0); ctx.globalAlpha=1;
      }

      // ── SEA SURFACE ──
      {
        const surf=[[-HALF,SEA_Y,HALF],[HALF,SEA_Y,HALF],[HALF,SEA_Y,-HALF],[-HALF,SEA_Y,-HALF]]
          .map(([x,y,z])=>toScreen(x,SEA_Y+Math.sin(x*0.05+T.current)*2,z));
        ctx.beginPath(); surf.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)); ctx.closePath();
        ctx.fillStyle="rgba(0,80,180,0.15)"; ctx.fill();
        ctx.strokeStyle=`rgba(0,168,255,${0.28+Math.sin(T.current)*0.08})`; ctx.lineWidth=1.5+b2; ctx.stroke();
        // 2D animated wave
        if(b2>0.15){
          const[,wsy]=toScreen(0,SEA_Y,0);
          ctx.save(); ctx.globalAlpha=b2*0.65; ctx.strokeStyle="rgba(0,168,255,0.6)"; ctx.lineWidth=2;
          ctx.shadowBlur=12; ctx.shadowColor="#00a8ff";
          ctx.beginPath();
          for(let sx2=0;sx2<W;sx2+=4){
            const wy3=wsy+Math.sin(sx2*0.04+T.current*1.5)*3+Math.sin(sx2*0.02+T.current)*2;
            sx2===0?ctx.moveTo(sx2,wy3):ctx.lineTo(sx2,wy3);
          }
          ctx.stroke(); ctx.shadowBlur=0; ctx.restore();
        }
      }

      // ── FPSO PLATFORM ──
      {
        const hy=SEA_Y+5,hw=70,hh=10,hd=22;
        const hull=[[-hw,hy,-hd],[hw,hy,-hd],[hw,hy,hd],[-hw,hy,hd],[-hw,hy-hh,-hd],[hw,hy-hh,-hd],[hw,hy-hh,hd],[-hw,hy-hh,hd]]
          .map(([x,y,z])=>toScreen(x,y,z));
        [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]].forEach((f,fi)=>{
          ctx.beginPath(); f.forEach((ci,ii)=>ii===0?ctx.moveTo(hull[ci][0],hull[ci][1]):ctx.lineTo(hull[ci][0],hull[ci][1])); ctx.closePath();
          ctx.fillStyle=["#2a3d5e","#1a2a3e","#243550","#1e3048","#1a2840","#243050"][fi]; ctx.fill();
          ctx.strokeStyle="rgba(0,168,255,0.25)"; ctx.lineWidth=0.8; ctx.stroke();
        });
        const dP=[toScreen(-8,hy,0),toScreen(8,hy,0),toScreen(8,hy+48,0),toScreen(-8,hy+48,0)];
        ctx.beginPath(); dP.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy)); ctx.closePath();
        ctx.fillStyle="#3a4e6e"; ctx.fill();
        ctx.strokeStyle="rgba(60,100,140,0.5)"; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(dP[0][0],dP[0][1]); ctx.lineTo(dP[2][0],dP[2][1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dP[1][0],dP[1][1]); ctx.lineTo(dP[3][0],dP[3][1]); ctx.stroke();
        const fp=toScreen(62,hy+22,0);
        const fR=7+Math.sin(T.current*4)*4;
        const fg=ctx.createRadialGradient(fp[0],fp[1],0,fp[0],fp[1],fR*2.5);
        fg.addColorStop(0,"rgba(255,210,0,0.95)"); fg.addColorStop(0.3,"rgba(255,100,0,0.55)"); fg.addColorStop(1,"rgba(255,80,0,0)");
        ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(fp[0],fp[1],fR*2.5,0,Math.PI*2); ctx.fill();
        [-1,1].forEach(s=>{const lp=toScreen(hw*s,hy-2,0);ctx.fillStyle=`rgba(0,255,120,${0.6+Math.sin(T.current*2+s)*0.4})`;ctx.beginPath();ctx.arc(lp[0],lp[1],3,0,Math.PI*2);ctx.fill();});
      }

      // ── RISER ──
      {
        const rPts=[SEA_Y,SEA_Y*0.55,SEA_Y*0.25,BED_Y].map(ry=>toScreen(0,ry,0));
        ctx.beginPath(); ctx.moveTo(rPts[0][0],rPts[0][1]); rPts.slice(1).forEach(([sx,sy])=>ctx.lineTo(sx,sy));
        ctx.strokeStyle="#3a6090"; ctx.lineWidth=(5+3*b2)*zoom; ctx.stroke();
        ctx.strokeStyle="rgba(0,168,255,0.22)"; ctx.lineWidth=(2+1*b2)*zoom; ctx.stroke();
      }

      // ── WELLBORE ──
      {
        const nPts=24;
        const wPts=Array.from({length:nPts+1},(_,i)=>{
          const u=i/nPts;
          return toScreen(Math.sin(u*0.7)*devX,BED_Y+(TOTAL_D-BED_Y)*u,Math.sin(u*0.5)*devZ);
        });
        ctx.beginPath(); wPts.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy));
        ctx.strokeStyle="#4a7aaa"; ctx.lineWidth=(7+4*b2)*zoom; ctx.lineJoin="round"; ctx.lineCap="round";
        ctx.shadowBlur=6+5*b2; ctx.shadowColor="rgba(0,100,200,0.4)"; ctx.stroke();
        ctx.beginPath(); wPts.forEach(([sx,sy],i)=>i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy));
        ctx.strokeStyle="rgba(120,200,255,0.18)"; ctx.lineWidth=(2.5+1.5*b2)*zoom; ctx.shadowBlur=0; ctx.stroke();
        // 2D casing label
        if(b2>0.2&&wPts.length>2){
          const[mx,my]=wPts[Math.floor(wPts.length/2)];
          ctx.save(); ctx.globalAlpha=b2*0.55; ctx.fillStyle="#00a8ff"; ctx.font="8px 'Courier New',monospace";
          ctx.fillText("REVESTIMENTO",mx+10,my); ctx.restore();
        }
      }

      // ── GEOLOGICAL FAULT ──
      if(well.risk!=="Baixo"){
        const f1=toScreen(-92,BED_Y-18,22),f2=toScreen(-62,TOTAL_D+35,-12);
        ctx.save(); ctx.setLineDash([6,4]); ctx.strokeStyle="rgba(255,67,101,0.55)"; ctx.lineWidth=1.8;
        ctx.shadowBlur=10; ctx.shadowColor="rgba(255,67,101,0.5)";
        ctx.beginPath(); ctx.moveTo(f1[0],f1[1]); ctx.lineTo(f2[0],f2[1]); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur=0;
        ctx.fillStyle="rgba(255,67,101,0.82)"; ctx.font="bold 9px 'Courier New',monospace";
        ctx.fillText("FALHA",f1[0]+4,f1[1]+14); ctx.restore();
      }

      // ── RESERVOIR GLOW ──
      {
        const[rx,ry]=toScreen(devX*0.78,RES_Y,0);
        const pulse=0.7+Math.sin(T.current*1.5)*0.3;
        const rg=ctx.createRadialGradient(rx,ry,0,rx,ry,72*zoom);
        rg.addColorStop(0,`rgba(0,229,160,${0.38*pulse})`); rg.addColorStop(0.5,`rgba(0,180,120,${0.14*pulse})`); rg.addColorStop(1,"rgba(0,100,60,0)");
        ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(rx,ry,72*zoom,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=`rgba(0,229,160,${0.5*pulse})`; ctx.lineWidth=1.5;
        ctx.shadowBlur=14; ctx.shadowColor="rgba(0,229,160,0.6)";
        ctx.beginPath(); ctx.arc(rx,ry,44*zoom,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0;
        // 2D: full-width reservoir band glow
        if(b2>0.12){
          const[,ry2a]=toScreen(0,RES_Y+22,0),[,ry2b]=toScreen(0,RES_Y-22,0);
          ctx.globalAlpha=b2*0.13; ctx.fillStyle="#00e5a0"; ctx.fillRect(0,ry2b,W,ry2a-ry2b); ctx.globalAlpha=1;
        }
      }

      // ── PERFORATIONS ──
      for(let pi=0;pi<6;pi++){
        const u=0.72+pi*0.04;
        const[sx,sy]=toScreen(Math.sin(u*0.7)*devX,BED_Y+(TOTAL_D-BED_Y)*u,Math.sin(pi*1.1)*11);
        const pA=0.5+Math.sin(T.current*3+pi*1.2)*0.5;
        ctx.fillStyle=`rgba(0,168,255,${0.72*pA})`; ctx.shadowBlur=7; ctx.shadowColor="#00a8ff";
        ctx.beginPath(); ctx.arc(sx,sy,3*zoom,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        if(b2>0.18){
          ctx.save(); ctx.globalAlpha=b2*0.38; ctx.strokeStyle="#00a8ff"; ctx.lineWidth=1; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+28,sy); ctx.stroke();
          ctx.setLineDash([]); ctx.restore();
        }
      }

      // ── OIL PARTICLES ──
      particles.current.forEach(p=>{
        p.v+=p.vy;
        if(p.v<-SEA_Y*0.25) p.v=600;
        const u=Math.max(0,Math.min(1,(600-p.v)/600));
        const[sx,sy,sc]=toScreen(
          Math.sin(u*0.7)*devX+p.u*(0.35-b*0.2),
          BED_Y+(TOTAL_D-BED_Y)*u*0.9+(600-p.v)*0.25,
          Math.sin(u*0.5)*devZ+p.u*(0.15+b*0.1)
        );
        if(sc<0) return;
        const a=p.alpha*(0.4+Math.sin(T.current*2+p.v*0.03)*0.4);
        ctx.fillStyle=`hsla(${p.hue},80%,65%,${a})`;
        ctx.beginPath(); ctx.arc(sx,sy,p.r*(sc*b+0.7*b2)*1.8,0,Math.PI*2); ctx.fill();
      });

      // ── 2D DEPTH RULER ──
      if(b2>0.1){
        const[,sy0]=toScreen(0,SEA_Y,0),[,sy1]=toScreen(0,BED_Y,0),[,sy2]=toScreen(0,TOTAL_D,0);
        ctx.globalAlpha=b2*0.55;
        ctx.strokeStyle="rgba(0,168,255,0.25)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(W-18,sy0); ctx.lineTo(W-18,sy2); ctx.stroke();
        [[sy0,"Superfície"],[sy1,`Leito ${well.wd}m`],[sy2,`Total ${well.depth}m`]].forEach(([y4,lbl])=>{
          ctx.fillStyle="#00a8ff"; ctx.beginPath(); ctx.arc(W-18,y4,2,0,Math.PI*2); ctx.fill();
          ctx.fillStyle="rgba(180,210,255,0.6)"; ctx.font="8px 'Courier New',monospace"; ctx.textAlign="right";
          ctx.fillText(lbl,W-24,y4+3);
        });
        ctx.textAlign="left"; ctx.globalAlpha=1;
      }

      // ── HUD PANELS ──
      const hud=[
        {label:"PRESSÃO",value:`${(well.depth*0.1).toFixed(0)} BAR`,col:"#00a8ff"},
        {label:"TEMP",   value:`${(120+well.depth*0.015).toFixed(0)}°C`,col:"#ffb830"},
        {label:"API",    value:`${well.api}°`,col:"#00e5a0"},
        {label:"PROD",   value:`${(well.prod/1000).toFixed(1)}k bbl/d`,col:"#00a8ff"},
      ];
      hud.forEach((h,i)=>{
        const hx=12,hy2=52+i*38;
        ctx.fillStyle="rgba(2,8,24,0.82)"; ctx.beginPath(); ctx.roundRect(hx,hy2,112,30,5); ctx.fill();
        ctx.strokeStyle=h.col+"40"; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(hx,hy2,112,30,5); ctx.stroke();
        ctx.fillStyle=h.col+"90"; ctx.font="7px 'Courier New',monospace"; ctx.fillText(h.label,hx+7,hy2+11);
        ctx.fillStyle=h.col; ctx.font="bold 11px 'Courier New',monospace"; ctx.fillText(h.value,hx+7,hy2+23);
      });

      // ── RISK BADGE ──
      const rCol=well.risk==="Baixo"?"#00e5a0":well.risk==="Médio"?"#ffb830":"#ff4365";
      const rP=0.6+Math.sin(T.current*(well.risk==="Alto"?3:1.2))*0.4;
      ctx.fillStyle="rgba(2,8,24,0.85)"; ctx.beginPath(); ctx.roundRect(W-132,12,120,34,5); ctx.fill();
      ctx.strokeStyle=rCol+"50"; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(W-132,12,120,34,5); ctx.stroke();
      ctx.fillStyle=rCol; ctx.globalAlpha=rP; ctx.beginPath(); ctx.arc(W-120,29,4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      ctx.fillStyle=rCol; ctx.font="bold 9px 'Courier New',monospace"; ctx.fillText(`RISCO ${well.risk.toUpperCase()}`,W-110,33);

      // ── 3D COMPASS ──
      if(b>0.08){
        const cX=W-30,cY=H-30;
        ctx.globalAlpha=b;
        ctx.fillStyle="rgba(2,8,24,0.75)"; ctx.beginPath(); ctx.arc(cX,cY,22,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="rgba(0,168,255,0.12)"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cX,cY,22,0,Math.PI*2); ctx.stroke();
        const nx2=cX+Math.sin(eYaw)*14,ny2=cY-Math.cos(eYaw)*14;
        ctx.strokeStyle="#00a8ff"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cX,cY); ctx.lineTo(nx2,ny2); ctx.stroke();
        ctx.fillStyle="#00a8ff"; ctx.beginPath(); ctx.arc(nx2,ny2,3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="rgba(120,165,220,0.6)"; ctx.font="7px 'Courier New',monospace"; ctx.textAlign="center"; ctx.fillText("N",cX,cY-15); ctx.textAlign="left";
        ctx.globalAlpha=1;
      }

      // ── MODE LABEL ──
      const mLabel=b>0.7?"⊞ 3D ROTATIVO":b<0.3?"⊟ SECÇÃO 2D":"⊕ VISTA HÍBRIDA";
      const mCol=b>0.7?"#00e5a0":b<0.3?"#00a8ff":"#ffb830";
      ctx.fillStyle="rgba(2,8,24,0.72)"; ctx.beginPath(); ctx.roundRect(cx-70,H-36,140,22,4); ctx.fill();
      ctx.fillStyle=mCol; ctx.font="bold 8px 'Courier New',monospace"; ctx.textAlign="center"; ctx.fillText(mLabel,cx,H-21); ctx.textAlign="left";

      // ── TITLE ──
      ctx.fillStyle="rgba(2,8,24,0.78)"; ctx.beginPath(); ctx.roundRect(cx-102,10,204,34,5); ctx.fill();
      ctx.fillStyle="#00a8ff"; ctx.font="bold 11px 'Courier New',monospace"; ctx.textAlign="center"; ctx.fillText(well.name.toUpperCase(),cx,28);
      ctx.fillStyle="rgba(180,210,255,0.45)"; ctx.font="8px 'Courier New',monospace"; ctx.fillText(`${well.block} · ${well.op}`,cx,41); ctx.textAlign="left";

      // ── HINT ──
      if(T.current<6){
        const al=Math.max(0,1-T.current/5);
        ctx.fillStyle=`rgba(2,8,24,${0.6*al})`; ctx.beginPath(); ctx.roundRect(cx-110,H-62,220,22,4); ctx.fill();
        ctx.fillStyle=`rgba(180,210,255,${0.5*al})`; ctx.font="8px 'Courier New',monospace"; ctx.textAlign="center";
        ctx.fillText("ARRASTAR · SCROLL ZOOM · 2×CLICK SPIN · BOTÕES ACIMA",cx,H-47); ctx.textAlign="left";
      }

      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{
      cancelAnimationFrame(animRef.current); window.removeEventListener("resize",resize); window.removeEventListener("mouseup",onUp);
      canvas.removeEventListener("mousedown",onDown); canvas.removeEventListener("mousemove",onMove);
      canvas.removeEventListener("wheel",onWheel); canvas.removeEventListener("dblclick",onDblClick);
      canvas.removeEventListener("touchstart",onTouchStart); canvas.removeEventListener("touchmove",onTouchMove);
      canvas.removeEventListener("touchend",onTouchEnd);
    };
  }, [well]);

  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",userSelect:"none"}} />;
}

/* ─── TOOLTIP ────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(2,8,24,0.95)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <p style={{ color: C.textMuted, fontSize: 10, marginBottom: 6, fontFamily: "Courier New, monospace" }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, fontSize: 11, fontFamily: "Courier New, monospace" }}>
          {e.name}: <b>{typeof e.value === "number" ? e.value.toLocaleString("pt-AO") : e.value}</b>
        </p>
      ))}
    </div>
  );
};

/* ─── CIRCULAR GAUGE ─────────────────────────────────────────── */
function Gauge({ value, max = 100, label, color = C.primary, size = 88 }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(0,168,255,0.08)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dasharray 1s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dy="4" fill={color} fontSize="16" fontWeight="bold" fontFamily="Courier New, monospace">{value}</text>
        <text x="44" y="58" textAnchor="middle" fill={C.textMuted} fontSize="8" fontFamily="Courier New, monospace">/ {max}</text>
      </svg>
      <span style={{ fontSize: 9, color: C.textDim, fontFamily: "Courier New, monospace", letterSpacing: 1 }}>{label}</span>
    </div>
  );
}

/* ─── RISK BAR ───────────────────────────────────────────────── */
function RiskBar({ label, value, threshold }) {
  const col = value >= threshold ? C.red : value >= threshold * 0.7 ? C.amber : C.green;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.textDim, fontFamily: "Courier New, monospace" }}>{label}</span>
        <span style={{ fontSize: 10, color: col, fontFamily: "Courier New, monospace", fontWeight: "bold" }}>{value}%</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(0,168,255,0.08)", borderRadius: 3 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 3, background: col, boxShadow: `0 0 8px ${col}60` }}
        />
        <div style={{ position: "absolute", top: -3, left: `${threshold}%`, width: 2, height: 12, background: C.red + "80", borderRadius: 1 }} />
      </div>
    </div>
  );
}

/* ─── STATUS BADGE ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = { "Concluído": [C.green, "●"], "Em análise": [C.amber, "◐"], "Pendente": [C.textMuted, "○"] };
  const [col, sym] = map[status] || [C.textMuted, "○"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: col, fontFamily: "Courier New, monospace", background: col + "15", border: `1px solid ${col}30`, borderRadius: 4, padding: "2px 8px" }}>
      {sym} {status}
    </span>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function WellSimulation() {
  const [selected, setSelected] = useState(WELLS[0]);
  const [tab, setTab] = useState("prod");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [viewMode, setViewMode] = useState("3d"); // "2d" | "3d" | "blend"

  const riskCol = (r) => r === "Baixo" ? C.green : r === "Médio" ? C.amber : C.red;

  const handleProcess = () => {
    setProcessing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setProcessing(false); return 100; }
        return p + 2;
      });
    }, 50);
  };

  const S = {
    page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Courier New', monospace", padding: "24px", boxSizing: "border-box" },
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", backdropFilter: "blur(8px)" },
    cardHeader: { padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: "bold", letterSpacing: 2, color: C.primary, textTransform: "uppercase" },
    label: { fontSize: 9, color: C.textDim, letterSpacing: 2, textTransform: "uppercase" },
    value: { fontSize: 22, fontWeight: "bold", color: C.text, lineHeight: 1.1 },
    tab: (active) => ({
      padding: "8px 16px", fontSize: 10, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase",
      cursor: "pointer", border: "none", background: active ? C.primaryDim : "transparent",
      color: active ? C.primary : C.textMuted, borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
      transition: "all 0.2s", fontFamily: "Courier New, monospace",
    }),
  };

  const tabs = [
    { id: "prod", label: "Produção" },
    { id: "geo", label: "Geologia" },
    { id: "risk", label: "Riscos" },
    { id: "decline", label: "Declínio" },
  ];

  return (
    <div style={S.page}>
      {/* ── PAGE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 3, height: 32, background: `linear-gradient(180deg, ${C.primary}, ${C.green})`, borderRadius: 2, boxShadow: C.glow }} />
              <div>
                <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 3, marginBottom: 2 }}>AlphaData · Visão Computacional</div>
                <h1 style={{ fontSize: 26, fontWeight: "bold", color: C.text, letterSpacing: 1, margin: 0, lineHeight: 1 }}>
                  SIMULAÇÃO DE POÇOS
                </h1>
              </div>
              <span style={{ fontSize: 9, color: C.green, background: C.green + "15", border: `1px solid ${C.green}30`, borderRadius: 4, padding: "3px 8px", letterSpacing: 1 }}>
                ● LIVE
              </span>
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, letterSpacing: 0.5 }}>
              Bacias de Angola — Congo · Kwanza · Cabinda · {WELLS.length} poços activos
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["+ Nova Simulação", "↓ Exportar", "⊙ Salvar"].map((b, i) => (
              <button key={i} style={{
                padding: "8px 14px", fontSize: 10, fontWeight: "bold", letterSpacing: 1,
                background: i === 2 ? C.primaryDim : "transparent",
                border: `1px solid ${i === 2 ? C.primary : C.border}`,
                color: i === 2 ? C.primary : C.textMuted,
                borderRadius: 6, cursor: "pointer", fontFamily: "Courier New, monospace",
              }}>{b}</button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── WELL SELECTOR ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {WELLS.map((w) => {
          const active = selected.id === w.id;
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w)}
              style={{
                flexShrink: 0, padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                background: active ? C.primaryDim : C.surface,
                border: `1px solid ${active ? C.primary + "60" : C.border}`,
                transition: "all 0.2s",
                boxShadow: active ? `0 0 12px ${C.primary}20` : "none",
                fontFamily: "Courier New, monospace",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: "bold", color: active ? C.primary : C.text, whiteSpace: "nowrap" }}>{w.name}</div>
              <div style={{ fontSize: 9, color: C.textMuted, whiteSpace: "nowrap", marginTop: 2 }}>{w.block} · {w.basin}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskCol(w.risk), boxShadow: `0 0 4px ${riskCol(w.risk)}` }} />
                <span style={{ fontSize: 8, color: riskCol(w.risk) }}>{w.risk}</span>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>

        {/* ── 3D WELL CANVAS ── */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} style={{ ...S.card, position: "relative" }}>
          <div style={S.cardHeader}>
            <div style={S.cardTitle}>
              <span style={{ color: C.green, fontSize: 10 }}>◈</span>
              {viewMode === "2d" ? "Secção Transversal" : viewMode === "blend" ? "Vista Híbrida" : "Visualização 3D"} — {selected.name}
              <span style={{ fontSize: 9, color: C.textMuted, fontWeight: "normal", letterSpacing: 1 }}>
                {selected.lat.toFixed(2)}°S {selected.lng.toFixed(2)}°E
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[{id:"2d",icon:"⊟",label:"2D"},{id:"blend",icon:"⊕",label:"HÍBRIDO"},{id:"3d",icon:"⊞",label:"3D"}].map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                  padding: "4px 10px", fontSize: 9, fontWeight: "bold", letterSpacing: 1,
                  background: viewMode === v.id ? C.primaryDim : "transparent",
                  border: `1px solid ${viewMode === v.id ? C.primary : C.border}`,
                  color: viewMode === v.id ? C.primary : C.textMuted,
                  borderRadius: 5, cursor: "pointer", fontFamily: "Courier New, monospace",
                  transition: "all 0.2s",
                }}>{v.icon} {v.label}</button>
              ))}
              <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                {[C.green, C.amber, C.red].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}` }} />)}
              </div>
            </div>
          </div>
          <div style={{ height: 520, background: "#010714", position: "relative" }}>
            <WellCanvas well={selected} viewMode={viewMode} />
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "12px 20px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            {[
              [C.green, "Reservatório"],
              [C.red, "Falha Geológica"],
              [C.amber, "Zona de Risco"],
              [C.primary, "Perfurações"],
              ["#1e40af", "Coluna d'Água"],
            ].map(([col, lab]) => (
              <div key={lab} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 4px ${col}80` }} />
                <span style={{ fontSize: 9, color: C.textMuted }}>{lab}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 9, color: C.textDim }}>
              Água: {selected.wd.toLocaleString()}m · Total: {selected.depth.toLocaleString()}m
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Well info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.cardTitle}><span>◧</span> {selected.field}</div>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ padding: "14px 16px" }}>
              {[
                ["Operador", selected.op],
                ["Bloco", selected.block],
                ["Bacia", selected.basin],
                ["Tipo", selected.type],
                ["API Gravity", `${selected.api}°`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>{k}</span>
                  <span style={{ fontSize: 10, color: C.text, fontWeight: "bold" }}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gauges */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ ...S.card, padding: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, justifyItems: "center" }}>
              <Gauge value={selected.prob} label="SUCESSO %" color={selected.prob > 85 ? C.green : C.amber} />
              <Gauge value={Math.round(selected.api)} max={50} label="API °" color={C.primary} />
              <Gauge value={Math.round(selected.prod / 1000)} max={30} label="KBBL/D" color={C.green} />
            </div>
          </motion.div>

          {/* Depth bars */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ ...S.card, padding: "16px" }}>
            <div style={{ fontSize: 10, color: C.primary, letterSpacing: 2, marginBottom: 12 }}>PROFUNDIDADE</div>
            <RiskBar label="Prof. Água (m)" value={Math.round(selected.wd / 20)} threshold={85} />
            <RiskBar label="Prof. Total (m)" value={Math.round(selected.depth / 50)} threshold={80} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 9, color: C.textDim }}>Água: {selected.wd.toLocaleString()}m</span>
              <span style={{ fontSize: 9, color: C.textDim }}>Total: {selected.depth.toLocaleString()}m</span>
            </div>
          </motion.div>

          {/* AI Model */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} style={{ ...S.card, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.primary, letterSpacing: 2 }}>MODELO IA</div>
              <span style={{ fontSize: 9, color: C.green, background: C.green + "15", border: `1px solid ${C.green}30`, borderRadius: 4, padding: "2px 8px" }}>● ACTIVO</span>
            </div>
            {[["Precisão", "94.7%"], ["Amostras", "12,847"], ["Arquitectura", "LSTM+RF"], ["Última sync", "agora"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: C.textDim }}>{k}</span>
                <span style={{ fontSize: 9, color: C.text, fontWeight: "bold" }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 4, background: "rgba(0,168,255,0.1)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
              <motion.div animate={{ width: ["60%", "100%", "60%"] }} transition={{ duration: 3, repeat: Infinity }} style={{ height: "100%", background: `linear-gradient(90deg, ${C.primary}, ${C.green})`, borderRadius: 2, boxShadow: `0 0 8px ${C.primary}` }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── UPLOAD ROW ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...S.card, marginBottom: 16 }}>
        <div style={S.cardHeader}>
          <div style={S.cardTitle}>↑ INGESTÃO DE DADOS — {selected.field}</div>
        </div>
        <div style={{ padding: "16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {[
            ["Sísmico 2D/3D", "◈"],
            ["Perfis LAS", "≡"],
            ["Imagens Geo", "⊞"],
            ["Modelos Reserv.", "◎"],
          ].map(([label, sym], i) => {
            const up = uploads.includes(i);
            return (
              <button
                key={i}
                onClick={() => setUploads(u => up ? u.filter(x => x !== i) : [...u, i])}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 20px", borderRadius: 8, cursor: "pointer",
                  background: up ? C.primaryDim : "rgba(255,255,255,0.02)",
                  border: `1px dashed ${up ? C.primary : C.border}`,
                  color: up ? C.primary : C.textMuted, fontFamily: "Courier New, monospace",
                  transition: "all 0.2s", minWidth: 110,
                }}
              >
                <span style={{ fontSize: 18 }}>{up ? "✓" : sym}</span>
                <span style={{ fontSize: 9, letterSpacing: 1 }}>{label}</span>
              </button>
            );
          })}
          <button
            onClick={handleProcess}
            disabled={processing || uploads.length === 0}
            style={{
              marginLeft: "auto", padding: "12px 24px", borderRadius: 8, cursor: uploads.length === 0 ? "not-allowed" : "pointer",
              background: uploads.length > 0 ? C.primaryDim : "rgba(255,255,255,0.02)",
              border: `1px solid ${uploads.length > 0 ? C.primary : C.border}`,
              color: uploads.length > 0 ? C.primary : C.textMuted,
              fontSize: 11, fontWeight: "bold", letterSpacing: 2, fontFamily: "Courier New, monospace",
              boxShadow: uploads.length > 0 ? C.glow : "none", transition: "all 0.2s",
            }}
          >
            {processing ? `⟳ ${Math.round(progress)}%` : "⚡ PROCESSAR IA"}
          </button>
          {processing && (
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ height: 4, background: "rgba(0,168,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div animate={{ width: `${progress}%` }} style={{ height: "100%", background: `linear-gradient(90deg, ${C.primary}, ${C.green})`, boxShadow: `0 0 8px ${C.primary}` }} />
              </div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 4, letterSpacing: 1 }}>A PROCESSAR DADOS SÍSMICOS...</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── CHARTS TABS ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(t => <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
        <div style={{ padding: "20px" }}>
          <AnimatePresence mode="wait">
            {tab === "prod" && (
              <motion.div key="prod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>
                  PROJEÇÃO DE PRODUÇÃO — {selected.block} · {selected.op}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={PROD_DATA}>
                    <defs>
                      <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.textMuted, fontFamily: "Courier New, monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontFamily: "Courier New, monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="cap" stroke={C.textDim} strokeDasharray="4 4" strokeWidth={1} fill="none" name="Capacidade" />
                    <Area type="monotone" dataKey="real" stroke={C.primary} strokeWidth={2.5} fill="url(#gReal)" name="Produção Real (bbl/d)" />
                    <Area type="monotone" dataKey="ai" stroke={C.green} strokeDasharray="6 3" strokeWidth={2} fill="none" name="Previsão IA (bbl/d)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            {tab === "geo" && (
              <motion.div key="geo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>ANÁLISE PETROFÍSICA — {selected.field}</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={GEO_RADAR} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="s" tick={{ fontSize: 10, fill: C.textMuted, fontFamily: "Courier New, monospace" }} />
                    <PolarRadiusAxis angle={30} tick={{ fontSize: 8, fill: C.textDim }} />
                    <Radar name="Poço Actual" dataKey="A" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} dot />
                    <Radar name="Média da Bacia" dataKey="B" stroke={C.amber} fill={C.amber} fillOpacity={0.08} strokeWidth={1.5} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Courier New, monospace" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            {tab === "risk" && (
              <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, marginBottom: 20 }}>MATRIZ DE RISCOS OPERACIONAIS</div>
                {RISK_DATA.map((r) => <RiskBar key={r.f} label={r.f} value={r.v} threshold={r.t} />)}
              </motion.div>
            )}
            {tab === "decline" && (
              <motion.div key="decline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>CURVA DE DECLÍNIO — ANÁLISE LONGO PRAZO</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={DECLINE}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="y" tick={{ fontSize: 10, fill: C.textMuted, fontFamily: "Courier New, monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontFamily: "Courier New, monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<Tip />} />
                    <Line type="monotone" dataKey="r" stroke={C.primary} strokeWidth={2.5} dot={{ fill: C.primary, r: 4 }} name="Real (bbl/d)" connectNulls={false} />
                    <Line type="monotone" dataKey="p" stroke={C.amber} strokeWidth={2} strokeDasharray="6 3" dot={{ fill: C.amber, r: 3 }} name="Projeção IA (bbl/d)" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── TABLE ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={S.card}>
        <div style={S.cardHeader}>
          <div style={S.cardTitle}>⊞ HISTÓRICO DE SIMULAÇÕES</div>
          <span style={{ fontSize: 9, color: C.textDim }}>{WELLS.length} REGISTOS</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "Courier New, monospace" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Poço", "Bloco", "Operador", "Bacia", "Tipo", "Sucesso", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.textDim, letterSpacing: 2, fontSize: 9, fontWeight: "bold" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WELLS.map((w, i) => (
                <motion.tr
                  key={w.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  onClick={() => setSelected(w)}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: selected.id === w.id ? C.primaryDim : "transparent",
                    cursor: "pointer", transition: "background 0.2s",
                  }}
                  onMouseEnter={e => { if (selected.id !== w.id) e.currentTarget.style.background = "rgba(0,168,255,0.04)"; }}
                  onMouseLeave={e => { if (selected.id !== w.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 14px", color: C.text, fontWeight: "bold" }}>{w.name}</td>
                  <td style={{ padding: "12px 14px", color: C.textMuted }}>{w.block}</td>
                  <td style={{ padding: "12px 14px", color: C.textMuted }}>{w.op}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 9, color: C.primary, background: C.primaryDim, border: `1px solid ${C.borderBright}`, borderRadius: 4, padding: "2px 6px" }}>{w.basin}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: C.textMuted }}>{w.type}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 56, height: 4, background: "rgba(0,168,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${w.prob}%`, height: "100%", background: w.prob > 85 ? C.green : w.prob > 70 ? C.amber : C.red, boxShadow: `0 0 4px ${w.prob > 85 ? C.green : C.amber}` }} />
                      </div>
                      <span style={{ color: C.textMuted }}>{w.prob}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={w.status} /></td>
                  <td style={{ padding: "12px 14px" }}>
                    <button style={{ fontSize: 9, color: C.primary, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: "Courier New, monospace", letterSpacing: 1 }}>
                      VISUALIZAR
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── FOOTER ── */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>ALPHADATA · SISTEMA DE MONITORIZAÇÃO DE BACIAS</span>
        <span style={{ fontSize: 9, color: C.textDim }}>
          {selected.name} · {new Date().toLocaleString("pt-AO")}
        </span>
      </div>
    </div>
  );
}