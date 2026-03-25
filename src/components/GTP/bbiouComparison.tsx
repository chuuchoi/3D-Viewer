import { useMemo, useState, useRef, useEffect } from 'react';
import * as Icons from "@/icons";

const MEDIUM_IOU_THRESHOLD = 0.9;
const LOW_IOU_THRESHOLD = 0.7;

interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Prediction {
  id: string;
  label: string;
  label_en?: string;
  bbox: Bbox;
  confidence: number;
}

interface GroundTruth {
  id: string;
  label: string;
  bbox: Bbox;
}

interface TestData {
  file_name: string;
  image_name: string;
  image_url: string;
  predictions: Prediction[];
  ground_truth: GroundTruth[];
}

interface NormalizedBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NormalizedItem {
  id: string;
  label: string;
  bbox: NormalizedBbox;
  _raw?: unknown;
}

interface FieldMapping {
  idField?: string;
  nameField?: string;
  bboxField?: string;
  splitBbox?: {
    type: string;
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
    x?: string;
    y?: string;
    w?: string;
    h?: string;
  } | null;
}

interface ParsedData {
  needsManualMapping: boolean;
  mapping?: FieldMapping;
  items?: NormalizedItem[] | Record<string, unknown>[];
  predictions?: NormalizedItem[];
}

const getIoUStateAndColor = (iou: number): { status: string; color: string } => {
  let status = '낮음', color = '#EA5455';
  if (iou >= MEDIUM_IOU_THRESHOLD) { status = '높음'; color = '#28C76F'; }
  else if (iou >= LOW_IOU_THRESHOLD) { status = '보통'; color = '#007AFF'; }
  return { status, color };
}

const styles = `
  .toolbtn{
    display: flex; align-items: center; justify-content: center;
    border: none;
    background-color: transparent;
    padding: 4px;
    cursor: pointer;
    border-radius:4px;
    &:hover{
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
  @keyframes slideIn {
    from { transform: translateY(-30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-30px); opacity: 0; }
  }
  .notice-toast-enter { animation: slideIn 0.3s ease-out forwards; }
  .notice-toast-exit { animation: slideOut 0.3s ease-in forwards; }
`;

const testData: TestData = {
  "file_name": "test.json",
  "image_name": "test.jpg",
  "image_url": "./test.jpg",
  "predictions": [
    {
      "id": "01",
      "label": "냉장고",
      "label_en": "Refrigerator",
      "bbox": {
        "x": 172,
        "y": 188,
        "width": 95,
        "height": 232
      },
      "confidence": 0.92
    },
    {
      "id": "04",
      "label": "식기세척기",
      "label_en": "Dishwasher",
      "bbox": {
        "x": 270,
        "y": 232,
        "width": 80,
        "height": 124
      },
      "confidence": 0.12
    },
    {
      "id": "06",
      "label": "06",
      "label_en": "Dishwasher",
      "bbox": {
        "x": 450,
        "y": 312,
        "width": 80,
        "height": 124
      },
      "confidence": 0.12
    },
    {
      "id": "05",
      "label": "222",
      "label_en": "111",
      "bbox": {
        "x": 490,
        "y": 352,
        "width": 40,
        "height": 64
      },
      "confidence": 0.12
    },
    {
      "id": "02",
      "label": "화분",
      "label_en": "Pot",
      "bbox": {
        "x": 479,
        "y": 331,
        "width": 92,
        "height": 152
      },
      "confidence": 0.89
    },
    {
      "id": "03",
      "label": "의자",
      "label_en": "Chair",
      "bbox": {
        "x": 730,
        "y": 440,
        "width": 151,
        "height": 140
      },
      "confidence": 0.65
    }
  ],
  "ground_truth": [
    {
      "id": "01",
      "label": "냉장고",
      "bbox": {
        "x": 95,
        "y": 195,
        "width": 130,
        "height": 260
      }
    },
    {
      "id": "04",
      "label": "식기세척기",
      "bbox": {
        "x": 175,
        "y": 235,
        "width": 90,
        "height": 160
      }
    },
    {
      "id": "02",
      "label": "화분",
      "bbox": {
        "x": 315,
        "y": 375,
        "width": 110,
        "height": 130
      }
    },
    {
      "id": "03",
      "label": "의자",
      "bbox": {
        "x": 515,
        "y": 475,
        "width": 120,
        "height": 140
      }
    }
  ]
}


function BoundingBoxIoUComparison() {
  return(<>
    <div style={{height:'120px'}}/>
    <div style={{background:'#fafafa', color: '#333', overflow: 'auto', height: 'calc(100vh - 120px)'}}>
      <style>{styles}</style>
      <h1>Bounding Box IoU 비교</h1>
      <h2>Bounding Box IoU를 비교 분석합니다</h2>
      <Process0 />
    </div>
  </>
  )
}

function Process0() {
  return(<div>
      <ObjectDetectionDashboard />
  </div>
  )
}

const MAX_SCALE = 5.0;
const MIN_SCALE = 0.08;
const PAN_SENSITIVITY = 1;
const ZOOM_STEP = 0.1;
const ZOOM_STEP_SMALL = 0.01;

const getPanSensitivity = (scale: number) => {
  return PAN_SENSITIVITY / scale;
}

