import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

interface DrawingCanvasProps {
  canvasData?: string;
  onSave: (json: string) => void;
}

const COLORS = ['#1e293b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#ffffff'];
const SIZES = [2, 4, 6, 10, 16];

export default function DrawingCanvas({ canvasData, onSave }: DrawingCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<'select' | 'pencil' | 'line' | 'rect' | 'circle' | 'text' | 'eraser'>('pencil');
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(4);

  const initCanvas = useCallback(() => {
    if (!canvasEl.current || canvasRef.current) return;

    const c = new fabric.Canvas(canvasEl.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8fafc',
      isDrawingMode: true,
      selection: tool === 'select',
    });

    const gridLines: fabric.Line[] = [];
    const gridColor = '#e2e8f0';
    for (let x = -200; x <= 1000; x += 20) {
      gridLines.push(new fabric.Line([x, 0, x, 600], { stroke: gridColor, selectable: false, evented: false }));
    }
    for (let y = -200; y <= 800; y += 20) {
      gridLines.push(new fabric.Line([0, y, 800, y], { stroke: gridColor, selectable: false, evented: false }));
    }
    const isoAngle = Math.PI / 6;
    for (let x = -200; x < 1000; x += 40) {
      const yOffset = Math.tan(isoAngle) * x;
      gridLines.push(new fabric.Line([x, 0, x + 100, yOffset + 50], { stroke: '#dbeafe', strokeWidth: 0.5, selectable: false, evented: false }));
      gridLines.push(new fabric.Line([x, 600, x + 100, 600 - yOffset - 50], { stroke: '#dbeafe', strokeWidth: 0.5, selectable: false, evented: false }));
    }

    const gridGroup = new fabric.Group(gridLines, { selectable: false, evented: false });
    c.add(gridGroup);
    c.sendObjectToBack(gridGroup);

    if (c.freeDrawingBrush) {
      c.freeDrawingBrush.color = color;
      c.freeDrawingBrush.width = brushSize;
    }

    canvasRef.current = c;

    if (canvasData) {
      c.loadFromJSON(canvasData, () => {
        c.renderAll();
        c.isDrawingMode = tool === 'pencil' || tool === 'eraser';
      });
    }

    return () => {
      c.dispose();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !c.freeDrawingBrush) return;
    c.isDrawingMode = tool === 'pencil' || tool === 'eraser';
    c.selection = tool === 'select';

    if (tool === 'eraser') {
      c.freeDrawingBrush.color = '#f8fafc';
      c.freeDrawingBrush.width = brushSize * 3;
    } else if (tool === 'pencil') {
      c.freeDrawingBrush.color = color;
      c.freeDrawingBrush.width = brushSize;
    }
  }, [tool, color, brushSize]);

  const addShape = (type: string) => {
    const c = canvasRef.current;
    if (!c) return;
    const center = { x: 400, y: 300 };

    let obj: fabric.FabricObject;
    switch (type) {
      case 'line':
        obj = new fabric.Line([center.x - 50, center.y, center.x + 50, center.y], {
          stroke: color, strokeWidth: brushSize, selectable: true,
        });
        break;
      case 'rect':
        obj = new fabric.Rect({
          left: center.x - 40, top: center.y - 40, width: 80, height: 80,
          fill: 'transparent', stroke: color, strokeWidth: brushSize, selectable: true,
        });
        break;
      case 'circle':
        obj = new fabric.Ellipse({
          left: center.x - 40, top: center.y - 40, rx: 50, ry: 50,
          fill: 'transparent', stroke: color, strokeWidth: brushSize, selectable: true,
        });
        break;
      default:
        return;
    }
    c.add(obj);
    c.renderAll();
  };

  const addText = () => {
    const c = canvasRef.current;
    if (!c) return;
    const textbox = new fabric.IText('Escribe aquí', {
      left: 350, top: 280, fontSize: 20, fill: color,
      fontFamily: 'Arial', editable: true,
    });
    c.add(textbox);
    c.setActiveObject(textbox);
    c.renderAll();
  };

  const addImage = (file: File) => {
    const c = canvasRef.current;
    if (!c) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.FabricImage.fromURL(e.target?.result as string).then((img) => {
        img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
        c.add(img);
        c.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const grid = c.item(0);
    c.clear();
    c.backgroundColor = '#f8fafc';
    if (grid) c.add(grid);
    c.renderAll();
  };

  const handleSave = () => {
    const c = canvasRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    onSave(json);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {(['select', 'pencil', 'line', 'rect', 'circle', 'text', 'eraser'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTool(t)}
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
              onClick={() => setColor(c)}
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
              onClick={() => setBrushSize(s)}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                brushSize === s ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}px
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => addText()} className="btn-secondary text-xs py-1.5 px-2">
          + Texto
        </button>

        <label className="btn-secondary text-xs py-1.5 px-2 cursor-pointer">
          + Imagen
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); }} />
        </label>

        <button type="button" onClick={clearCanvas} className="btn-secondary text-xs py-1.5 px-2 text-red-600 hover:bg-red-50">
          Limpiar
        </button>

        <button type="button" onClick={handleSave} className="btn-primary text-xs py-1.5 px-3 ml-auto">
          Guardar Dibujo
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#f8fafc]">
        <canvas ref={canvasEl} width={800} height={600} className="w-full" />
      </div>
    </div>
  );
}
