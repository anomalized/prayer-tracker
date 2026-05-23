"use client";
import{useEffect,useRef}from"react";

interface Props{theme:string;className?:string;height?:number}

function getCSSVar(name:string):string{
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function CanvasBackground({theme,className="",height}:Props){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const rafRef=useRef<number>(0);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d")!;
    let t=0;
    const reduced=window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    const resize=()=>{
      canvas.width=canvas.parentElement?.offsetWidth??window.innerWidth;
      canvas.height=height??(canvas.parentElement?.offsetHeight??300);
    };
    resize();
    const ro=new ResizeObserver(resize);
    ro.observe(canvas.parentElement??document.body);

    // Stars
    const starCount=theme==="pearl-mist"?0:70;
    const stars=Array.from({length:starCount},(_,i)=>({
      x:Math.random()*2000,y:Math.random()*800,
      r:Math.random()*1.2+0.2,
      phase:Math.random()*Math.PI*2,
      speed:Math.random()*0.008+0.002,
      twinkleAmp:Math.random()*0.6+0.2,
    }));

    // Aurora blobs
    const blobs=[
      {bx:0.2,by:0.5,rx:220,ry:80,freq:0.0011,ph:0},
      {bx:0.7,by:0.4,rx:180,ry:100,freq:0.0008,ph:2.1},
      {bx:0.5,by:0.75,rx:240,ry:60,freq:0.0014,ph:4.2},
    ];

    // Petal/particle floaters (rose garden, pearl mist)
    const usePetals=["rose-garden","pearl-mist"].includes(theme);
    const petals=usePetals?Array.from({length:18},()=>({
      x:Math.random()*2000,y:Math.random()*800+200,
      size:Math.random()*6+3,
      vx:(Math.random()-0.5)*0.3,vy:-(Math.random()*0.4+0.1),
      rotation:Math.random()*360,rotSpeed:(Math.random()-0.5)*1.5,
      alpha:Math.random()*0.4+0.1,
    })):[];

    // Crescent moon
    const hasCrescent=["midnight-mosque","sapphire-suhoor","emerald"].includes(theme);

    // Dune silhouette (desert only)
    const hasDunes=theme==="desert-dusk";

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // 30fps throttle

    const draw=(time: number)=>{
      rafRef.current=requestAnimationFrame(draw);

      if (document.hidden) return; // Pause when tab is inactive

      const elapsed = time - lastTime;
      if (elapsed < fpsInterval) return; // Throttle to 30fps
      lastTime = time - (elapsed % fpsInterval);

      t++;
      ctx.clearRect(0,0,canvas.width,canvas.height);

      // Base background
      const bgBase=getCSSVar("--canvas-bg-base")||"#0a0a0a";
      ctx.fillStyle=bgBase;
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Desert: gradient sky
      if(hasDunes){
        const sky=ctx.createLinearGradient(0,0,0,canvas.height);
        sky.addColorStop(0,"#1a0808");
        sky.addColorStop(0.5,"#8a2810");
        sky.addColorStop(1,"#c04020");
        ctx.fillStyle=sky;ctx.fillRect(0,0,canvas.width,canvas.height);
        const sunY=canvas.height*0.18+Math.sin(t*0.001)*5;
        const sg=ctx.createRadialGradient(canvas.width*0.5,sunY,0,canvas.width*0.5,sunY,100);
        sg.addColorStop(0,"rgba(255,200,60,0.4)");sg.addColorStop(1,"transparent");
        ctx.fillStyle=sg;ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();ctx.moveTo(0,canvas.height*0.72);
        for(let x=0;x<=canvas.width;x+=8){
          ctx.lineTo(x,canvas.height*0.70+Math.sin(x*0.015+t*0.0005)*10+Math.sin(x*0.04)*4);
        }
        ctx.lineTo(canvas.width,canvas.height);ctx.lineTo(0,canvas.height);ctx.closePath();
        ctx.fillStyle="rgba(0,0,0,0.45)";ctx.fill();
      }

      // Aurora blobs
      const glowRGB=getCSSVar("--canvas-glow-color")||"120,120,120";
      if(!hasDunes){
        blobs.forEach(g=>{
          const bx=(g.bx+Math.sin(t*g.freq+g.ph)*0.07)*canvas.width;
          const by=(g.by+Math.cos(t*g.freq*0.7+g.ph)*0.06)*canvas.height;
          ctx.save();ctx.scale(1,g.ry/g.rx);
          const grad=ctx.createRadialGradient(bx,by*g.rx/g.ry,0,bx,by*g.rx/g.ry,g.rx);
          grad.addColorStop(0,`rgba(${glowRGB},0.13)`);
          grad.addColorStop(1,"transparent");
          ctx.fillStyle=grad;ctx.beginPath();ctx.arc(bx,by*g.rx/g.ry,g.rx,0,Math.PI*2);ctx.fill();ctx.restore();
        });
      }

      // Stars
      const pRGB=getCSSVar("--canvas-particle-color")||"255,255,255";
      stars.forEach(s=>{
        const alpha=s.twinkleAmp*0.5+s.twinkleAmp*0.5*Math.sin(t*s.speed+s.phase);
        ctx.beginPath();
        ctx.arc((s.x/2000)*canvas.width,(s.y/800)*canvas.height,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${pRGB},${alpha})`;ctx.fill();
        if(s.r>0.9&&Math.sin(t*s.speed*0.5+s.phase)>0.7){
          const sx=(s.x/2000)*canvas.width,sy=(s.y/800)*canvas.height;
          ctx.strokeStyle=`rgba(${pRGB},${alpha*0.5})`;ctx.lineWidth=0.5;
          ctx.beginPath();ctx.moveTo(sx-s.r*2,sy);ctx.lineTo(sx+s.r*2,sy);ctx.stroke();
          ctx.beginPath();ctx.moveTo(sx,sy-s.r*2);ctx.lineTo(sx,sy+s.r*2);ctx.stroke();
        }
      });

      // Petal/particle floaters
      petals.forEach(p=>{
        if(!reduced){
          p.x+=p.vx;p.y+=p.vy;p.rotation+=p.rotSpeed;
          if(p.y<-20){p.y=canvas.height+20;p.x=Math.random()*canvas.width;}
          if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0;
        }
        ctx.save();
        ctx.translate(p.x,p.y);ctx.rotate(p.rotation*Math.PI/180);
        ctx.beginPath();
        ctx.ellipse(0,0,p.size,p.size*0.6,0,0,Math.PI*2);
        ctx.fillStyle=`rgba(${pRGB},${p.alpha})`;ctx.fill();
        ctx.restore();
      });

      // Crescent moon
      if(hasCrescent){
        const moonX=canvas.width*0.84,moonY=30,moonR=hasDunes?0:18;
        if(moonR>0){
          const glowA=0.6+0.2*Math.sin(t*0.012);
          ctx.save();
          ctx.shadowColor=`rgba(${getCSSVar("--canvas-glow-color")||"247,194,93"},${glowA})`;
          ctx.shadowBlur=18;
          ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);
          ctx.fillStyle=`rgba(${getCSSVar("--canvas-glow-color")||"247,194,93"},${glowA})`;ctx.fill();
          ctx.restore();
          ctx.beginPath();ctx.arc(moonX+moonR*0.65,moonY-moonR*0.18,moonR*0.84,0,Math.PI*2);
          ctx.fillStyle=bgBase;ctx.fill();
        }
      }

    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(rafRef.current);ro.disconnect();};
  },[theme,height]);

  return (
    <canvas ref={canvasRef} className={className} aria-hidden="true" />
  );
}
