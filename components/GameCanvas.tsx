
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Asteroid, Particle, Vector2D } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onSectorComplete: (score: number) => void;
  difficultyMultiplier: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  onSectorComplete,
  difficultyMultiplier 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const nextSectorScoreRef = useRef(1500);
  
  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: 100, y: 300 },
    radius: 15,
    velocity: { x: 0, y: 0 },
    targetY: 300,
    color: '#38bdf8'
  });

  const asteroidsRef = useRef<Asteroid[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number, y: number, size: number, speed: number }[]>([]);
  const frameRef = useRef<number>(0);

  // Initialize stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1
      });
    }
    // Fix: Corrected property access from .ref to .current for the RefObject
    starsRef.current = stars;
  }, []);

  const spawnAsteroid = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    const size = 15 + Math.random() * 40;
    const speed = (4 + Math.random() * 6) * difficultyMultiplier;
    
    const newAsteroid: Asteroid = {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x: window.innerWidth + 100, y: Math.random() * window.innerHeight },
      radius: size,
      velocity: { x: -speed, y: (Math.random() - 0.5) * 2 },
      color: `hsl(0, 0%, ${30 + Math.random() * 40}%)`,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      points: Math.floor(size)
    };
    
    asteroidsRef.current.push(newAsteroid);
  }, [gameState, difficultyMultiplier]);

  const createExplosion = (pos: Vector2D, color: string) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { ...pos },
        radius: Math.random() * 3,
        velocity: { 
          x: (Math.random() - 0.5) * 10, 
          y: (Math.random() - 0.5) * 10 
        },
        color: color,
        life: 1,
        maxLife: 1
      });
    }
  };

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // Update stars (parallax)
    starsRef.current.forEach(star => {
      star.x -= star.speed;
      if (star.x < 0) star.x = window.innerWidth;
    });

    // Update player
    const p = playerRef.current;
    p.pos.y += (p.targetY - p.pos.y) * 0.15;

    // Update particles
    particlesRef.current = particlesRef.current.filter(part => {
      part.pos.x += part.velocity.x;
      part.pos.y += part.velocity.y;
      part.life -= 0.02;
      return part.life > 0;
    });

    // Update asteroids
    asteroidsRef.current = asteroidsRef.current.filter(ast => {
      ast.pos.x += ast.velocity.x;
      ast.pos.y += ast.velocity.y;
      ast.rotation += ast.rotationSpeed;

      // Check collision
      const dx = ast.pos.x - p.pos.x;
      const dy = ast.pos.y - p.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ast.radius + p.radius) {
        createExplosion(p.pos, '#38bdf8');
        createExplosion(ast.pos, '#94a3b8');
        onGameOver(scoreRef.current);
        return false;
      }

      return ast.pos.x > -150;
    });

    // Score and Spawning
    scoreRef.current += 1;
    if (scoreRef.current >= nextSectorScoreRef.current) {
      nextSectorScoreRef.current += 1500;
      onSectorComplete(scoreRef.current);
    }

    if (Math.random() < 0.03 * difficultyMultiplier) {
      spawnAsteroid();
    }
  }, [gameState, onGameOver, onSectorComplete, difficultyMultiplier, spawnAsteroid]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    starsRef.current.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Particles
    particlesRef.current.forEach(part => {
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.pos.x, part.pos.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Asteroids
    asteroidsRef.current.forEach(ast => {
      ctx.save();
      ctx.translate(ast.pos.x, ast.pos.y);
      ctx.rotate(ast.rotation);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#1e293b';
      
      // Craggy asteroid look
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = ast.radius * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    
    // Thruster glow
    const gradient = ctx.createRadialGradient(-15, 0, 0, -15, 0, 20);
    gradient.addColorStop(0, '#f87171');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(-15, 0, 15 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();

    // Ship body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(5, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      playerRef.current.targetY = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        playerRef.current.targetY = e.touches[0].clientY;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const loop = () => {
      update();
      draw(ctx);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [update, draw]);

  // Reset logic when starting new game
  useEffect(() => {
    if (gameState === GameState.PLAYING && scoreRef.current === 0) {
      asteroidsRef.current = [];
      particlesRef.current = [];
      scoreRef.current = 0;
      nextSectorScoreRef.current = 1500;
    }
  }, [gameState]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 bg-slate-950 cursor-none"
    />
  );
};

export default GameCanvas;
