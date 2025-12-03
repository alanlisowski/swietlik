import { useEffect, useRef } from 'react';

export function AbandonedBuilding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;

      const basePixel = 4;
      const baseWidth = 180;
      const baseHeight = 140;
      const scale = Math.max(
        1,
        Math.floor(
          Math.min(canvas.width / (baseWidth * basePixel), canvas.height / (baseHeight * basePixel))
        )
      );
      const pixel = basePixel * scale;
      const gridWidth = Math.ceil(canvas.width / pixel);
      const gridHeight = Math.ceil(canvas.height / pixel);
      const offsetX = Math.floor((gridWidth - baseWidth) / 2);
      const offsetY = Math.floor((gridHeight - baseHeight) / 3);
      const groundStart = offsetY + 80;

      const colors = {
        ground: '#2d3436',
        groundDark: '#1e2123',
        grass: '#27ae60',
        grassDark: '#1e8449',
        wall: '#c5d4de',
        wallDark: '#9fb2c1',
        wallDamaged: '#aebfd0',
        roof: '#b06d3b',
        roofDark: '#8c4f2d',
        roofTile: '#d08348',
        trim: '#dfe7f3',
        window: '#1c2833',
        windowBroken: '#34495e',
        windowGlow: '#0c1118',
        door: '#5d4037',
        doorDark: '#3e2723',
        concrete: '#95a5a6',
        concreteDark: '#7f8c8d',
        trash: '#e74c3c',
        graffiti: '#e67e22',
        graffitiAlt: '#9b59b6',
        metal: '#566573',
        rust: '#a04000',
        ivy: '#2ecc71',
        ivyDark: '#1b8f4f',
        weed: '#196f3d',
        crack: '#17202a',
        star: '#ffffff',
        starDim: '#a8b9d1',
        moon: '#f4e8c1',
        moonShade: '#d4c8a1',
        cloud: '#2d3748',
        cloudDark: '#1a202c'
      };

      const drawPixel = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect((offsetX + x) * pixel, (offsetY + y) * pixel, pixel, pixel);
      };

      const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect((offsetX + x) * pixel, (offsetY + y) * pixel, w * pixel, h * pixel);
      };

      const drawPixelGlobal = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel);
      };

      const drawRectGlobal = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixel, y * pixel, w * pixel, h * pixel);
      };

      // Background sky and ground
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0e27');
      gradient.addColorStop(0.5, '#1a1f3a');
      gradient.addColorStop(1, '#0d1117');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const groundStartPx = groundStart * pixel;
      ctx.fillStyle = colors.concrete;
      ctx.fillRect(0, groundStartPx, canvas.width, canvas.height - groundStartPx);

      // Stars
      const starCount = Math.floor(gridWidth * 0.8);
      const stars: { x: number; y: number; bright: boolean }[] = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.floor(Math.random() * gridWidth),
          y: Math.floor(Math.random() * Math.max(20, groundStart - 10)),
          bright: Math.random() > 0.6
        });
      }
      stars.forEach(star => {
        drawPixelGlobal(star.x, star.y, star.bright ? colors.star : colors.starDim);
        if (star.bright && Math.random() > 0.7) drawPixelGlobal(star.x + 1, star.y, colors.star);
      });

      // Moon
      const moonX = Math.floor(gridWidth * 0.8);
      const moonY = Math.floor(groundStart * 0.5);
      const moonRadius = Math.max(8, Math.floor(8 * scale));
      for (let y = -moonRadius; y <= moonRadius; y++) {
        for (let x = -moonRadius; x <= moonRadius; x++) {
          if (x * x + y * y <= moonRadius * moonRadius) drawPixelGlobal(moonX + x, moonY + y, colors.moon);
        }
      }
      const craters = [
        { x: moonX - 3, y: moonY - 2, r: 2 },
        { x: moonX + 2, y: moonY + 1, r: 1 },
        { x: moonX - 1, y: moonY + 3, r: 1 }
      ];
      craters.forEach(crater => {
        for (let y = -crater.r; y <= crater.r; y++) {
          for (let x = -crater.r; x <= crater.r; x++) {
            if (x * x + y * y <= crater.r * crater.r) drawPixelGlobal(crater.x + x, crater.y + y, colors.moonShade);
          }
        }
      });
      ctx.globalAlpha = 0.15;
      for (let y = -moonRadius - 2; y <= moonRadius + 2; y++) {
        for (let x = -moonRadius - 2; x <= moonRadius + 2; x++) {
          const dist = Math.sqrt(x * x + y * y);
          if (dist > moonRadius && dist <= moonRadius + 2) drawPixelGlobal(moonX + x, moonY + y, colors.star);
        }
      }
      ctx.globalAlpha = 1.0;

      // Clouds
      const drawCloud = (x: number, y: number, width: number) => {
        drawRectGlobal(x + 2, y + 3, width - 4, 2, colors.cloud);
        drawRectGlobal(x + 1, y + 1, width - 2, 2, colors.cloud);
        drawRectGlobal(x + 3, y, width - 6, 1, colors.cloud);
        drawPixelGlobal(x + 2, y, colors.cloud);
        drawPixelGlobal(x + width - 3, y, colors.cloud);
        drawPixelGlobal(x + 2, y + 3, colors.cloudDark);
        drawPixelGlobal(x + 3, y + 4, colors.cloudDark);
        drawPixelGlobal(x + width - 3, y + 3, colors.cloudDark);
      };
      const cloudCount = Math.max(6, Math.floor(gridWidth / 20));
      for (let i = 0; i < cloudCount; i++) {
        drawCloud(
          Math.floor(Math.random() * Math.max(1, gridWidth - 24)),
          Math.floor(Math.random() * Math.max(10, groundStart / 2)),
          12 + Math.floor(Math.random() * 12)
        );
      }
      ctx.globalAlpha = 0.3;
      drawCloud(Math.floor(gridWidth * 0.2), 10, 22);
      drawCloud(Math.floor(gridWidth * 0.6), 8, 16);
      ctx.globalAlpha = 1.0;

      // Ground noise
      const crackCount = Math.floor(gridWidth * gridHeight * 0.012);
      for (let i = 0; i < crackCount; i++) {
        const x = Math.floor(Math.random() * gridWidth);
        const y = groundStart + Math.floor(Math.random() * Math.max(1, gridHeight - groundStart));
        drawPixelGlobal(x, y, colors.concreteDark);
        if (Math.random() > 0.6) drawPixelGlobal(x + 1, y, colors.concreteDark);
      }
      const grassPatchCount = Math.max(4, Math.floor(gridWidth / 4));
      for (let p = 0; p < grassPatchCount; p++) {
        const patchX = Math.floor(Math.random() * gridWidth);
        const patchY = groundStart + Math.floor(Math.random() * Math.max(1, gridHeight - groundStart));
        const w = 2 + Math.floor(Math.random() * 3);
        const h = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < w; i++) {
          for (let j = 0; j < h; j++) {
            if (Math.random() > 0.55) {
              drawPixelGlobal(
                patchX + i,
                patchY + j,
                Math.random() > 0.5 ? colors.grass : colors.grassDark
              );
            }
          }
        }
      }

      // === House (reference-inspired) ===
      const baseW = 90;
      const baseH = 32;
      const baseX = 45;
      const baseY = 58;
      const midW = 60;
      const midH = 26;
      const midX = baseX + (baseW - midW) / 2;
      const midY = baseY - midH;
      const atticH = 10;

      // Lower floor
      drawRect(baseX, baseY, baseW, baseH, colors.wall);
      drawRect(baseX, baseY, baseW, 3, colors.wallDark);
      drawRect(baseX, baseY + baseH - 3, baseW, 3, colors.wallDark);
      drawRect(baseX, baseY - 2, baseW, 2, colors.trim);

      // Second floor
      drawRect(midX, midY, midW, midH, colors.wallDamaged);
      drawRect(midX, midY, midW, 2, colors.wallDark);
      drawRect(midX, midY + midH - 3, midW, 3, colors.wallDark);

      // Upper roof
      ctx.fillStyle = colors.roof;
      ctx.beginPath();
      ctx.moveTo((offsetX + midX - 8) * pixel, (offsetY + midY) * pixel);
      ctx.lineTo((offsetX + midX + midW / 2) * pixel, (offsetY + midY - 14) * pixel);
      ctx.lineTo((offsetX + midX + midW + 8) * pixel, (offsetY + midY) * pixel);
      ctx.lineTo((offsetX + midX + midW + 4) * pixel, (offsetY + midY + 4) * pixel);
      ctx.lineTo((offsetX + midX - 4) * pixel, (offsetY + midY + 4) * pixel);
      ctx.closePath();
      ctx.fill();
      for (let x = -6; x < midW + 6; x += 4) {
        const yy = (x % 8 === 0) ? 1 : 0;
        drawRect(midX + x, midY - 2 + yy, 3, 1, colors.roofTile);
      }
      drawRect(midX + midW - 14, midY - 2, 6, 4, colors.windowGlow);

      // Attic face
      drawRect(midX + midW / 2 - 6, midY - atticH, 12, atticH, colors.wall);
      drawRect(midX + midW / 2 - 6, midY - atticH, 12, 2, colors.wallDark);
      drawRect(midX + midW / 2 - 4, midY - atticH + 4, 8, 4, colors.windowBroken);
      drawPixel(midX + midW / 2 - 3, midY - atticH + 5, colors.window);
      drawPixel(midX + midW / 2 + 1, midY - atticH + 6, colors.window);

      // Main roof over lower floor
      ctx.fillStyle = colors.roof;
      ctx.beginPath();
      ctx.moveTo((offsetX + baseX - 10) * pixel, (offsetY + baseY) * pixel);
      ctx.lineTo((offsetX + baseX + baseW + 14) * pixel, (offsetY + baseY - 6) * pixel);
      ctx.lineTo((offsetX + baseX + baseW + 6) * pixel, (offsetY + baseY + 6) * pixel);
      ctx.lineTo((offsetX + baseX - 6) * pixel, (offsetY + baseY + 6) * pixel);
      ctx.closePath();
      ctx.fill();
      for (let x = -8; x < baseW + 10; x += 4) drawRect(baseX + x, baseY + 1, 3, 1, colors.roofTile);

      // Porch gable
      const porchW = 30;
      const porchX = baseX + baseW / 2 - porchW / 2;
      const porchY = baseY - 2;
      ctx.fillStyle = colors.trim;
      ctx.beginPath();
      ctx.moveTo((offsetX + porchX) * pixel, (offsetY + porchY) * pixel);
      ctx.lineTo((offsetX + porchX + porchW / 2) * pixel, (offsetY + porchY - 10) * pixel);
      ctx.lineTo((offsetX + porchX + porchW) * pixel, (offsetY + porchY) * pixel);
      ctx.lineTo((offsetX + porchX + porchW) * pixel, (offsetY + porchY + 3) * pixel);
      ctx.lineTo((offsetX + porchX) * pixel, (offsetY + porchY + 3) * pixel);
      ctx.closePath();
      ctx.fill();
      drawRect(porchX + 2, porchY + 1, porchW - 4, 1, colors.roofTile);
      drawPixel(porchX + porchW / 2 - 3, porchY + 1, colors.graffiti);
      drawPixel(porchX + porchW / 2, porchY + 1, colors.graffitiAlt);
      drawPixel(porchX + porchW / 2 + 3, porchY + 1, colors.graffiti);

      // Door
      const doorX = baseX + baseW / 2 - 5;
      const doorY = baseY + baseH - 12;
      drawRect(doorX - 2, doorY - 2, 14, 2, colors.trim);
      drawRect(doorX - 2, doorY - 2, 2, 14, colors.trim);
      drawRect(doorX + 10, doorY - 2, 2, 14, colors.trim);
      drawRect(doorX, doorY, 10, 12, colors.windowGlow);
      drawPixel(doorX + 7, doorY + 6, colors.metal);

      // Ground-floor windows
      const baseWindows = [
        { x: baseX + 12, y: baseY + 6 },
        { x: baseX + 28, y: baseY + 6 },
        { x: baseX + 68, y: baseY + 6 },
        { x: baseX + 84, y: baseY + 6 }
      ];
      baseWindows.forEach(win => {
        drawRect(win.x - 1, win.y - 1, 10, 12, colors.wallDark);
        drawRect(win.x, win.y, 8, 10, colors.windowBroken);
        drawPixel(win.x + 2, win.y + 3, colors.windowGlow);
        drawPixel(win.x + 5, win.y + 6, colors.windowGlow);
        drawPixel(win.x - 2, win.y - 2, colors.trim);
        drawPixel(win.x + 9, win.y - 2, colors.trim);
        drawPixel(win.x - 2, win.y + 11, colors.trim);
        drawPixel(win.x + 9, win.y + 11, colors.trim);
      });

      // Second-floor windows
      const midWindows = [
        { x: midX + 8, y: midY + 6 },
        { x: midX + midW - 16, y: midY + 6 },
        { x: midX + midW / 2 - 4, y: midY + 12 }
      ];
      midWindows.forEach(win => {
        drawRect(win.x - 1, win.y - 1, 10, 10, colors.wallDark);
        drawRect(win.x, win.y, 8, 8, colors.windowBroken);
        drawPixel(win.x + 3, win.y + 3, colors.windowGlow);
        drawPixel(win.x + 4, win.y + 5, colors.windowGlow);
        drawPixel(win.x - 2, win.y - 2, colors.trim);
        drawPixel(win.x + 9, win.y - 2, colors.trim);
        drawPixel(win.x - 2, win.y + 9, colors.trim);
        drawPixel(win.x + 9, win.y + 9, colors.trim);
      });

      // Railing
      const railY = baseY + baseH - 2;
      drawRect(baseX - 4, railY, baseW + 8, 2, colors.wallDark);
      for (let i = 0; i < baseW + 8; i += 4) {
        drawRect(baseX - 4 + i, railY - 6, 1, 6, colors.wallDark);
      }

      // Vines
      const vineAnchors = [
        { x: baseX + 5, y: baseY },
        { x: baseX + 20, y: baseY - 6 },
        { x: midX + 10, y: midY - 2 },
        { x: midX + midW - 12, y: midY - 4 }
      ];
      vineAnchors.forEach(v => {
        for (let i = 0; i < 20; i++) {
          if (Math.random() > 0.4) {
            drawPixel(v.x + (Math.random() > 0.5 ? 0 : 1), v.y + i, Math.random() > 0.5 ? colors.ivy : colors.ivyDark);
            if (i % 5 === 0) drawPixel(v.x - 1, v.y + i, colors.ivyDark);
          }
        }
      });

      // Silhouettes (cat and bird)
      drawRect(midX + midW + 18, baseY + baseH - 4, 4, 2, colors.windowGlow);
      drawPixel(midX + midW + 19, baseY + baseH - 6, colors.windowGlow);
      drawPixel(midX + 6, midY - 12, colors.windowGlow);
      drawPixel(midX + 7, midY - 13, colors.windowGlow);
      drawPixel(midX + 8, midY - 12, colors.windowGlow);

      // Extra base details
      drawRect(baseX - 6, baseY + baseH - 2, 3, 2, colors.metal);
      drawRect(baseX + baseW + 4, baseY + baseH - 2, 3, 2, colors.metal);
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
