import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TreatmentBudget, 
  BudgetItem, 
  Patient, 
  ProfessionalDoctor, 
  Branch, 
  TreatmentTariffItem,
  ClinicSettings
} from '../../types/clinical';
import { ClinicalDatabase } from '../../services/db';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  MessageSquare, 
  CheckCircle2, 
  FileText,
  UserCheck,
  Pencil
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { shareBudgetViaWhatsAppPdf } from '../../utils/budgetExporter';

export interface BudgetItemInput {
  id: string;
  pieza: string;
  nombre: string;
  cant: number;
  precio: number;
}

interface BudgetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBudget: (budget: TreatmentBudget, shouldOpenPrint?: boolean, shouldOpenWhatsApp?: boolean) => void;
  patients: Patient[];
  doctors: ProfessionalDoctor[];
  branches: Branch[];
  tariffs?: TreatmentTariffItem[];
  defaultPatient?: Patient;
  initialItem?: { toothNumber?: number; name: string; price: number };
  budgetToEdit?: TreatmentBudget | null;
}

export const PIEZAS_DENTALES_OPTIONS = [
  { group: '', label: 'Gral / General', value: '' },
  { group: 'Zonas / Arcadas', label: 'Arcada Superior', value: 'Arcada Sup.' },
  { group: 'Zonas / Arcadas', label: 'Arcada Inferior', value: 'Arcada Inf.' },
  { group: 'Zonas / Arcadas', label: 'Ambas Arcadas', value: 'Ambas Arcadas' },
  // Cuadrante 1
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.8 - Tercer Molar', value: 'Pieza 1.8' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.7 - Segundo Molar', value: 'Pieza 1.7' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.6 - Primer Molar', value: 'Pieza 1.6' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.5 - Segundo Premolar', value: 'Pieza 1.5' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.4 - Primer Premolar', value: 'Pieza 1.4' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.3 - Canino', value: 'Pieza 1.3' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.2 - Incisivo Lateral', value: 'Pieza 1.2' },
  { group: 'Cuadrante 1 (Superior Der.)', label: '1.1 - Incisivo Central', value: 'Pieza 1.1' },
  // Cuadrante 2
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.1 - Incisivo Central', value: 'Pieza 2.1' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.2 - Incisivo Lateral', value: 'Pieza 2.2' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.3 - Canino', value: 'Pieza 2.3' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.4 - Primer Premolar', value: 'Pieza 2.4' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.5 - Segundo Premolar', value: 'Pieza 2.5' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.6 - Primer Molar', value: 'Pieza 2.6' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.7 - Segundo Molar', value: 'Pieza 2.7' },
  { group: 'Cuadrante 2 (Superior Izq.)', label: '2.8 - Tercer Molar', value: 'Pieza 2.8' },
  // Cuadrante 3
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.1 - Incisivo Central', value: 'Pieza 3.1' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.2 - Incisivo Lateral', value: 'Pieza 3.2' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.3 - Canino', value: 'Pieza 3.3' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.4 - Primer Premolar', value: 'Pieza 3.4' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.5 - Segundo Premolar', value: 'Pieza 3.5' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.6 - Primer Molar', value: 'Pieza 3.6' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.7 - Segundo Molar', value: 'Pieza 3.7' },
  { group: 'Cuadrante 3 (Inferior Izq.)', label: '3.8 - Tercer Molar', value: 'Pieza 3.8' },
  // Cuadrante 4
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.8 - Tercer Molar', value: 'Pieza 4.8' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.7 - Segundo Molar', value: 'Pieza 4.7' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.6 - Primer Molar', value: 'Pieza 4.6' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.5 - Segundo Premolar', value: 'Pieza 4.5' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.4 - Primer Premolar', value: 'Pieza 4.4' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.3 - Canino', value: 'Pieza 4.3' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.2 - Incisivo Lateral', value: 'Pieza 4.2' },
  { group: 'Cuadrante 4 (Inferior Der.)', label: '4.1 - Incisivo Central', value: 'Pieza 4.1' },
  // Dentición Temporal
  { group: 'Dentición Temporal / Niños', label: 'Cuadrante 5 (Sup. Der. Temp.)', value: 'Pieza 5.5-5.1' },
  { group: 'Dentición Temporal / Niños', label: 'Cuadrante 6 (Sup. Izq. Temp.)', value: 'Pieza 6.1-6.5' },
  { group: 'Dentición Temporal / Niños', label: 'Cuadrante 7 (Inf. Izq. Temp.)', value: 'Pieza 7.1-7.5' },
  { group: 'Dentición Temporal / Niños', label: 'Cuadrante 8 (Inf. Der. Temp.)', value: 'Pieza 8.5-8.1' },
];

