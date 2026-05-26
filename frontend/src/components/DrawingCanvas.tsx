import { useEffect, useRef, useState } from 'react';

interface DrawingCanvasProps {
  canvasData?: string;
  onSave: (json: string) => void;
}

const COLORS = ['#1e293b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#ffffff'];
const SIZES = [2, 4, 6, 10, 16];

export default function DrawingCanvas({ canvasData, onSave }: DrawingCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'select' | 'pencil' | 'line' | 'rect' | 'circle' | 'text' | 'eraser'>('pencil');
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(4);
  const [isReady, setIsReady] = useState(false);
  const fabricRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    async function init() {
      const mod = await import('fabric');
      const fabric = mod;
      if (disposed || !canvasEl.current) return;

      const c = new fabric.Canvas(canvasEl.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f8fafc',
        selection: false,
      });

      drawGrid(fabric, c);

      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = color;
      c.freeDrawingBrush.width = brushSize;
      c.isDrawingMode = true;

      if (canvasData) {
        try {
          c.loadFromJSON(JSON.parse(canvasData), () => c.renderAll());
        } catch { /* ignore */ }
      }

      fabricRef.current = fabric;
      canvasRef.current = c;
      setIsReady(true);
    }
    init();
    return () => { disposed = true; if (canvasRef.current) canvasRef.current.dispose(); };
  }, []);

  function drawGrid(fabric: any, c: any) {
    const lines: any[] = [];
    for (let x = 0; x <= 800; x += 20) {
      lines.push(new fabric.Line([x, 0, x, 600], { stroke: '#e2e8f0', selectable: false, evented: false }));
    }
    for (let y = 0; y <= 600; y += 20) {
      lines.push(new fabric.Line([0, y, 800, y], { stroke: '#e2e8f0', selectable: false, evented: false }));
    }
    const grid = new fabric.Group(lines, { selectable: false, evented: false });
    c.add(grid);
    c.sendObjectToBack(grid);
    c.renderAll();
  }

  function setDrawingMode(mode: boolean) {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    c.isDrawingMode = mode;
    c.selection = !mode;
    c.defaultCursor = mode ? 'crosshair' : 'default';
  }

  function handleToolChange(newTool: string) {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    setTool(newTool as any);
    setDrawingMode(newTool === 'pencil' || newTool === 'eraser');
    if (newTool === 'eraser' && c.freeDrawingBrush) {
      c.freeDrawingBrush.color = '#f8fafc';
      c.freeDrawingBrush.width = brushSize * 3;
    } else if (newTool === 'pencil' && c.freeDrawingBrush) {
      c.freeDrawingBrush.color = color;
      c.freeDrawingBrush.width = brushSize;
    }
  }

  function handleColorChange(newColor: string) {
    setColor(newColor);
    const c = canvasRef.current;
    if (c?.freeDrawingBrush && tool === 'pencil') {
      c.freeDrawingBrush.color = newColor;
    }
  }

  function handleSizeChange(newSize: number) {
    setBrushSize(newSize);
    const c = canvasRef.current;
    if (c?.freeDrawingBrush) {
      c.freeDrawingBrush.width = tool === 'eraser' ? newSize * 3 : newSize;
    }
  }

  function addShape(type: string) {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    setDrawingMode(false);
    setTool('select');

    let obj: any;
    switch (type) {
      case 'line':
        obj = new fabric.Line([350, 300, 450, 300], { stroke: color, strokeWidth: brushSize });
        break;
      case 'rect':
        obj = new fabric.Rect({ left: 340, top: 260, width: 120, height: 80, fill: 'transparent', stroke: color, strokeWidth: brushSize });
        break;
      case 'circle':
        obj = new fabric.Ellipse({ left: 340, top: 260, rx: 60, ry: 60, fill: 'transparent', stroke: color, strokeWidth: brushSize });
        break;
      default:
        return;
    }
    c.add(obj);
    c.setActiveObject(obj);
    c.renderAll();
  }

  function addText() {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    setDrawingMode(false);
    setTool('select');
    const t = new fabric.IText('Texto', { left: 350, top: 280, fontSize: 20, fill: color, fontFamily: 'Arial' });
    c.add(t);
    c.setActiveObject(t);
    c.renderAll();
  }

  function addImage(file: File) {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      fabric.FabricImage.fromURL(e.target.result).then((img: any) => {
        img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
        c.add(img);
        c.renderAll();
      });
    };
    reader.readAsDataURL(file);
  }

  function clearAll() {
    const c = canvasRef.current;
    const fabric = fabricRef.current;
    if (!c || !fabric) return;
    c.clear();
    c.backgroundColor = '#f8fafc';
    drawGrid(fabric, c);
    c.renderAll();
  }

  function handleSave() {
    const c = canvasRef.current;
    if (!c) return;
    onSave(JSON.stringify(c.toJSON()));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {(['select', 'pencil', 'line', 'rect', 'circle', 'text', 'eraser'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleToolChange(t)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tool === t ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'select' ? 'Seleccionar' : t === 'pencil' ? 'Lápiz' : t === 'line' ? 'Línea' : t === 'rect' ? 'Rectángulo' : t === 'circle' ? 'Círculo' : t === 'text' ? 'Texto' : 'Borrador'}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSizeChange(s)}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                brushSize === s ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}px
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => addText()} className="btn-secondary text-xs py-1.5 px-2">+ Texto</button>

        <label className="btn-secondary text-xs py-1.5 px-2 cursor-pointer">
          + Imagen
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); }} />
        </label>

        <button type="button" onClick={clearAll} className="btn-secondary text-xs py-1.5 px-2 text-red-600 hover:bg-red-50">Limpiar</button>

        <button type="button" onClick={handleSave} className="btn-primary text-xs py-1.5 px-3 ml-auto">Guardar Dibujo</button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#f8fafc]" style={{ cursor: tool === 'pencil' || tool === 'eraser' ? 'crosshair' : 'default' }}>
        <canvas ref={canvasEl} width={800} height={600} className="w-full" style={{ touchAction: 'none' }} />
      </div>
    </div>
  );
}
