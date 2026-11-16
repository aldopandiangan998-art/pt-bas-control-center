import { useEffect, useRef, useCallback } from 'react';
import bgImage from '../../assets/mining-pit-bg.jpg';
import { useApp } from '../../context/AppContext';

export default function MiningPitInteractiveBg({ children, topRightAction }) {
  const { isDark } = useApp();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Target mouse coordinates (-1 to 1 normalized, and absolute px)
  const targetMouse = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const currentMouse = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Track user mouse movement for interactive POV
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalized from -1 to 1
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    targetMouse.current = {
      x: Math.max(-1, Math.min(1, normX)),
      y: Math.max(-1, Math.min(1, normY)),
      px: x,
      py: y,
    };
  }, []);

  // Gyroscope / touch orientation for mobile
  const handleTouchMove = useCallback((e) => {
    if (!e.touches || e.touches.length === 0 || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    targetMouse.current = {
      x: Math.max(-1, Math.min(1, normX)),
      y: Math.max(-1, Math.min(1, normY)),
      px: x,
      py: y,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize Dust & Ember particles
    const particleCount = Math.min(55, Math.floor(width / 24));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2, // drifting upward
      opacity: Math.random() * 0.7 + 0.2,
      baseOpacity: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulse: Math.random() * Math.PI,
      isEmber: Math.random() > 0.45,
    }));

    // Animated truck headlights along the switchback haul road
    const truckBeacons = [
      { t: 0.15, speed: 0.00035, size: 4, label: 'DT-884' },
      { t: 0.52, speed: 0.00028, size: 3.5, label: 'DT-612' },
      { t: 0.82, speed: 0.00032, size: 4.5, label: 'TR-109' },
    ];

    // Curve waypoints representing the winding haul road in the image
    const getHaulRoadPoint = (t) => {
      const x = width * (0.18 + Math.sin(t * Math.PI * 2.2) * 0.08 + t * 0.35);
      const y = height * (0.35 + t * 0.55);
      return { x, y };
    };

    // Halogen floodlight stationary beacon points (Excavator bay & plant)
    const floodlights = [
      { xRatio: 0.52, yRatio: 0.58, size: 70, color: 'rgba(255, 175, 75, 0.25)', pulse: 0 },
      { xRatio: 0.68, yRatio: 0.46, size: 90, color: 'rgba(255, 190, 90, 0.20)', pulse: 1.5 },
      { xRatio: 0.15, yRatio: 0.32, size: 60, color: 'rgba(255, 160, 50, 0.18)', pulse: 3.0 },
      { xRatio: 0.85, yRatio: 0.48, size: 50, color: 'rgba(255, 180, 80, 0.15)', pulse: 4.2 },
    ];

    let lastTime = performance.now();

    // Render loop
    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse interpolation (LERP for inertia camera POV)
      const lerpFactor = 0.065;
      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * lerpFactor;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * lerpFactor;
      currentMouse.current.px += (targetMouse.current.px - currentMouse.current.px) * lerpFactor;
      currentMouse.current.py += (targetMouse.current.py - currentMouse.current.py) * lerpFactor;

      ctx.clearRect(0, 0, width, height);

      const mX = currentMouse.current.x;
      const mY = currentMouse.current.y;
      const pX = currentMouse.current.px;
      const pY = currentMouse.current.py;

      // 1. Draw Halogen Floodlights pulsating gently
      floodlights.forEach((f) => {
        f.pulse += dt * 1.5;
        const currentPulse = Math.sin(f.pulse) * 0.15 + 0.85;
        const fx = f.xRatio * width + mX * -15;
        const fy = f.yRatio * height + mY * -10;

        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.size * currentPulse);
        grad.addColorStop(0, f.color);
        grad.addColorStop(0.5, f.color.replace(/[\d\.]+\)$/, '0.08)'));
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx, fy, f.size * currentPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Moving Haul Trucks on the Winding Road
      truckBeacons.forEach((b) => {
        b.t = (b.t + b.speed * 60 * dt) % 1;
        const pt = getHaulRoadPoint(b.t);
        const bx = pt.x + mX * -20;
        const by = pt.y + mY * -15;

        // Headlight beam shining along forward vector
        const angle = 0.75 + Math.sin(b.t * Math.PI * 2) * 0.2;
        const beamLength = 48;
        const beamAngleSpread = 0.45;

        // Beam cone
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle);

        const beamGrad = ctx.createRadialGradient(0, 0, 0, beamLength, 0, beamLength * 1.2);
        beamGrad.addColorStop(0, 'rgba(255, 230, 160, 0.75)');
        beamGrad.addColorStop(0.3, 'rgba(251, 140, 0, 0.35)');
        beamGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, beamLength, -beamAngleSpread, beamAngleSpread);
        ctx.closePath();
        ctx.fill();

        // Bright bulb core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, b.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F4511E';
        ctx.beginPath();
        ctx.arc(0, 0, b.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 3. Draw Ambient Dust Motes & Glowing Embers rising from the mine
      particles.forEach((p) => {
        p.pulse += p.pulseSpeed;
        p.opacity = p.baseOpacity * (Math.sin(p.pulse) * 0.3 + 0.7);

        // Repel gently from cursor
        const dx = p.x - pX;
        const dy = p.y - pY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.x += (dx / dist) * force * 1.8;
          p.y += (dy / dist) * force * 1.8;
        }

        p.x += p.vx + mX * -0.5;
        p.y += p.vy + mY * -0.3;

        // Wrap around boundaries
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width + 10;
        if (p.x > width) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.isEmber) {
          ctx.fillStyle = `rgba(244, 81, 30, ${p.opacity})`;
          ctx.shadowColor = '#F4511E';
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = isDark
            ? `rgba(255, 200, 120, ${p.opacity * 0.7})`
            : `rgba(244, 81, 30, ${p.opacity * 0.4})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className={`relative min-h-screen w-full overflow-hidden selection:bg-[#F4511E] selection:text-white transition-colors duration-300 ${
        isDark ? 'bg-[#06090F]' : 'bg-slate-100'
      }`}
    >
      {/* ======================================================== */}
      {/* LAYER 1: PHOTOREALISTIC PARALLAX MINING PIT IMAGE        */}
      {/* ======================================================== */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none transition-transform duration-100 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: 'center 42%',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          transform: `scale(1.10) translate3d(${currentMouse.current.x * -24}px, ${currentMouse.current.y * -18}px, 0)`,
          filter: isDark ? 'brightness(0.95) contrast(1.05)' : 'brightness(1.08) saturate(1.12)',
        }}
      />

      {/* ======================================================== */}
      {/* LAYER 2: INTERACTIVE SPOTLIGHT (USER POV CURSOR BEAM)    */}
      {/* ======================================================== */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: isDark
            ? `radial-gradient(circle 320px at ${currentMouse.current.px}px ${currentMouse.current.py}px, rgba(244, 81, 30, 0.16) 0%, rgba(251, 140, 0, 0.05) 50%, transparent 80%)`
            : `radial-gradient(circle 320px at ${currentMouse.current.px}px ${currentMouse.current.py}px, rgba(244, 81, 30, 0.10) 0%, rgba(251, 140, 0, 0.03) 50%, transparent 80%)`,
        }}
      />

      {/* ======================================================== */}
      {/* LAYER 3: DYNAMIC DUST, TRUCK BEACONS & CANVAS PARTICLES  */}
      {/* ======================================================== */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* ======================================================== */}
      {/* LAYER 4: CINEMATIC VIGNETTE & CONTRAST VEIL              */}
      {/* ======================================================== */}
      {isDark ? (
        <>
          <div className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-t from-[#06090F] via-[#06090F]/70 to-[#06090F]/45 transition-opacity duration-300" />
          <div className="fixed inset-0 pointer-events-none z-10 [background:radial-gradient(circle_at_center,rgba(6,9,15,0.45)_0%,rgba(6,9,15,0.92)_100%)] transition-opacity duration-300" />
        </>
      ) : (
        <>
          <div className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-t from-slate-100/90 via-slate-100/75 to-slate-200/50 transition-opacity duration-300" />
          <div className="fixed inset-0 pointer-events-none z-10 [background:radial-gradient(circle_at_center,rgba(241,245,249,0.55)_0%,rgba(241,245,249,0.92)_100%)] transition-opacity duration-300" />
        </>
      )}

      {/* ======================================================== */}
      {/* LAYER 5: TOP RIGHT ACTION (THEME TOGGLE)                 */}
      {/* ======================================================== */}
      {topRightAction && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-6 z-50 pointer-events-auto">
          {topRightAction}
        </div>
      )}

      {/* ======================================================== */}
      {/* LAYER 6: FOREGROUND CONTENT (LOGIN / REGISTER FORM)      */}
      {/* ======================================================== */}
      <div className="relative z-30 min-h-screen flex flex-col justify-center pointer-events-auto">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
