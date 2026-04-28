'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type RippleCell = { row: number; col: number } | null;

function BackgroundRippleEffect({
  cellSize = 72,
}: {
  cellSize?: number;
}) {
  const [clickedCell, setClickedCell] = useState<RippleCell>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  function triggerRipple(row: number, col: number) {
    setClickedCell({ row, col });
    setRippleKey((value) => value + 1);
  }

  useEffect(() => {
    const updateViewport = () => {
      const width = stageRef.current?.clientWidth || window.innerWidth;
      const height = stageRef.current?.clientHeight || window.innerHeight;
      setViewport({ width, height });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const cols = Math.max(14, Math.ceil(viewport.width / cellSize) + 1);
  const rows = Math.max(8, Math.ceil(viewport.height / cellSize) + 1);

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 h-full w-full overflow-hidden"
      style={{
        ['--cell-border-color' as string]: 'rgba(255, 178, 134, 0.22)',
        ['--cell-fill-color' as string]: 'rgba(43, 24, 24, 0.42)',
        ['--cell-ripple-color' as string]: 'rgba(255, 129, 69, 0.82)',
        ['--cell-shadow-color' as string]: 'rgba(255, 116, 59, 0.38)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 16% 18%, rgba(255, 128, 70, 0.28), transparent 24%), radial-gradient(circle at 86% 78%, rgba(255, 94, 58, 0.2), transparent 28%), linear-gradient(180deg, #14090c 0%, #08060c 48%, #040308 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,146,101,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,146,101,0.04)_1px,transparent_1px)] bg-[size:88px_88px] opacity-24" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, transparent 0%, rgba(255, 149, 104, 0.03) 42%, rgba(255, 111, 56, 0.07) 50%, rgba(255, 149, 104, 0.03) 58%, transparent 100%)',
          transform: 'translateX(-18%)',
          animation: 'loginSweep 8s linear infinite',
        }}
      />
      <div className="relative h-full w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-[2]" />
        <DivGrid
          key={`base-${rippleKey}`}
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          rippleColor="var(--cell-ripple-color)"
          shadowColor="var(--cell-shadow-color)"
          clickedCell={clickedCell}
          onCellClick={triggerRipple}
        />
      </div>
      <style jsx>{`
        @keyframes loginSweep {
          0% {
            transform: translateX(-28%);
          }
          100% {
            transform: translateX(28%);
          }
        }
      `}</style>
    </div>
  );
}

function DivGrid({
  rows,
  cols,
  cellSize,
  borderColor,
  fillColor,
  rippleColor,
  shadowColor,
  clickedCell,
  onCellClick,
}: {
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  rippleColor: string;
  shadowColor: string;
  clickedCell: RippleCell;
  onCellClick: (row: number, col: number) => void;
}) {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, index) => index),
    [rows, cols]
  );

  return (
    <div
      className="relative z-[3] mx-auto opacity-65 [mask-image:radial-gradient(circle_at_top,black_24%,transparent_92%)]"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: cols * cellSize,
        height: rows * cellSize,
        minWidth: '100%',
        minHeight: '100%',
      }}
    >
      {cells.map((index) => {
        const rowIndex = Math.floor(index / cols);
        const colIndex = index % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIndex, clickedCell.col - colIndex)
          : 0;
        const shouldRipple = clickedCell ? distance <= 6 : false;
        const delay = clickedCell ? Math.max(0, distance * 45) : 0;
        const duration = 220 + distance * 55;

        return (
          <div
            key={index}
            className={`relative border-[0.5px] opacity-40 transition-opacity duration-150 hover:opacity-80 ${
              shouldRipple ? 'animate-[cellRipple_var(--duration)_ease-out]' : ''
            }`}
            style={{
              ['--delay' as string]: `${delay}ms`,
              ['--duration' as string]: `${duration}ms`,
              animationDelay: `${delay}ms`,
              backgroundColor: fillColor,
              borderColor,
              willChange: shouldRipple ? 'transform, opacity, background-color' : 'auto',
            }}
            onClick={() => onCellClick(rowIndex, colIndex)}
          />
        );
      })}
      <style jsx>{`
        @keyframes cellRipple {
          0% {
            transform: scale(1);
            opacity: 0.38;
            background-color: ${fillColor};
          }
          50% {
            transform: scale(0.97);
            opacity: 0.86;
            background-color: ${rippleColor};
            box-shadow: inset 0 0 18px ${shadowColor};
          }
          100% {
            transform: scale(1);
            opacity: 0.38;
            background-color: ${fillColor};
          }
        }
      `}</style>
    </div>
  );
}

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/p7com';
  const errorParam = searchParams.get('error');

  const errorMessage =
    errorParam === 'forbidden'
      ? '權限不足，僅限管理員與分析師登入。'
      : errorParam === 'oauth'
        ? '登入失敗，請重試。'
        : '';

  const loginUrl = `/api/auth/admin-oauth/login?next=${encodeURIComponent(next)}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        color: '#f7ece8',
        padding: '2rem',
      }}
    >
      <BackgroundRippleEffect />
      <div
        style={{
          width: 'min(360px, 100%)',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {errorMessage ? (
          <p style={{ color: '#ff9e84', margin: '0 0 0.25rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {errorMessage}
          </p>
        ) : null}
        <a
          href={loginUrl}
          style={{
            display: 'block',
            width: '100%',
            height: '58px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 188, 156, 0.32)',
            background: 'linear-gradient(135deg, rgba(255, 102, 61, 0.18), rgba(35, 23, 28, 0.84))',
            color: '#f7ece8',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow:
              '0 22px 90px rgba(255, 102, 61, 0.2), inset 0 1px 0 rgba(255, 215, 190, 0.1)',
            backdropFilter: 'blur(18px)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255, 188, 156, 0.6)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              '0 22px 90px rgba(255, 102, 61, 0.32), inset 0 1px 0 rgba(255, 215, 190, 0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255, 188, 156, 0.32)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              '0 22px 90px rgba(255, 102, 61, 0.2), inset 0 1px 0 rgba(255, 215, 190, 0.1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          使用 Penhu 帳號登入
        </a>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