function formatFecha(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = meses[monthIdx] || '';
  return `${parseInt(d, 10)} de ${monthName} de ${y}`;
}

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  const reversed = body.split('').reverse();
  let formatted = '';
  for (let i = 0; i < reversed.length; i++) {
    if (i > 0 && i % 3 === 0) formatted = '.' + formatted;
    formatted = reversed[i] + formatted;
  }
  return formatted + (dv ? '-' + dv : '');
}

function formatCLP(val: number | string): string {
  return "$" + Number(val || 0).toLocaleString('es-CL');
}

export const BudgetBuilderModal: React.FC<BudgetBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveBudget,
  patients,
  doctors,
  branches,
  defaultPatient,
  initialItem,
  budgetToEdit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // Clinic settings
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => ClinicalDatabase.getClinicSettings());

  // Professional state - Dr. Alejandro David is ALWAYS default & first choice
  const [doctorNombre, setDoctorNombre] = useState<string>('Dr. Alejandro David');
  const [doctorEsp, setDoctorEsp] = useState<string>('Implantología & Cirugía Oral');

  // Patient state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [pacNombre, setPacNombre] = useState<string>('');
  const [pacRut, setPacRut] = useState<string>('');
  const [pacTelefono, setPacTelefono] = useState<string>('');

  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState<string>('');

  // Treatments state
  const [items, setItems] = useState<BudgetItemInput[]>([
    {
      id: `item-1`,
      pieza: '',
      nombre: '',
      cant: 1,
      precio: 0
    }
  ]);

  // Load clinic settings and logo
  useEffect(() => {
    const settings = ClinicalDatabase.getClinicSettings();
    setClinicSettings(settings);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = settings.logoUrl || '/pagnina.png';
    img.onload = () => {
      logoImageRef.current = img;
      renderCanvas();
    };
    img.onerror = () => {
      // Fallback
      logoImageRef.current = null;
      renderCanvas();
    };
  }, [isOpen]);

  // Update fields when selecting another registered patient
  const handleSelectPatientDropdown = (patientId: string) => {
    setSelectedPatientId(patientId);
    if (!patientId) {
      setPacNombre('');
      setPacRut('');
      setPacTelefono('');
      return;
    }
    const p = patients.find(pat => pat.id === patientId);
    if (p) {
      setPacNombre(`${p.firstName} ${p.lastName}`);
      setPacRut(formatRut(p.documentId));
      setPacTelefono(p.phone || p.whatsapp || '');
    }
  };

  // Reset/Initialize whenever modal opens or when budgetToEdit / defaultPatient changes
  useEffect(() => {
    if (isOpen) {
      const settings = ClinicalDatabase.getClinicSettings();
      setClinicSettings(settings);

      if (budgetToEdit) {
        setDoctorNombre(budgetToEdit.doctorName || 'Dr. Alejandro David');
        const foundDoc = doctors.find(d => d.id === budgetToEdit.doctorId || d.name === budgetToEdit.doctorName);
        setDoctorEsp(foundDoc?.specialty || 'Implantología & Cirugía Oral');
        setSelectedPatientId(budgetToEdit.patientId || '');
        setPacNombre(budgetToEdit.patientName || '');
        setPacRut(formatRut(budgetToEdit.patientRut || ''));
        setPacTelefono(budgetToEdit.patientPhone || '');
        setFecha(budgetToEdit.createdAt || new Date().toISOString().split('T')[0]);
        setObservaciones(budgetToEdit.notes || '');

        const mappedItems: BudgetItemInput[] = (budgetToEdit.items || []).map((it, idx) => {
          let pieza = '';
          let nombre = it.description;
          const match = it.description.match(/^\[(.*?)\]\s*(.*)$/);
          if (match) {
            pieza = match[1];
            nombre = match[2];
          } else if (it.toothNumber) {
            pieza = `Pieza ${it.toothNumber}`;
          }
          return {
            id: it.id || `item-edit-${idx}-${Date.now()}`,
            pieza,
            nombre,
            cant: it.quantity || 1,
            precio: it.unitPrice || it.patientCopay || 0
          };
        });

        setItems(mappedItems.length > 0 ? mappedItems : [
          {
            id: `item-${Date.now()}`,
            pieza: '',
            nombre: '',
            cant: 1,
            precio: 0
          }
        ]);
      } else {
        setDoctorNombre('Dr. Alejandro David');
        setDoctorEsp('Implantología & Cirugía Oral');

        if (defaultPatient) {
          setSelectedPatientId(defaultPatient.id);
          setPacNombre(`${defaultPatient.firstName} ${defaultPatient.lastName}`);
          setPacRut(formatRut(defaultPatient.documentId));
          setPacTelefono(defaultPatient.phone || defaultPatient.whatsapp || '');
        } else {
          setSelectedPatientId('');
          setPacNombre('');
          setPacRut('');
          setPacTelefono('');
        }

        setFecha(new Date().toISOString().split('T')[0]);
        setObservaciones('');

        if (initialItem) {
          setItems([
            {
              id: `item-${Date.now()}`,
              pieza: initialItem.toothNumber ? `Pieza ${initialItem.toothNumber}` : '',
              nombre: initialItem.name || '',
              cant: 1,
              precio: initialItem.price || 0
            }
          ]);
        } else {
          setItems([
            {
              id: `item-${Date.now()}`,
              pieza: '',
              nombre: '',
              cant: 1,
              precio: 0
            }
          ]);
        }
      }
    }
  }, [isOpen, budgetToEdit, defaultPatient, initialItem, doctors]);

  // Add Treatment Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pieza: '',
        nombre: '',
        cant: 1,
        precio: 0
      }
    ]);
  };

  // Update Treatment Row
  const handleUpdateItem = (id: string, updates: Partial<BudgetItemInput>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Remove Treatment Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{
        id: `item-${Date.now()}`,
        pieza: '',
        nombre: '',
        cant: 1,
        precio: 0
      }]);
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Canvas Real-Time Render Function (Exact Match to User Snippet)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);

    // Logo on right
    const logoImg = logoImageRef.current;
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
      const logoW = 340; 
      const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;
      ctx.drawImage(logoImg, w - logoW - 40, 30, logoW, logoH);
    }

    // Top-left header from clinic settings
    ctx.textAlign = "left";
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(clinicSettings.name || "Consulta dental Daaron", 50, 60);

    ctx.fillStyle = "#7A7568";
    ctx.font = "13px sans-serif";
    const addressLine1 = clinicSettings.address || "Maipú 461 edificio Salman local";
    const addressLine2 = clinicSettings.city ? `${clinicSettings.city}${clinicSettings.phone ? ` • Tel: ${clinicSettings.phone}` : ''}` : "304 piso 3 Linares";
    ctx.fillText(addressLine1, 50, 82);
    ctx.fillText(addressLine2, 50, 100);

    const docName = doctorNombre || 'Dr. Alejandro David';
    const docEspecialidad = doctorEsp || (docName.includes('Alejandro') ? 'Implantología & Cirugía Oral' : 'Cirujano Dentista');

    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 21px Georgia, serif";
    ctx.fillText(docName, 50, 130);

    ctx.fillStyle = "#7A7568";
    ctx.font = "15px sans-serif";
    ctx.fillText(docEspecialidad, 50, 150);

    // Green Divider Line
    ctx.strokeStyle = "#1F4B44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 185);
    ctx.lineTo(w - 50, 185);
    ctx.stroke();

    // Patient
    const nombre = pacNombre || '—';
    const rut = pacRut || '—';
    const telefono = pacTelefono || '—';
    const fechaFmt = formatFecha(fecha);

    ctx.textAlign = "left";
    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("PACIENTE", 50, 215);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(nombre, 50, 237);

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("RUT", 320, 215);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(rut, 320, 237);

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("TELÉFONO", 470, 215);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(telefono, 470, 237);

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("FECHA", 640, 215);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(fechaFmt, 640, 237);

    ctx.strokeStyle = "#D8D2C4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 245); ctx.lineTo(300, 245);
    ctx.moveTo(320, 245); ctx.lineTo(450, 245);
    ctx.moveTo(470, 245); ctx.lineTo(620, 245);
    ctx.moveTo(640, 245); ctx.lineTo(w - 50, 245);
    ctx.stroke();

    // Title
    ctx.fillStyle = "#1F4B44";
    ctx.font = "italic bold 19px Georgia, serif";
    ctx.fillText("Presupuesto de Tratamiento", 50, 285);

    // Table Header
    let y = 315;
    ctx.fillStyle = "#F0F6F4";
    ctx.fillRect(50, y, w - 100, 30);

    ctx.fillStyle = "#1F4B44";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("ZONA / PIEZA / TRATAMIENTO", 60, y + 20);
    ctx.textAlign = "center";
    ctx.fillText("CANT.", 500, y + 20);
    ctx.textAlign = "right";
    ctx.fillText("UNITARIO", 630, y + 20);
    ctx.fillText("TOTAL", w - 60, y + 20);

    y += 40;

    let granTotal = 0;
    const validItems = items.filter(it => it.nombre.trim().length > 0 || it.precio > 0);

    if (validItems.length === 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#7A7568";
      ctx.font = "italic 14px sans-serif";
      ctx.fillText("Sin detalles agregados...", 60, y + 10);
      y += 30;
    } else {
      validItems.forEach((item) => {
        const piezaVal = item.pieza;
        const itemNombre = item.nombre || 'Tratamiento sin especificar';
        const cant = parseInt(item.cant.toString()) || 1;
        const precio = parseFloat(item.precio.toString()) || 0;
        const subtotal = cant * precio;
        granTotal += subtotal;

        const textoTratamiento = piezaVal ? `[${piezaVal}] ${itemNombre}` : itemNombre;

        ctx.textAlign = "left";
        ctx.fillStyle = "#1B2A3D";
        ctx.font = "14px sans-serif";
        ctx.fillText(textoTratamiento, 60, y);

        ctx.textAlign = "center";
        ctx.fillText(cant.toString(), 500, y);

        ctx.textAlign = "right";
        ctx.fillText(formatCLP(precio), 630, y);
        ctx.fillText(formatCLP(subtotal), w - 60, y);

        y += 12;
        ctx.strokeStyle = "#EFEBE1";
        ctx.beginPath();
        ctx.moveTo(50, y); ctx.lineTo(w - 50, y);
        ctx.stroke();
        y += 22;
      });
    }

    // Total Line
    ctx.strokeStyle = "#1F4B44";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(400, y); ctx.lineTo(w - 50, y);
    ctx.stroke();

    y += 30;
    ctx.textAlign = "right";
    ctx.fillStyle = "#1F4B44";
    ctx.font = "bold 18px Georgia, serif";
    ctx.fillText("TOTAL ESTIMADO:", w - 200, y);
    ctx.fillText(formatCLP(granTotal), w - 60, y);

    // Observations
    const obs = observaciones;
    if (obs) {
      y += 45;
      ctx.textAlign = "left";
      ctx.fillStyle = "#7A7568";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("OBSERVACIONES / CONDICIONES:", 50, y);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#1B2A3D";
      
      const words = obs.split(' ');
      let line = '';
      let obsY = y + 20;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 450 && n > 0) {
          ctx.fillText(line, 50, obsY);
          line = words[n] + ' ';
          obsY += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 50, obsY);
    }

    // Signature
    ctx.textAlign = "center";
    ctx.strokeStyle = "#1B2A3D";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 270, h - 140);
    ctx.lineTo(w - 70, h - 140);
    ctx.stroke();

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("FIRMA Y TIMBRE", w - 170, h - 120);

    // Footer
    ctx.textAlign = "left";
    ctx.strokeStyle = "#D8D2C4";
    ctx.beginPath();
    ctx.moveTo(50, h - 90);
    ctx.lineTo(w - 50, h - 90);
    ctx.stroke();

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("HORARIO DE ATENCIÓN:", 50, h - 65);
    ctx.font = "13px sans-serif";
    ctx.fillText(clinicSettings.hours || "Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs. — Sábado 10:00 a 13:00 hrs.", 50, h - 45);
  }, [clinicSettings, doctorNombre, doctorEsp, pacNombre, pacTelefono, pacRut, fecha, items, observaciones]);

  // Re-render canvas whenever input states change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  if (!isOpen) return null;

  // Build TreatmentBudget domain model for clinical state synchronization
  const buildBudgetData = (): TreatmentBudget => {
    const validItems = items.filter(it => it.nombre.trim().length > 0 || it.precio > 0);
    const targetPatient = patients.find(p => p.id === selectedPatientId) || defaultPatient || {
      id: `pat-${Date.now()}`,
      firstName: pacNombre.split(' ')[0] || 'Paciente',
      lastName: pacNombre.split(' ').slice(1).join(' ') || 'General',
      documentId: pacRut || '11.111.111-1',
      phone: '+56 9 8765 4321',
      email: 'paciente@consulta.cl',
      birthDate: '1990-01-01',
      allergies: [],
      medicalAlerts: [],
      anamnesis: { systemicDiseases: [], medications: [], smoker: false, diabetic: false, hypertensive: false, pregnant: false },
      documents: [],
      evolutions: [],
      treatments: [],
      prescriptions: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    const targetDoctor = doctors.find(d => d.name === doctorNombre) || doctors[0] || {
      id: 'doc-1',
      name: doctorNombre,
      rut: '14.555.666-7',
      specialty: doctorEsp,
      phone: '+56 9 1234 5678',
      email: 'doctor@daaron.cl',
      branchIds: ['branch-1']
    };

    const calculatedSubtotal = validItems.reduce((acc, it) => acc + ((Number(it.precio) || 0) * (Number(it.cant) || 1)), 0);

    const budgetItems: BudgetItem[] = validItems.map((it, idx) => {
      const lineTotal = (Number(it.precio) || 0) * (Number(it.cant) || 1);
      return {
        id: `bi-${Date.now()}-${idx}`,
        tariffItemId: `manual-${idx}`,
        code: `TX-${idx + 1}`,
        description: it.pieza ? `[${it.pieza}] ${it.nombre}` : (it.nombre || 'Tratamiento Dental'),
        quantity: it.cant || 1,
        unitPrice: Number(it.precio) || 0,
        discountPercent: 0,
        insuranceCoverageAmount: 0,
        patientCopay: lineTotal,
        total: lineTotal,
        status: 'PENDING'
      };
    });

    if (budgetToEdit) {
      return {
        ...budgetToEdit,
        patientId: targetPatient.id,
        patientName: pacNombre || `${targetPatient.firstName} ${targetPatient.lastName}`,
        patientPhone: pacTelefono || targetPatient.phone || targetPatient.whatsapp || '',
        patientRut: pacRut || targetPatient.documentId || '',
        doctorId: targetDoctor.id,
        doctorName: doctorNombre || targetDoctor.name,
        branchId: budgetToEdit.branchId || branches[0]?.id || 'branch-1',
        createdAt: fecha || budgetToEdit.createdAt,
        items: budgetItems,
        subtotal: calculatedSubtotal,
        totalPatient: calculatedSubtotal,
        balanceDue: Math.max(0, calculatedSubtotal - (budgetToEdit.totalPaid || 0)),
        notes: observaciones
      };
    }

    return {
      id: `bud-${Date.now()}`,
      budgetNumber: `PRE-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: targetPatient.id,
      patientName: pacNombre || `${targetPatient.firstName} ${targetPatient.lastName}`,
      patientPhone: pacTelefono || targetPatient.phone || targetPatient.whatsapp || '',
      patientRut: pacRut || targetPatient.documentId || '',
      doctorId: targetDoctor.id,
      doctorName: doctorNombre || targetDoctor.name,
      branchId: branches[0]?.id || 'branch-1',
      createdAt: fecha || new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACCEPTED',
      items: budgetItems,
      subtotal: calculatedSubtotal,
      discountTotal: 0,
      insuranceTotal: 0,
      totalPatient: calculatedSubtotal,
      totalPaid: 0,
      balanceDue: calculatedSubtotal,
      notes: observaciones
    };
  };

  // Download PDF via jsPDF from Canvas (Letter format 8.5 x 11 in)
  const handleDownloadPdf = () => {
    renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);

    const pac = pacNombre || 'presupuesto';
    pdf.save(`Presupuesto_${pac.replace(/\s+/g, '_')}.pdf`);
  };

  // Save to Clinical Record and DB
  const handleSaveToClinicalRecord = () => {
    const budget = buildBudgetData();
    if (budget.items.length === 0) {
      alert('Por favor ingresa al menos un tratamiento con precio.');
      return;
    }
    onSaveBudget(budget);
    onClose();
  };

  const [isSharingWa, setIsSharingWa] = useState(false);
  const [waToast, setWaToast] = useState<string | null>(null);

  // Share via WhatsApp (Official PDF document, no written text body)
  const handleSendWhatsApp = async () => {
    const budget = buildBudgetData();
    if (budget.items.length === 0) {
      alert('Por favor ingresa al menos un tratamiento con precio.');
      return;
    }
    const targetPatient = patients.find(p => p.id === selectedPatientId) || defaultPatient;
    const targetDoctor = doctors.find(d => d.name === doctorNombre) || doctors[0];
    const settings = ClinicalDatabase.getClinicSettings();

    try {
      setIsSharingWa(true);
      const res = await shareBudgetViaWhatsAppPdf(budget, targetPatient, targetDoctor, settings);
      if (res.message) {
        setWaToast(res.message);
        setTimeout(() => setWaToast(null), 6500);
      }
    } catch (err) {
      console.error('Error sharing budget PDF via WhatsApp:', err);
    } finally {
      setIsSharingWa(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-[#EFEBE1] text-[#1B2A3D] border border-[#D8D2C4] w-full max-w-[1240px] max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden budget-gen-root">
        
        {/* Header Modal Bar */}
        <div className="bg-[#FFFFFF] border-b border-[#D8D2C4] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/pagnina.png" 
              alt="Daaron Consulta Dental" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Hide if broken
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-bold text-base sm:text-lg text-[#1F4B44] leading-tight flex items-center gap-2">
                <span>{budgetToEdit ? `Editar Presupuesto ${budgetToEdit.budgetNumber}` : 'Generador de Presupuesto PDF — Daaron Consulta Dental'}</span>
                {budgetToEdit && (
                  <span className="text-[11px] font-sans font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Modo Edición
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#7A7568] mt-0.5">
                {budgetToEdit 
                  ? 'Modifica los tratamientos, cantidades, precios unitarios u observaciones del presupuesto.'
                  : 'Genera presupuestos dentales en formato Carta Vertical y descárgalos en PDF.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#FCFBF8] hover:bg-[#EFEBE1] text-[#7A7568] hover:text-[#1B2A3D] border border-[#D8D2C4] transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column Layout */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Form Panel (420px approx in 12 cols = 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="panel shadow-sm">
                
                {/* Professional */}
                <h2>Profesional</h2>
                <div className="field">
                  <label htmlFor="doctorNombre">Nombre del médico / profesional</label>
                  <select 
                    id="doctorNombre"
                    value={doctorNombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDoctorNombre(val);
                      if (val === 'Dr. Alejandro David') {
                        setDoctorEsp('Implantología & Cirugía Oral');
                      } else if (val === 'Dr. Jorge de Luque' || val === 'Dr. Jorge Deluque') {
                        setDoctorEsp('Rehabilitación Oral & Estética');
                      } else {
                        const found = doctors.find(d => d.name === val);
                        if (found) setDoctorEsp(found.specialty);
                        else if (!val) setDoctorEsp('');
                      }
                    }}
                  >
                    <option value="Dr. Alejandro David">Dr. Alejandro David (Predeterminado)</option>
                    <option value="Dr. Jorge de Luque">Dr. Jorge de Luque</option>
                    {doctors
                      .filter(d => d.name !== 'Dr. Alejandro David' && d.name !== 'Dr. Jorge de Luque' && d.name !== 'Dr. Jorge Deluque')
                      .map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="doctorEsp">Especialidad</label>
                  <select 
                    id="doctorEsp"
                    value={doctorEsp}
                    onChange={(e) => setDoctorEsp(e.target.value)}
                  >
                    <option value="">Seleccionar especialidad</option>
                    <option value="Odontólogo general">Odontólogo general</option>
                    <option value="Ortodoncista">Ortodoncista</option>
                    <option value="Implantólogo & Rehabilitador">Implantólogo & Rehabilitador</option>
                    <option value="Endodoncista">Endodoncista</option>
                    <option value="Odontopediatra">Odontopediatra</option>
                    <option value="Periodoncista">Periodoncista</option>
                  </select>
                </div>

                {/* Patient */}
                <h2 className="section-spacer">Paciente</h2>

                {/* Patient Quick Selector Helper */}
                {patients.length > 0 && (
                  <div className="field">
                    <label className="flex items-center justify-between">
                      <span>Cargar datos desde paciente registrado</span>
                      <span className="text-[10px] text-teal-700 font-normal lowercase">(autocompleta ficha)</span>
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => handleSelectPatientDropdown(e.target.value)}
                      className="bg-teal-50/50 border-teal-300 font-semibold"
                    >
                      <option value="">-- Seleccionar o escribir manualmente --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} — RUT: {p.documentId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="pacNombre">Nombre completo</label>
                  <input 
                    type="text" 
                    id="pacNombre" 
                    placeholder="Nombre del paciente"
                    value={pacNombre}
                    onChange={(e) => setPacNombre(e.target.value)}
                  />
                </div>

                <div className="row2">
                  <div className="field">
                    <label htmlFor="pacRut">RUT</label>
                    <input 
                      type="text" 
                      id="pacRut" 
                      placeholder="12.345.678-9"
                      value={pacRut}
                      onChange={(e) => setPacRut(formatRut(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="pacTelefono">Teléfono / WhatsApp</label>
                    <input 
                      type="text" 
                      id="pacTelefono" 
                      placeholder="+56 9 1234 5678"
                      value={pacTelefono}
                      onChange={(e) => setPacTelefono(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="fecha">Fecha</label>
                  <input 
                    type="date" 
                    id="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>

                {/* Treatments / Services */}
                <h2 className="section-spacer">Tratamientos / Servicios</h2>
                <div id="itemsContainer" className="flex flex-col gap-1">
                  {items.map((item, index) => (
                    <div key={item.id} className="item-card">
                      <span className="item-num">#{index + 1}</span>
                      <button 
                        className="item-remove" 
                        type="button" 
                        title="Eliminar fila"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        ✕
                      </button>

                      <div className="field" style={{ marginBottom: '10px' }}>
                        <div className="row-item">
                          <div>
                            <label>Zona / Pieza</label>
                            <select 
                              className="item-pieza"
                              value={item.pieza}
                              onChange={(e) => handleUpdateItem(item.id, { pieza: e.target.value })}
                            >
                              <option value="">Gral / General</option>
                              <optgroup label="Zonas / Arcadas">
                                <option value="Arcada Sup.">Arcada Superior</option>
                                <option value="Arcada Inf.">Arcada Inferior</option>
                                <option value="Ambas Arcadas">Ambas Arcadas</option>
                              </optgroup>
                              <optgroup label="Cuadrante 1 (Superior Der.)">
                                <option value="Pieza 1.8">1.8 - Tercer Molar</option>
                                <option value="Pieza 1.7">1.7 - Segundo Molar</option>
                                <option value="Pieza 1.6">1.6 - Primer Molar</option>
                                <option value="Pieza 1.5">1.5 - Segundo Premolar</option>
                                <option value="Pieza 1.4">1.4 - Primer Premolar</option>
                                <option value="Pieza 1.3">1.3 - Canino</option>
                                <option value="Pieza 1.2">1.2 - Incisivo Lateral</option>
                                <option value="Pieza 1.1">1.1 - Incisivo Central</option>
                              </optgroup>
                              <optgroup label="Cuadrante 2 (Superior Izq.)">
                                <option value="Pieza 2.1">2.1 - Incisivo Central</option>
                                <option value="Pieza 2.2">2.2 - Incisivo Lateral</option>
                                <option value="Pieza 2.3">2.3 - Canino</option>
                                <option value="Pieza 2.4">2.4 - Primer Premolar</option>
                                <option value="Pieza 2.5">2.5 - Segundo Premolar</option>
                                <option value="Pieza 2.6">2.6 - Primer Molar</option>
                                <option value="Pieza 2.7">2.7 - Segundo Molar</option>
                                <option value="Pieza 2.8">2.8 - Tercer Molar</option>
                              </optgroup>
                              <optgroup label="Cuadrante 3 (Inferior Izq.)">
                                <option value="Pieza 3.1">3.1 - Incisivo Central</option>
                                <option value="Pieza 3.2">3.2 - Incisivo Lateral</option>
                                <option value="Pieza 3.3">3.3 - Canino</option>
                                <option value="Pieza 3.4">3.4 - Primer Premolar</option>
                                <option value="Pieza 3.5">3.5 - Segundo Premolar</option>
                                <option value="Pieza 3.6">3.6 - Primer Molar</option>
                                <option value="Pieza 3.7">3.7 - Segundo Molar</option>
                                <option value="Pieza 3.8">3.8 - Tercer Molar</option>
                              </optgroup>
                              <optgroup label="Cuadrante 4 (Inferior Der.)">
                                <option value="Pieza 4.8">4.8 - Tercer Molar</option>
                                <option value="Pieza 4.7">4.7 - Segundo Molar</option>
                                <option value="Pieza 4.6">4.6 - Primer Molar</option>
                                <option value="Pieza 4.5">4.5 - Segundo Premolar</option>
                                <option value="Pieza 4.4">4.4 - Primer Premolar</option>
                                <option value="Pieza 4.3">4.3 - Canino</option>
                                <option value="Pieza 4.2">4.2 - Incisivo Lateral</option>
                                <option value="Pieza 4.1">4.1 - Incisivo Central</option>
                              </optgroup>
                              <optgroup label="Dentición Temporal / Niños">
                                <option value="Pieza 5.5-5.1">Cuadrante 5 (Sup. Der. Temp.)</option>
                                <option value="Pieza 6.1-6.5">Cuadrante 6 (Sup. Izq. Temp.)</option>
                                <option value="Pieza 7.1-7.5">Cuadrante 7 (Inf. Izq. Temp.)</option>
                                <option value="Pieza 8.5-8.1">Cuadrante 8 (Inf. Der. Temp.)</option>
                              </optgroup>
                            </select>
                          </div>
                          <div>
                            <label>Tratamiento / Prestación</label>
                            <input 
                              type="text" 
                              className="item-nombre" 
                              placeholder="Ej: Obturación Resina Composite"
                              value={item.nombre}
                              onChange={(e) => handleUpdateItem(item.id, { nombre: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row2" style={{ marginBottom: 0 }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Cant.</label>
                          <input 
                            type="number" 
                            className="item-cant" 
                            value={item.cant} 
                            min="1"
                            onChange={(e) => handleUpdateItem(item.id, { cant: Math.max(1, parseInt(e.target.value) || 1) })}
                          />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Precio Unit. ($)</label>
                          <input 
                            type="number" 
                            className="item-precio" 
                            placeholder="35000" 
                            min="0"
                            value={item.precio === 0 ? '' : item.precio}
                            onChange={(e) => handleUpdateItem(item.id, { precio: Math.max(0, parseFloat(e.target.value) || 0) })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn-add flex items-center justify-center gap-1.5 cursor-pointer" 
                  id="addItem" 
                  type="button"
                  onClick={handleAddItem}
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar tratamiento</span>
                </button>

                <div className="field" style={{ marginTop: '14px' }}>
                  <label htmlFor="observaciones">Observaciones / Condición de pago</label>
                  <textarea 
                    id="observaciones" 
                    placeholder="Ej: Válido por 30 días. Pago en 3 cuotas..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    className="btn-pdf flex items-center justify-center gap-2 cursor-pointer shadow-md" 
                    id="downloadPdfBtn" 
                    type="button"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="w-5 h-5" />
                    <span>Descargar Presupuesto (PDF)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveToClinicalRecord}
                      className="px-3 py-2.5 rounded-md bg-[#2F6E63] hover:bg-[#1F4B44] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Guarda el presupuesto en la ficha del paciente para seguimiento y cobro"
                    >
                      <Save className="w-4 h-4" />
                      <span>{budgetToEdit ? 'Actualizar en Ficha' : 'Guardar en Ficha'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      disabled={isSharingWa}
                      className="px-3 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Enviar documento PDF oficial del presupuesto por WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isSharingWa ? 'Preparando...' : 'WhatsApp (PDF)'}</span>
                    </button>
                  </div>
                </div>

                {waToast && (
                  <div className="p-3 bg-emerald-900 text-emerald-100 rounded-lg text-xs flex items-center justify-between gap-2 shadow animate-in fade-in">
                    <span>{waToast}</span>
                    <button type="button" onClick={() => setWaToast(null)} className="text-emerald-300 font-bold">×</button>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Live Real-Time Canvas Preview Shell (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1F4B44]" />
                  <span className="text-xs font-bold text-[#1F4B44] uppercase tracking-wider">
                    Vista Previa en Tiempo Real (Formato Carta Vertical)
                  </span>
                </div>
                <span className="text-[11px] text-[#7A7568] bg-[#DDD7C8] px-2 py-0.5 rounded font-mono">
                  825 × 1068 px
                </span>
              </div>

              <div className="preview-shell">
                <canvas 
                  ref={canvasRef} 
                  id="budgetCanvas" 
                  width="825" 
                  height="1068"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
