'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error === 'INVALID_TOKEN' ? 'Token 錯誤。' : '登入失敗。');
        return;
      }
      window.location.href = next;
    } catch {
      setError('登入失敗。');
    } finally {
      setSubmitting(false);
    }
  }

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
      <form
        onSubmit={handleSubmit}
        style={{
          width: 'min(360px, 100%)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder=""
          autoFocus
          style={{
            width: '100%',
            height: '58px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 188, 156, 0.24)',
            background: 'linear-gradient(135deg, rgba(35, 23, 28, 0.84), rgba(16, 13, 20, 0.92))',
            color: '#f7ece8',
            padding: '0 1rem',
            fontSize: '1.05rem',
            outline: 'none',
            marginBottom: error ? '0.75rem' : '0.9rem',
            boxShadow:
              '0 22px 90px rgba(255, 102, 61, 0.18), inset 0 1px 0 rgba(255, 215, 190, 0.08)',
            backdropFilter: 'blur(18px)',
          }}
        />
        {error ? (
          <p style={{ color: '#ff9e84', margin: '0 0 0.8rem', textAlign: 'center' }}>{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={submitting || !token.trim()}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </form>
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