function looksLikeBbox(value: unknown): boolean {
  if (typeof value === 'string') {
    const nums = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (nums.length === 4) return true;
  }
  if (Array.isArray(value) && value.length === 4 && value.every(v => typeof v === 'number'))
    return true;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const vals = Object.values(value as Record<string, unknown>);
    if (vals.length === 4 && vals.every(v => typeof v === 'number')) return true;
    const k = Object.keys(value).map(s => s.toLowerCase());
    if (k.includes('x') && k.includes('y')) return true;
    if (k.includes('x1') && k.includes('y1')) return true;
    if (k.includes('xmin') && k.includes('ymin')) return true;
    if (k.includes('left') && k.includes('top')) return true;
  }
  return false;
}

function detectFieldMapping(sample: Record<string, unknown>): FieldMapping {
  const keys = Object.keys(sample);
  const ID_NAMES   = ['id', 'ID', 'object_id', 'obj_id', 'idx', 'index', 'num'];
  const NAME_NAMES = ['label', 'name', 'class', 'category', 'class_name',
                      'category_name', 'tag', 'type', 'object_class'];
  const BBOX_NAMES = ['bbox', 'bounding_box', 'box', 'rect',
                      'rectangle', 'coordinates', 'location', 'region'];

  let idField   = keys.find(k => ID_NAMES.includes(k));
  let nameField = keys.find(k => NAME_NAMES.includes(k));
  let bboxField = keys.find(k => BBOX_NAMES.includes(k));

  if (!idField)   idField   = keys.find(k => /id|idx|index|num/i.test(k));
  if (!nameField) nameField = keys.find(k => /label|name|class|category|tag|type|desc/i.test(k));
  if (!bboxField) bboxField = keys.find(k => /bbox|box|rect|coord|bound/i.test(k));
  if (!bboxField) bboxField = keys.find(k => looksLikeBbox(sample[k]));

  let splitBbox: FieldMapping['splitBbox'] = null;
  if (!bboxField) {
    if (keys.includes('min_x') && keys.includes('min_y') && keys.includes('max_x') && keys.includes('max_y')) {
      splitBbox = { type: 'minmax_', x1: 'min_x', y1: 'min_y', x2: 'max_x', y2: 'max_y' };
    } else if (keys.includes('xmin') && keys.includes('ymin') && keys.includes('xmax') && keys.includes('ymax')) {
      splitBbox = { type: 'minmax', x1: 'xmin', y1: 'ymin', x2: 'xmax', y2: 'ymax' };
    } else if (keys.includes('x1') && keys.includes('y1') && keys.includes('x2') && keys.includes('y2')) {
      splitBbox = { type: 'corners', x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2' };
    } else if (keys.includes('left') && keys.includes('top') && keys.includes('right') && keys.includes('bottom')) {
      splitBbox = { type: 'ltrb', x1: 'left', y1: 'top', x2: 'right', y2: 'bottom' };
    } else if (keys.includes('x') && keys.includes('y') && (keys.includes('width') || keys.includes('w')) && (keys.includes('height') || keys.includes('h'))) {
      splitBbox = { type: 'xywh', x: 'x', y: 'y', w: keys.includes('width') ? 'width' : 'w', h: keys.includes('height') ? 'height' : 'h' };
    }
  }

  return { idField, nameField, bboxField, splitBbox };
}

function normalizeBbox(raw: unknown): NormalizedBbox {
  if (typeof raw === 'string') {
    const nums = raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (nums.length === 4) return { x: nums[0], y: nums[1], width: nums[2], height: nums[3] };
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  if (Array.isArray(raw) && raw.length === 4) {
    const [a, b, c, d] = raw;
    return { x: a, y: b, width: c, height: d };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if ('x' in r && 'y' in r)
      return { x: r.x as number, y: r.y as number, width: (r.width ?? r.w) as number ?? 0, height: (r.height ?? r.h) as number ?? 0 };
    if ('x1' in r && 'x2' in r)
      return { x: r.x1 as number, y: r.y1 as number, width: (r.x2 as number) - (r.x1 as number), height: (r.y2 as number) - (r.y1 as number) };
    if ('xmin' in r)
      return { x: r.xmin as number, y: r.ymin as number, width: (r.xmax as number) - (r.xmin as number), height: (r.ymax as number) - (r.ymin as number) };
    if ('left' in r && 'top' in r)
      return { x: r.left as number, y: r.top as number, width: (r.right as number) - (r.left as number), height: (r.bottom as number) - (r.top as number) };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

function normalizeSplitBbox(item: Record<string, unknown>, splitBbox: NonNullable<FieldMapping['splitBbox']>): NormalizedBbox {
  if (splitBbox.type === 'xywh') {
    return { 
      x: item[splitBbox.x!] as number, 
      y: item[splitBbox.y!] as number, 
      width: item[splitBbox.w!] as number, 
      height: item[splitBbox.h!] as number 
    };
  }
  const x1 = item[splitBbox.x1!] as number, y1 = item[splitBbox.y1!] as number;
  const x2 = item[splitBbox.x2!] as number, y2 = item[splitBbox.y2!] as number;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

function normalizeItem(item: Record<string, unknown>, mapping: FieldMapping, idx = 0): NormalizedItem {
  const { idField, nameField, bboxField, splitBbox } = mapping;
  return {
    ...item,
    id:    idField ? String(item[idField] ?? idx + 1) : String(idx + 1),
    label: String(item[nameField ?? ''] ?? ''),
    bbox:  bboxField  ? normalizeBbox(item[bboxField])
         : splitBbox  ? normalizeSplitBbox(item, splitBbox)
         : { x: 0, y: 0, width: 0, height: 0 },
    _raw:  item,
  };
}

export function parseJsonData(json: unknown): ParsedData {
  const extractTopLevel = (obj: unknown): unknown[] | unknown => {
    if (Array.isArray(obj)) return obj;
    const arrays = Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && !Array.isArray(v[0]));
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0][1];
    const predEntry = arrays.find(([k]) => /pred|ai|model|detect|infer/i.test(k));
    return (predEntry ?? arrays[0])[1];
  };

  let items = extractTopLevel(json) as Record<string, unknown>[];
  if (!items.length) throw new Error('데이터가 비어있습니다.');

  let mapping = detectFieldMapping(items[0]);

  if (!mapping.bboxField && !mapping.splitBbox) {
    const nestedArrays = Object.entries(items[0])
      .filter(([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && !Array.isArray(v[0]));
    if (nestedArrays.length > 0) {
      const preferred = nestedArrays.find(([k]) => /object|annot|detect|label|bbox/i.test(k)) ?? nestedArrays[0];
      const nestedKey = preferred[0];
      const flatItems = items.flatMap(item => (Array.isArray(item[nestedKey]) ? item[nestedKey] : []) as Record<string, unknown>[]);
      if (flatItems.length > 0) {
        items = flatItems;
        mapping = detectFieldMapping(flatItems[0]);
      }
    }
  }

  const missing: string[] = [];
  if (!mapping.idField)                          missing.push('id');
  if (!mapping.nameField)                        missing.push('name/label');
  if (!mapping.bboxField && !mapping.splitBbox)  missing.push('bbox');

  if (missing.length > 0) {
    return { needsManualMapping: true, mapping, items };
  }

  return {
    needsManualMapping: false,
    predictions: items.map((item, idx) => normalizeItem(item, mapping, idx)),
  };
}

interface ObjectDetectionDashboardProps {
  receptionId?: string;
}

const ObjectDetectionDashboard: React.FC<ObjectDetectionDashboardProps> = ({ 
  receptionId,
}) => {
  const [data, setData] = useState<TestData>(testData);
  const predictions = useMemo(()=> data?.predictions || [], [data]);
  const [humanAnnotations, setHumanAnnotations] = useState<NormalizedItem[]>([]);
  const [mode, setMode] = useState<string>('select');
  const [selected, setSelected] = useState<NormalizedItem | null>(null);
  const [hoveredPBoxIds, setHoveredPBoxIds] = useState<string[]>([]);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [hoveredHBoxIds, setHoveredHBoxIds] = useState<string[]>([]);
  const [tempBbox, setTempBbox] = useState<NormalizedItem | null>(null);
  const hoveringPBox = useMemo(()=>{
    return predictions.find(({id})=>id===hoveredPBoxIds[hoveredPBoxIds.length-1]) || null
  },[hoveredPBoxIds, predictions])
  const hoveringHBox = useMemo(()=>{
    return humanAnnotations.find(({id})=>id===hoveredHBoxIds[hoveredHBoxIds.length-1]) || null
  },[hoveredHBoxIds, humanAnnotations])

  const [imageFileURL, setImageFileURL] = useState('./test.jpg');
  const [imageFile, setImageFile] = useState<{ name: string }>({ name: 'test.jpg' });


  const [jsonFile, setJsonFile] = useState<{ name: string } | undefined>();
  const [mappingDialog, setMappingDialog] = useState<any>(null);
  const handleImageFileChange = (file: File) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageFileURL(url);
      setImageFile(file);
      if (receptionId) {
        const formData = new FormData();
        formData.append('reception_id', receptionId);
        formData.append('bboxImageFile', file);
        // POST
      }
    }
  };
  const handleJsonFileChange = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          const parsed = parseJsonData(jsonData);
          if (parsed.needsManualMapping) {
            setMappingDialog({
              rawJson: jsonData,
              file,
              detectedKeys: Object.keys(parsed.items?.[0] || {}),
              items: parsed.items,
              mapping: parsed.mapping,
            });
            return;
          }
          setData({ ...jsonData, predictions: parsed.predictions });
          setJsonFile(file);
          setHumanAnnotations([]);
          if (receptionId) {
            const formData = new FormData();
            formData.append('reception_id', receptionId);
            formData.append('bboxJsonFile', file);
            // POST
          }
        } catch (err) {
          alert('유효하지 않은 JSON 파일입니다.');
          console.error('Invalid JSON file:', err);
        }
      };
      reader.readAsText(file);
    }
  };
  useEffect(() => {
    return () => {
      if (imageFileURL && imageFileURL.startsWith('blob:')) {
        URL.revokeObjectURL(imageFileURL);
      }
    };
  }, [imageFileURL]);

  const [scale, setScale] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawEnd, setDrawEnd] = useState({ x: 0, y: 0 });
  const [liveIoU, setLiveIoU] = useState<number | null>(null);
  const [imgRefMat, setImgRefMat] = useState({scale: 1, offsetX: 0, offsetY: 0, naturalWidth: 0, naturalHeight: 0});
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(scale);
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bboxesRef = useRef<HTMLDivElement>(null);
  scaleRef.current = scale;

  const toggleSelection = (id: string) => {
    if(!humanAnnotations.find(h=>h.id===id)) return;
    setSelections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    x = Math.max(0, Math.min(x, canvas.width));
    y = Math.max(0, Math.min(y, canvas.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'move') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if(e.button !== 0) return;
    if (mode !== 'draw') return;
    const pos = getMousePos(e as unknown as React.MouseEvent);
    setDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset(prev => ({
        x: prev.x + dx*getPanSensitivity(scale),
        y: prev.y + dy*getPanSensitivity(scale)
      }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!drawing) return;

    const pos = getMousePos(e as unknown as React.MouseEvent);
    setDrawEnd(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = Math.min(drawStart.x, pos.x);
    const y = Math.min(drawStart.y, pos.y);
    const w = Math.abs(pos.x - drawStart.x);
    const h = Math.abs(pos.y - drawStart.y);

    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);

    if (selected && w > 5 && h > 5 && imgRefMat.scale > 0) {
      const sc = imgRefMat.scale;
      const imgX = Math.min(drawStart.x, pos.x) / sc;
      const imgY = Math.min(drawStart.y, pos.y) / sc;
      const imgW = w / sc;
      const imgH = h / sc;
      setTempBbox({ id: selected.id, label: selected.label, bbox: { x: imgX, y: imgY, width: imgW, height: imgH } });
      const pb = selected.bbox;
      const ix1 = Math.max(pb.x, imgX);
      const iy1 = Math.max(pb.y, imgY);
      const ix2 = Math.min(pb.x + pb.width, imgX + imgW);
      const iy2 = Math.min(pb.y + pb.height, imgY + imgH);
      const intersection = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
      const union = pb.width * pb.height + imgW * imgH - intersection;
      setLiveIoU(union > 0 ? intersection / union : 0);
    } else {
      setLiveIoU(null);
    }

  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!drawing) return;
    setDrawing(false);
    setLiveIoU(null);
    setMode('select')

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const x = Math.min(drawStart.x, drawEnd.x) / imgRefMat.scale;
    const y = Math.min(drawStart.y, drawEnd.y) / imgRefMat.scale;
    const w = Math.abs(drawEnd.x - drawStart.x) / imgRefMat.scale;
    const h = Math.abs(drawEnd.y - drawStart.y) / imgRefMat.scale;
    
    if(!selected) {
      setTempBbox(null);
      setDrawing(false);
      setMode('select')
      return;
    }
    if (w > 10 && h > 10) {
      const newAnnotation = {
        id: selected.id,
        label: selected.label,
        bbox: { x, y, width: w, height: h }
      };
      const f = humanAnnotations.filter(h=>h.id !== selected.id)
      setHumanAnnotations([...f, newAnnotation]);
    }
    setTempBbox(null);
  };

  const handleClickZoomIn = () => {
    let step = scale > 0.2 ? ZOOM_STEP : ZOOM_STEP_SMALL;
    setScale(Math.min(MAX_SCALE, scale + step));
  };
  const handleClickZoomOut = () => {
    let step = scale > 0.2 ? ZOOM_STEP : ZOOM_STEP_SMALL;
    setScale(Math.max(MIN_SCALE, scale - step));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
  };

  const handleBoxEnter = (b: NormalizedItem) => () => {
    if(!hoveredPBoxIds.includes(b.id))
      setHoveredPBoxIds([...hoveredPBoxIds, b.id]);
    else{
      const index = hoveredPBoxIds.indexOf(b.id);
      const newArr = hoveredPBoxIds.slice(0, index + 1);
      setHoveredPBoxIds(newArr);
    }
  };
  const handleHBoxEnter = (b: NormalizedItem) => () => {
    if(!hoveredHBoxIds.includes(b.id))
      setHoveredHBoxIds([...hoveredHBoxIds, b.id]);
    else{
      const index = hoveredHBoxIds.indexOf(b.id);
      const newArr = hoveredHBoxIds.slice(0, index + 1);
      setHoveredHBoxIds(newArr);
    }
  };
  const handleBoxLeave = (b: NormalizedItem) => (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const intoOutside = relatedTarget?.contains?.(e.currentTarget);
    if(intoOutside){
      setHoveredPBoxIds([]);
    }else{
      setHoveredPBoxIds(prev=>prev.filter(id=>id!==b.id));
    }
  };
  const handleHBoxLeave = (b: NormalizedItem) => (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const intoOutside = relatedTarget?.contains?.(e.currentTarget);
    if(intoOutside){
      setHoveredHBoxIds([]);
    }else{
      setHoveredHBoxIds(prev=>prev.filter(id=>id!==b.id));
    }
  };
  const handleDetailCardClick = (b: NormalizedItem) => () => {
    if(mode!=='edit'){
      setSelected(hoveringPBox);
      setMode('draw');
    }else{
      toggleSelection(b.id);
    }
  };
  const handleDetailCardEnter = (b: NormalizedItem) => () => {
    if(mode!=='edit'){
      if(!hoveredPBoxIds.includes(b.id))
        setHoveredPBoxIds([...hoveredPBoxIds, b.id]);
    }else{
      if(!hoveredHBoxIds.includes(b.id))
        setHoveredHBoxIds([...hoveredHBoxIds, b.id]);
    }
  };
  const handleDetailCardLeave = () => {
    if(mode!=='edit')
      setHoveredPBoxIds([]);
    else
      setHoveredHBoxIds([]);
  };
  
  const [showNotice, setShowNotice] = useState(false);
  const [noticeAnim, setNoticeAnim] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmAnim, setDeleteConfirmAnim] = useState('');
  const timeoutId = useRef(0);
  const showNoticeToast = () => {
    setNoticeAnim('notice-toast-enter');
    setShowNotice(true);
    timeoutId.current = setTimeout(() => {
      setNoticeAnim('notice-toast-exit');
      setTimeout(() => {
        setShowNotice(false);
        setNoticeAnim('');
      }, 300);
    }, 1366);
  };
  const handleClickDelete = () => {
    if(selections.size === 0){ showNoticeToast(); return;}
    setDeleteConfirmAnim('notice-toast-enter');
    setShowDeleteConfirm(true);
  };
  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmAnim('');
    setHumanAnnotations(prev=>
      prev.filter(h=>!selections.has(h.id))
    );
    setSelections(new Set());
  };
  const cancelDelete = () => {
    setDeleteConfirmAnim('notice-toast-exit');
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setDeleteConfirmAnim('');
    }, 300);
  };

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const bboxesDiv = bboxesRef.current;

    if (!img || !canvas || !container || !bboxesDiv) return;

    setImgRefMat(prev => ({ ...prev, naturalWidth: 0, naturalHeight: 0 }));

    const resizeCanvas = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      if (!naturalWidth || !naturalHeight) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      const scale = Math.min(cw / naturalWidth, ch / naturalHeight);
      
      const renderedWidth = naturalWidth * scale;
      const renderedHeight = naturalHeight * scale;
      
      const offsetX = (cw - renderedWidth) / 2;
      const offsetY = (ch - renderedHeight) / 2;
      setImgRefMat({scale, offsetX, offsetY, naturalWidth, naturalHeight})

      canvas.style.position = "absolute";
      canvas.style.left = `${offsetX}px`;
      canvas.style.top = `${offsetY}px`;
      canvas.style.width = `${renderedWidth}px`;
      canvas.style.height = `${renderedHeight}px`;
      bboxesDiv.style.position = "absolute";
      bboxesDiv.style.left = `${offsetX}px`;
      bboxesDiv.style.top = `${offsetY}px`;
      bboxesDiv.style.width = `${renderedWidth}px`;
      bboxesDiv.style.height = `${renderedHeight}px`;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = renderedWidth * dpr;
      canvas.height = renderedHeight * dpr;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    if (img.complete && img.naturalWidth > 0) {
      resizeCanvas();
    }
    img.addEventListener("load", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      img.removeEventListener("load", resizeCanvas);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [imageFileURL]);

  useEffect(() => {
    const el = containerWrapperRef.current;
    if (!el) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      let step = scaleRef.current > 0.2 ? ZOOM_STEP : ZOOM_STEP_SMALL;
      setScale(prev =>
        e.deltaY < 0 ? Math.min(MAX_SCALE, prev + step) : Math.max(MIN_SCALE, prev - step)
      );
    };
    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      el.removeEventListener('wheel', wheelHandler);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  const {sortedPredictions, sortedHumanAnnotations} = useMemo(() => {
    const hoveredOrder = new Map(
      hoveredPBoxIds.map((id, index) => [id, index])
    );
    const hoveredHumanOrder = new Map(
      hoveredHBoxIds.map((id, index) => [id, index])
    );

    const sortedPredictions = [...predictions].sort((a, b) => {
      const aIndex = hoveredOrder.get(a.id);
      const bIndex = hoveredOrder.get(b.id);

      const aIsHovered = aIndex !== undefined;
      const bIsHovered = bIndex !== undefined;

      if (aIsHovered && bIsHovered) {
        return aIndex - bIndex;
      }
      if (aIsHovered) return -1;
      if (bIsHovered) return 1;
      return 0;
    });

    const sortedHumanAnnotations = [...humanAnnotations].sort((a, b) => {
      const aIndex = hoveredHumanOrder.get(a.id);
      const bIndex = hoveredHumanOrder.get(b.id);

      const aIsHovered = aIndex !== undefined;
      const bIsHovered = bIndex !== undefined;

      if (aIsHovered && bIsHovered) {
        return aIndex - bIndex;
      }
      if (aIsHovered) return -1;
      if (bIsHovered) return 1;
      return 0;
    }); 

    return { sortedPredictions, sortedHumanAnnotations };
  }, [predictions, humanAnnotations, hoveredPBoxIds, hoveredHBoxIds]);

  const detectionData = useMemo(()=>{
    return predictions.map(p => {
      const isTemp = tempBbox && tempBbox.id === p.id;
      let human;
      if ( isTemp ) {
        human = tempBbox;
      }else{
        human = humanAnnotations.find(h => h.id === p.id);
      }
      let iou = 0;
      if (human) {
        const x1 = Math.max(p.bbox.x, human.bbox.x);
        const y1 = Math.max(p.bbox.y, human.bbox.y);
        const x2 = Math.min(p.bbox.x + p.bbox.width, human.bbox.x + human.bbox.width);
        const y2 = Math.min(p.bbox.y + p.bbox.height, human.bbox.y + human.bbox.height);
        const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const area1 = p.bbox.width * p.bbox.height;
        const area2 = human.bbox.width * human.bbox.height;
        const union = area1 + area2 - intersection;
        iou = intersection / union;
      }
      const conf = Math.round(iou * 100);
      const {status, color} = getIoUStateAndColor(iou);
      return { id: p.id, nameKo: p.label, nameEn: p.label_en, score: iou.toFixed(2), confidence: `${conf}%`, status, color, isTemp };
    })
  }, [predictions, humanAnnotations, tempBbox])

  const cursorStyle = mode==='draw' ? 'crosshair' : (mode==='move' ? (isPanning? 'grabbing':'grab') : (isPanning? 'grabbing':'default'));

  return (<>
  {mappingDialog && (
    <FieldMappingDialog
      detectedKeys={mappingDialog.detectedKeys}
      mapping={mappingDialog.mapping ?? {}}
      onConfirm={(confirmedMapping: FieldMapping) => {
        const predictions = mappingDialog.items.map((item: Record<string, unknown>, idx: number) => normalizeItem(item, confirmedMapping, idx));
        setData({ ...mappingDialog.rawJson, predictions });
        if (mappingDialog.file) setJsonFile(mappingDialog.file);
        setHumanAnnotations([]);
        const allResolved = confirmedMapping.nameField &&
          (confirmedMapping.bboxField || confirmedMapping.splitBbox);
        if (mappingDialog.file && receptionId && allResolved) {
          const formData = new FormData();
          formData.append('reception_id', receptionId);
          formData.append('bboxJsonFile', mappingDialog.file);
          // POST
        }
        setMappingDialog(null);
      }}
      onCancel={() => setMappingDialog(null)}
    />
  )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 454px', gap: '20px', marginBottom: '20px' }}>
        
        <div style={{ cursor:cursorStyle, backgroundColor:'#eee', userSelect:'none', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E9EBEF' }}
          ref={containerWrapperRef}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div data-id='scale layer'
            style={{transition: 'transform 0.2s ease-in-out', transform: `scale(${scale})`,}}
          >
            <div data-id='pan layer'
              ref={containerRef}
              style={{ position: 'relative', transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,}}
            >
              <img
                ref={imgRef}
                src={imageFileURL || data?.image_url || './test.jpg'}
                alt="Analysis" 
                style={{ pointerEvents:'none', background:'var(--black-100)', display: 'block', width: '100%', height: '600px', objectFit: 'contain' }}
              />
              
              <div
                ref={bboxesRef}
                style={{ position:"absolute", }}
              >
                {imgRefMat.naturalWidth > 0 && imgRefMat.naturalHeight > 0 && sortedPredictions.map((p) => {
                  if(mode === 'edit') return null;
                  if(mode==='draw' && selected?.id !== p.id){
                    if(hoveringPBox?.id !== p.id) return null;
                  }
                  return(
                    <Box 
                      key={`pred-${p.id}`} 
                      label={`ID: ${p.id} ${p.label}`} 
                      top={`${p.bbox.y/imgRefMat.naturalHeight*100}%`} 
                      left={`${p.bbox.x/imgRefMat.naturalWidth*100}%`} 
                      width={`${p.bbox.width/imgRefMat.naturalWidth*100}%`} 
                      height={`${p.bbox.height/imgRefMat.naturalHeight*100}%`} 
                      pointerEvents={mode==='select' ? 'auto' : 'none'}
                      color={"#FF2D04"} 
                      hoverColor={"yellow"}
                      showLabel
                      isHover={hoveringPBox?.id === p.id}
                      onClick={()=>{setSelected(hoveringPBox); setMode('draw')}}
                      onMouseEnter={handleBoxEnter(p)}
                      onMouseLeave={handleBoxLeave(p)}
                    />
                  )
                })}
                {imgRefMat.naturalWidth > 0 && imgRefMat.naturalHeight > 0 && sortedHumanAnnotations.map((h) => {
                  if(drawing) return null;
                  if(mode==='draw' && selected?.id !== h.id) return null;
                  return(
                    <Box 
                      key={`human-${h.id}`} 
                      label={`ID: ${h.id} ${h.label}`} 
                      top={`${h.bbox.y/imgRefMat.naturalHeight*100}%`} 
                      left={`${h.bbox.x/imgRefMat.naturalWidth*100}%`} 
                      width={`${h.bbox.width/imgRefMat.naturalWidth*100}%`} 
                      height={`${h.bbox.height/imgRefMat.naturalHeight*100}%`} 
                      pointerEvents={mode==='edit' ? 'auto' : 'none'}
                      color="#007AFF"
                      isDashed
                      hoverColor={"yellow"} 
                      activeColor={"blue"}
                      showLabel={mode==='edit'}
                      isHover={(hoveringHBox?.id === h.id) || (hoveringPBox?.id === h.id) || (selections.has(h.id))}
                      isActive={selections.has(h.id)}
                      onClick={()=>{toggleSelection(h.id)}}
                      onMouseEnter={handleHBoxEnter(h)}
                      onMouseLeave={handleHBoxLeave(h)}
                    />
                  )
                })}
              </div>
              <canvas ref={canvasRef} style={{ position:"absolute", pointerEvents: 'none' }} />

            </div>
          </div>

          <div style={{backgroundColor:"rgba(255,255,255,0.9)", borderRadius:"8px", border:"1px solid var(--black-200)", pointerEvents:"none", position: 'absolute', top: '15px', left: '15px', display: 'flex', flexDirection: 'column', gap: '1px', paddingBlock:"1px 2px" }}
            onPointerDown={(e)=>{e.stopPropagation()}}
            onPointerUp={(e)=>{e.stopPropagation()}}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              <div style={{ width: '12px', height: '12px', border: '1px dashed #007AFF' }}></div>
              <span style={{ color: '#007AFF' }}>검수자 (Human)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              <div style={{ width: '12px', height: '12px', border: '1px solid #EA5455' }}></div>
              <span style={{ color: '#EA5455' }}>AI 모델 (Prediction)</span>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '2px', backgroundColor: '#fff', borderRadius: '6px', padding: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            onPointerDown={(e)=>{e.stopPropagation()}}
          >
            <ToolButton icon={<Icons.ControllerMoveIcon size={24} color={mode==='move'? '#007AFF':'#222'}/>} 
              onClick={()=>{setMode('move'); setSelections(new Set())}}
            />
            <div style={{ width: '1px', height: '16px', backgroundColor: '#EEE', margin: '0 4px' }}></div>
            <ToolButton icon={<Icons.ControllerSelectIcon size={24} color={mode==='select'? "#007AFF":'#222'} />}
              onClick={()=>{setMode('select'); setSelections(new Set())}}
            />
            <ToolButton icon={<Icons.ControllerBBoxIcon size={24} color={mode==='edit'? "#007AFF":'#222'} />} 
              onClick={ () => {setMode('edit'); setSelected(null)}}
            />
            <div style={{ width: '1px', height: '16px', backgroundColor: '#EEE', margin: '0 4px' }}></div>
            <ToolButton icon={<Icons.ControllerZoomOutIcon size={24} />} 
              onClick={handleClickZoomOut}
            />
            <ToolButton icon={<Icons.ControllerZoomInIcon size={24} />} 
              onClick={handleClickZoomIn}
            />
            <div style={{ width: '1px', height: '16px', backgroundColor: '#EEE', margin: '0 4px' }}></div>
            <ToolButton icon={<Icons.ControllerDeleteIcon size={24} color={selections.size===0?'#aaa':'#222'}/>}
              onClick={handleClickDelete}
            />
          </div>

          {showNotice &&
          <div className={noticeAnim} style={{ position: 'absolute', top: '0px', left: '0px', width:'100%', display: 'flex', justifyContent:'center', padding: '4px',}}>
            <div style={{ backgroundColor: '#222', border:'1px solid #007AFF', color:'#fafafa', borderRadius: '6px', padding: '4px 12px 5px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              선택된 검수자(Human) 박스가 없습니다.
            </div>
          </div>
          }
          {showDeleteConfirm &&
          <div style={{position:"absolute", top:"0px", left:"0px", width:"100%", height:"100%", display:"flex", justifyContent:"center", alignItems:"center", backdropFilter:"blur(1px)", backgroundColor:"rgba(0,0,0,0.2)"}}>
            <div className={deleteConfirmAnim} style={{ zIndex: 100 }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: '280px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                  선택한 {selections.size}개 항목을 삭제하시겠습니까?
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    onClick={cancelDelete}
                    style={{ padding: '8px 24px', borderRadius: '6px', border: '1px solid #DDD', backgroundColor: '#fff', color: '#666', fontWeight: '600', cursor: 'pointer' }}
                  >
                    취소
                  </button>
                  <button 
                    onClick={confirmDelete}
                    style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#EA5455', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
          }
          {drawing && liveIoU !== null &&
          <div style={{ pointerEvents: 'none', position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: getIoUStateAndColor(liveIoU).color,
              color: 'white', padding: '6px 20px', borderRadius: '20px',
              fontSize: '15px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              letterSpacing: '0.5px',
            }}>
              IoU: {(liveIoU * 100).toFixed(1)}%
            </div>
          </div>
          }
        </div>

        <div style={{ gridRow:'span 2', display:"flex", flexDirection:"column", backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E9EBEF', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color:"var(--black-500)", fontSize: '20px', fontWeight: 'bold' }}>객체별 상세 결과</h3>
            <span style={{ backgroundColor: 'var(--primary-500-10)', padding: '5px 11px', borderRadius: '50px', fontSize: '14px', fontWeight: '600', color: 'var(--primary-500)' }}>{detectionData.length} Items</span>
          </div>

          <div style={{ overflow:"auto", scrollbarWidth:"thin", height:"0px", flexGrow:"1", display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detectionData.map((item) => (
              <DetailCard key={item.id} {...item} isTemp={item.isTemp}
                isHovering={item.id === hoveringPBox?.id || item.id === selected?.id}
                onClick={handleDetailCardClick(item as unknown as NormalizedItem)}
                onMouseEnter={handleDetailCardEnter(item as unknown as NormalizedItem)}
                onMouseLeave={handleDetailCardLeave}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--black-100)', borderRadius: '12px', border: '1px solid #E9EBEF', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold' }}>데이터 설정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FileField label="원본 이미지" value={imageFile?.name||data.image_name} accept="image/*" 
                onChange={handleImageFileChange}
              />
              <FileField label="AI 예측 데이터 (JSON)" value={jsonFile?.name||data.file_name} accept="application/json" 
                onChange={handleJsonFileChange}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--black-100)', borderRadius: '12px', border: '1px solid #E9EBEF', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>분석결과</h3>
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>평균 IoU 점수</p>
            <div style={{ backgroundColor:"white", border: '2px solid #d9d9d988', borderRadius: '8px', padding: '30px', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#333' }}>
                {detectionData.length > 0
                  ? ((detectionData.reduce((sum, d) => sum + parseFloat(d.score), 0) / detectionData.length) * 100).toFixed(1)
                  : '0.0'}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2269' }}>%</span>
            </div>
          </div>
        </div>
      </div>
  </>);
};

const ToolButton: React.FC<{ icon: React.ReactNode; onClick: () => void }> = ({ icon, onClick }) => (
  <button className='toolbtn' onClick={onClick}>{icon}</button>
);

interface BoxProps {
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  pointerEvents?: 'auto' | 'none';
  color: string;
  hoverColor?: string;
  activeColor?: string;
  isDashed?: boolean;
  showLabel?: boolean;
  isHover?: boolean;
  isActive?: boolean;
}

const Box: React.FC<BoxProps> = ({ onClick, onMouseEnter, onMouseLeave, label, top, left, width, height, pointerEvents, color, hoverColor, activeColor, isDashed,
   showLabel=false, isHover=false, isActive=false
  }) => {
  const borderColor = isActive? (activeColor ?? color) : (isHover ? (hoverColor ?? color) : color);
  const labelTextColor = isActive? 'white' : (isHover ? color: 'white');

  return (
    <div data-label={label} style={{ cursor:'pointer', 
      position: 'absolute', top, left, width, height, border: `2px ${isDashed ? 'dashed' : 'solid'} ${borderColor}`,
      pointerEvents: pointerEvents ?? 'auto'
    }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showLabel &&
        <span style={{ 
          position: 'absolute', top: '0px', transform:'translateY(-100%)', left: '-2px', backgroundColor: borderColor, 
          color: labelTextColor, fontSize: '11px', whiteSpace:'nowrap', padding: '2px 6px', fontWeight: 'bold'
        }}>
          {label}{isActive?' 선택됨':''}
        </span>
      }
    </div>
  );
}

interface DetailCardProps {
  id: string;
  nameKo: string;
  nameEn?: string;
  score: string;
  confidence: string;
  status: string;
  color: string;
  isHovering?: boolean;
  isTemp?: boolean | null;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const DetailCard: React.FC<DetailCardProps> = ({ id, nameKo, nameEn, score, confidence, status, color, isHovering, isTemp, onClick, onMouseEnter, onMouseLeave}) => (
  <div style={{ cursor: 'pointer',
    display: "grid", alignItems: "center", columnGap: "4px",
    gridTemplateColumns: "1fr 52px 52px 70px",
    padding: '12px', borderRadius: '8px', 
    border: isTemp ? '2px dashed #007AFF' : ( isHovering? '2px solid #007AFF' : '2px solid #d9d9d988' ),
    backgroundColor: isTemp ? 'rgba(0, 122, 255, 0.05)' : '#fff',
    transition: 'all 0.2s ease'
  }}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ backgroundColor:color+'1a', width:"60px", height:"60px", borderRadius:'8px', display:"flex",flexDirection:'column',alignItems:'center',justifyContent:"center", fontWeight: 'bold', color, textAlign: 'center', lineHeight: '1.2' }}>
        <span style={{fontSize:'18px'}}>ID</span>
        <span style={{ fontSize: '24px' }}>{id}</span>
      </div>
      <div>
        <div style={{ fontWeight: '600', fontSize: '20px' }}>{nameKo}</div>
        <div style={{ color: 'var(--black-400)', fontSize: '16px' }}>{nameEn}</div>
      </div>
    </div>
    <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: '600', color, overflowWrap:"break-word" }}>{score}</div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: '#999' }}>신뢰도</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{confidence}</div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '14px', color: '#999' }}>일치도</div>
      <span style={{ fontSize: '20px', fontWeight: 'bold', color, padding: '1px 16px 3px', borderRadius: '99px', backgroundColor: color + '1a' }}>
        {status}
      </span>
    </div>
  </div>
);

interface FieldMappingDialogProps {
  detectedKeys: string[];
  mapping: FieldMapping;
  onConfirm: (mapping: FieldMapping) => void;
  onCancel: () => void;
}

const FieldMappingDialog: React.FC<FieldMappingDialogProps> = ({ detectedKeys, mapping = {}, onConfirm, onCancel }) => {
  const needId   = !mapping.idField;
  const needName = !mapping.nameField;
  const needBbox = !mapping.bboxField && !mapping.splitBbox;

  const [idField, setIdField] = useState(mapping.idField || '');
  const [nameField, setNameField] = useState(mapping.nameField || '');
  const [bboxField, setBboxField] = useState(mapping.bboxField || '');

  const handleConfirm = () => {
    onConfirm({
      idField: idField || undefined,
      nameField: nameField || undefined,
      bboxField: bboxField || undefined,
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>필드 매핑</h2>
        <p>JSON 데이터의 필드를 선택해주세요.</p>
        
        {needId && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>ID 필드</label>
            <select value={idField} onChange={(e) => setIdField(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="">선택하세요</option>
              {detectedKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}
        
        {needName && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>이름/라벨 필드</label>
            <select value={nameField} onChange={(e) => setNameField(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="">선택하세요</option>
              {detectedKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}
        
        {needBbox && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>BBox 필드</label>
            <select value={bboxField} onChange={(e) => setBboxField(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="">선택하세요</option>
              {detectedKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #DDD', backgroundColor: '#fff' }}>
            취소
          </button>
          <button onClick={handleConfirm} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#007AFF', color: 'white' }}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface FileFieldProps {
  label: string;
  value: string;
  accept: string;
  onChange: (file: File) => void;
}

const FileField: React.FC<FileFieldProps> = ({ label, value, accept, onChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(event.target.files === null || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setSelectedFile(file);
    if(onChange) onChange(file)
  };
  return <div>
    <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', fontWeight: '500' }}>{label}</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <div style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '2px solid #d9d9d988', backgroundColor: '#fff' }}>
        <span style={{fontSize:'17px', color:"var(--black-500)"}}>{selectedFile ? selectedFile.name : value}</span>
      </div>

      <label className='file0AddBtn' style={{width:'93px', height:'49px'}}>
        <input type="file" accept={accept} name="joinfile" id="file1Input" required onChange={handleFileChange} />
        <div className='btn-primary0' style={{width:'100%', height:'100%'}}>
          <span>파일 변경</span>
        </div>
      </label>

    </div>
  </div>
};

export default BoundingBoxIoUComparison;
