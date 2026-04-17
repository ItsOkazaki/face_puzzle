/**
 * Puzzle Engine for Your Face Puzzle
 * Ported and adapted for TypeScript
 */

export const PINCH_THRESHOLD = 60;
export const COLOR_P1 = "#00FFFF";
export const COLOR_P2 = "#FF00FF";

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Piece {
  id: number;
  currentSlot: number;
  image: HTMLCanvasElement;
  drawX: number;
  drawY: number;
}

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GameState = 'CALIBRATING' | 'WAITING' | 'PLAYING' | 'SOLVED' | 'LOSE';

export interface Translations {
  instructionHands: string;
  instructionBox: string;
  instructionSnap: string;
  waitingOpponent: string;
  timeLabel: string;
}

export class Player {
  id: number;
  bounds: Bounds;
  color: string;
  state: GameState = 'CALIBRATING';
  box: Bounds | null = null;
  pieces: Piece[] = [];
  slots: Slot[] = [];
  heldPieceIndex: number = -1;
  startTime: number | null = null;
  elapsedTime: number = 0;
  isPinching: boolean = false;
  mode: 'single' | 'multi';
  translations: Translations;

  constructor(id: number, bounds: Bounds, color: string, mode: 'single' | 'multi', translations: Translations) {
    this.id = id;
    this.bounds = bounds;
    this.color = color;
    this.mode = mode;
    this.translations = translations;
  }

  update(handsData: Point[][], ctx: CanvasRenderingContext2D, onWin: (player: Player) => void) {
    if (this.state === 'CALIBRATING') {
      this.handleCalibration(handsData, ctx);
    } else if (this.state === 'WAITING') {
      this.drawWaiting(ctx);
    } else if (this.state === 'PLAYING') {
      this.handleGameplay(handsData, ctx, onWin);
    } else if (this.state === 'LOSE') {
      this.drawWaiting(ctx, true);
    }
  }

  handleCalibration(handsData: Point[][], ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.font = "bold 28px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    const msgX = this.bounds.x + this.bounds.w / 2;
    ctx.fillText(this.translations.instructionHands.replace('{id}', this.id.toString()), msgX, 60);

    ctx.font = "20px sans-serif";
    ctx.shadowBlur = 5;
    ctx.fillText(this.translations.instructionBox, msgX, 95);
    ctx.fillText(this.translations.instructionSnap, msgX, 125);
    ctx.restore();

    if (handsData.length >= 2) {
      const hA = handsData[0];
      const hB = handsData[1];

      const leftHand = hA[0].x < hB[0].x ? hA : hB;
      const rightHand = hA[0].x < hB[0].x ? hB : hA;

      const pLeftThumb = leftHand[4];
      const pRightIndex = rightHand[8];

      const left = Math.min(pLeftThumb.x, pRightIndex.x);
      const right = Math.max(pLeftThumb.x, pRightIndex.x);
      const top = Math.min(pLeftThumb.y, pRightIndex.y);
      const bottom = Math.max(pLeftThumb.y, pRightIndex.y);

      const w = right - left;
      const h = bottom - top;

      if (w > 50 && h > 50) {
        this.box = { x: left, y: top, w: w, h: h };

        ctx.save();
        ctx.strokeStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.strokeRect(this.box.x, this.box.y, this.box.w, this.box.h);
        ctx.restore();

        const pinchLeft = this.getDistance(leftHand[4], leftHand[8]) < PINCH_THRESHOLD;
        const pinchRight = this.getDistance(rightHand[4], rightHand[8]) < PINCH_THRESHOLD;

        if (pinchLeft) {
          ctx.save();
          ctx.strokeStyle = "white";
          ctx.shadowColor = "white";
          ctx.shadowBlur = 20;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(leftHand[4].x, leftHand[4].y);
          ctx.lineTo(leftHand[8].x, leftHand[8].y);
          ctx.stroke();
          ctx.restore();
        }

        if (pinchRight) {
          ctx.save();
          ctx.strokeStyle = "white";
          ctx.shadowColor = "white";
          ctx.shadowBlur = 20;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(rightHand[4].x, rightHand[4].y);
          ctx.lineTo(rightHand[8].x, rightHand[8].y);
          ctx.stroke();
          ctx.restore();
        }

        if (pinchLeft && pinchRight) {
          this.capturePuzzle(ctx);
        }
      }
    }
  }

  capturePuzzle(ctx: CanvasRenderingContext2D) {
    if (!this.box) return;
    const imageData = ctx.getImageData(this.box.x, this.box.y, this.box.w, this.box.h);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.box.w;
    tempCanvas.height = this.box.h;
    tempCanvas.getContext('2d')?.putImageData(imageData, 0, 0);

    const pieceW = this.box.w / 3;
    const pieceH = this.box.h / 3;

    this.pieces = [];
    this.slots = [];

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;

      const pX = this.box.x + col * pieceW;
      const pY = this.box.y + row * pieceH;

      this.slots.push({ x: pX, y: pY, w: pieceW, h: pieceH });

      const pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = pieceW;
      pieceCanvas.height = pieceH;
      pieceCanvas.getContext('2d')?.drawImage(tempCanvas, col * pieceW, row * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);

      this.pieces.push({ id: i, currentSlot: i, image: pieceCanvas, drawX: pX, drawY: pY });
    }

    this.shufflePuzzle();

