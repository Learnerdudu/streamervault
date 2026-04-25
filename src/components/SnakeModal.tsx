import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SIZE = 18;
const SPEED = 110;

type Cell = [number, number];

/** Tiny 8-bit Snake — Easter egg triggered by typing "vault". */
export function SnakeModal({ open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const dirRef = useRef<Cell>([1, 0]);
  const snakeRef = useRef<Cell[]>([[8, 9], [7, 9], [6, 9]]);
  const foodRef = useRef<Cell>([14, 9]);

  function reset() {
    dirRef.current = [1, 0];
    snakeRef.current = [[8, 9], [7, 9], [6, 9]];
    foodRef.current = [14, 9];
    setScore(0);
    setRunning(true);
  }

  useEffect(() => {
    if (open) reset();
    else setRunning(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const k = e.key;
      if (k === "Escape") onClose();
      const [dx, dy] = dirRef.current;
      if (k === "ArrowUp" && dy !== 1) dirRef.current = [0, -1];
      else if (k === "ArrowDown" && dy !== -1) dirRef.current = [0, 1];
      else if (k === "ArrowLeft" && dx !== 1) dirRef.current = [-1, 0];
      else if (k === "ArrowRight" && dx !== -1) dirRef.current = [1, 0];
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = canvas.width / SIZE;

    const tick = setInterval(() => {
      const [dx, dy] = dirRef.current;
      const snake = snakeRef.current;
      const head: Cell = [snake[0][0] + dx, snake[0][1] + dy];

      // Wall / self collision → game over
      if (head[0] < 0 || head[1] < 0 || head[0] >= SIZE || head[1] >= SIZE ||
          snake.some(([x, y]) => x === head[0] && y === head[1])) {
        setRunning(false);
        return;
      }

      const grew = head[0] === foodRef.current[0] && head[1] === foodRef.current[1];
      const next: Cell[] = [head, ...snake];
      if (!grew) next.pop();
      else {
        setScore((s) => s + 1);
        // Spawn new food not on snake
        let nf: Cell;
        do {
          nf = [Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE)];
        } while (next.some(([x, y]) => x === nf[0] && y === nf[1]));
        foodRef.current = nf;
      }
      snakeRef.current = next;

      // Render
      ctx.fillStyle = "hsl(0 0% 6%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "hsl(0 100% 50%)";
      next.forEach(([x, y]) => ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1));
      ctx.fillStyle = "hsl(0 0% 100%)";
      ctx.fillRect(foodRef.current[0] * cell, foodRef.current[1] * cell, cell - 1, cell - 1);
    }, SPEED);

    return () => clearInterval(tick);
  }, [open, running]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative rounded-lg border border-primary/40 bg-background p-6 shadow-[0_0_60px_hsl(var(--primary)/0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 flex items-center justify-between gap-6">
          <h2 className="font-display text-2xl tracking-widest text-primary">VAULT SNAKE</h2>
          <span className="font-mono text-sm text-foreground">SCORE {score}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="block rounded-sm"
          style={{ imageRendering: "pixelated" }}
        />
        {!running && (
          <div className="mt-3 text-center">
            <p className="mb-2 text-sm text-muted-foreground">Game Over</p>
            <button
              onClick={reset}
              className="rounded-sm bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
            >
              Restart
            </button>
          </div>
        )}
        <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Arrow keys · Esc to close
        </p>
      </div>
    </div>
  );
}