    if (this.mode === 'multi') {
      this.state = 'WAITING';
    } else {
      this.startPlaying();
    }
  }

  shufflePuzzle() {
    const slotIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = slotIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slotIndices[i], slotIndices[j]] = [slotIndices[j], slotIndices[i]];
    }
    this.pieces.forEach((p, index) => {
      p.currentSlot = slotIndices[index];
      this.snapToSlot(p);
    });
  }

  startPlaying() {
    this.state = 'PLAYING';
    this.startTime = Date.now();
  }

  snapToSlot(piece: Piece) {
    const slot = this.slots[piece.currentSlot];
    piece.drawX = slot.x;
    piece.drawY = slot.y;
  }

  drawWaiting(ctx: CanvasRenderingContext2D, isLose: boolean = false) {
    this.pieces.forEach((p) => {
      ctx.drawImage(p.image, p.drawX, p.drawY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.drawX, p.drawY, p.image.width, p.image.height);
    });

    if (!isLose) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.font = "bold 26px 'Orbitron', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.translations.waitingOpponent, this.bounds.x + this.bounds.w / 2, 60);
      ctx.restore();
    }
  }

  handleGameplay(handsData: Point[][], ctx: CanvasRenderingContext2D, onWin: (player: Player) => void) {
    // Update timer
    if (this.startTime) {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    }

    // Grid Background
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    this.slots.forEach(slot => ctx.strokeRect(slot.x, slot.y, slot.w, slot.h));
    ctx.restore();

    let cursor: Point | null = null;
    let pinching = false;

    if (handsData.length > 0) {
      const h = handsData[0];
      cursor = { x: (h[4].x + h[8].x) / 2, y: (h[4].y + h[8].y) / 2 };
      pinching = this.getDistance(h[4], h[8]) < PINCH_THRESHOLD;

      ctx.save();
      const pulse = pinching ? Math.abs(Math.sin(Date.now() / 120)) * 6 : 0;
      const radius = pinching ? 12 + pulse : 8;

      ctx.fillStyle = pinching ? this.color : "rgba(255, 255, 255, 0.8)";
      ctx.shadowColor = pinching ? this.color : "white";
      ctx.shadowBlur = pinching ? 20 + pulse * 2 : 10;

      if (pinching) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 + pulse / 2;
        ctx.beginPath();
        ctx.moveTo(h[4].x, h[4].y);
        ctx.lineTo(h[8].x, h[8].y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, radius + 10, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (pinching && !this.isPinching) {
      this.isPinching = true;
      if (cursor && this.heldPieceIndex === -1) {
        for (let i = 0; i < this.pieces.length; i++) {
          const p = this.pieces[i];
          const slot = this.slots[p.currentSlot];
          if (cursor.x >= slot.x && cursor.x <= slot.x + slot.w &&
            cursor.y >= slot.y && cursor.y <= slot.y + slot.h) {
            this.heldPieceIndex = i;
            break;
          }
        }
      }
    } else if (pinching && this.isPinching) {
      if (this.heldPieceIndex !== -1 && cursor) {
        const p = this.pieces[this.heldPieceIndex];
        p.drawX = cursor.x - this.slots[0].w / 2;
        p.drawY = cursor.y - this.slots[0].h / 2;
      }
    } else if (!pinching && this.isPinching) {
      this.isPinching = false;
      if (this.heldPieceIndex !== -1 && cursor) {
        const heldPiece = this.pieces[this.heldPieceIndex];
        let targetSlotIndex = -1;
        let minDist = Infinity;

        for (let i = 0; i < this.slots.length; i++) {
          const slot = this.slots[i];
          const cx = slot.x + slot.w / 2;
          const cy = slot.y + slot.h / 2;
          const dist = this.getDistance(cursor, { x: cx, y: cy });
          if (dist < minDist) { minDist = dist; targetSlotIndex = i; }
        }

        if (targetSlotIndex !== -1 && targetSlotIndex !== heldPiece.currentSlot) {
          const pieceInTarget = this.pieces.find(p => p.currentSlot === targetSlotIndex);
          if (pieceInTarget) {
            pieceInTarget.currentSlot = heldPiece.currentSlot;
            this.snapToSlot(pieceInTarget);
          }
          heldPiece.currentSlot = targetSlotIndex;
        }

        this.snapToSlot(heldPiece);
        this.heldPieceIndex = -1;
        this.checkWin(onWin);
      }
    }

    // Render Pieces
    this.pieces.forEach((p, idx) => {
      if (idx !== this.heldPieceIndex) {
        ctx.drawImage(p.image, p.drawX, p.drawY);
        ctx.strokeStyle = "#222";
        ctx.strokeRect(p.drawX, p.drawY, p.image.width, p.image.height);
      }
    });

    // Render Held Piece
    if (this.heldPieceIndex !== -1) {
      const p = this.pieces[this.heldPieceIndex];
      ctx.globalAlpha = 0.85;
      ctx.drawImage(p.image, p.drawX, p.drawY);
      ctx.globalAlpha = 1.0;

      ctx.save();
      const pulseGlow = Math.abs(Math.sin(Date.now() / 150)) * 15;
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15 + pulseGlow;
      ctx.lineWidth = 4 + pulseGlow / 4;
      ctx.strokeRect(p.drawX, p.drawY, p.image.width, p.image.height);
      ctx.restore();
    }

    // Timer
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.font = "bold 36px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.translations.timeLabel}${this.formatTime(this.elapsedTime)}`, this.bounds.x + this.bounds.w / 2, 60);
    ctx.restore();
  }

  checkWin(onWin: (player: Player) => void) {
    const isWin = this.pieces.every(p => p.id === p.currentSlot);
    if (isWin && this.state !== 'SOLVED') {
      this.state = 'SOLVED';
      onWin(this);
    }
  }

  getDistance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
