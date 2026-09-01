import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Patient, ProfessionalDoctor } from '../../types/clinical';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  MessageSquare, 
  Printer, 
  Sparkles, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  Calendar,
  Pill,
  RefreshCw
} from 'lucide-react';

interface PrescriptionItem {
  id: string;
  name: string;
  instructions: string;
}

interface PatientPrescriptionGeneratorProps {
  patient: Patient;
  doctors: ProfessionalDoctor[];
  onSaveToHistory?: (record: {
    doctorName: string;
    specialty: string;
    date: string;
    items: PrescriptionItem[];
  }) => void;
}

const COMMON_DENTAL_MEDS = [
  { name: 'Amoxicilina 875 mg + Ácido Clavulánico 125 mg', instructions: 'Tomar 1 comprimido cada 12 horas por 7 días vía oral después de las comidas.' },
  { name: 'Amoxicilina 500 mg', instructions: 'Tomar 1 cápsula cada 8 horas por 7 días vía oral con abundante agua.' },
  { name: 'Ibuprofeno 600 mg', instructions: 'Tomar 1 comprimido cada 8 horas por 3 a 5 días en caso de dolor o inflamación.' },
  { name: 'Ketorolaco 10 mg (SL)', instructions: 'Disolver 1 comprimido bajo la lengua cada 8 horas por máximo 3 días (dolor agudo).' },
  { name: 'Paracetamol 1 g', instructions: 'Tomar 1 comprimido cada 8 horas según dolor (máximo 4 g al día).' },
  { name: 'Clorhexidina 0.12% Colutorio', instructions: 'Realizar enjuagues con 15 ml durante 30 segundos, 2 veces al día después del cepillado (no enjuagar con agua).' },
  { name: 'Ketoprofeno 100 mg', instructions: 'Tomar 1 comprimido cada 12 horas por 3 días después de alimentos.' },
  { name: 'Azitromicina 500 mg', instructions: 'Tomar 1 comprimido al día 1 hora antes de la comida por 3 días (alérgicos a penicilina).' }
];

export const PatientPrescriptionGenerator: React.FC<PatientPrescriptionGeneratorProps> = ({
  patient,
  doctors,
  onSaveToHistory
}) => {
  // Preselected Doctor & Specialty
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('Dr. Alejandro David');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Odontólogo general');
  
  // Patient Details
  const [patientName, setPatientName] = useState<string>(`${patient.firstName} ${patient.lastName}`);
  const [patientRut, setPatientRut] = useState<string>(patient.documentId || '');
  const [patientAge, setPatientAge] = useState<string>(patient.birthDate ? `${calculateAge(patient.birthDate)} años` : '');
  const [prescriptionDate, setPrescriptionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Medications List
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    {
      id: 'med-1',
      name: 'Ibuprofeno 600 mg',
      instructions: 'Tomar 1 comprimido cada 8 horas por 4 días después de las comidas.'
    },
    {
      id: 'med-2',
      name: 'Clorhexidina 0.12% Colutorio',
      instructions: 'Enjuagar con 15 ml durante 30 segundos, 2 veces al día por 7 días.'
    }
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function calculateAge(birthDateString: string): number {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Format RUT
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

  // Format Date in Chilean Spanish ("28 de agosto de 2026")
  function formatFecha(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  }

  // Add new empty medication
  const handleAddMedication = () => {
    const newId = `med-${Date.now()}`;
    setMedications(prev => [
      ...prev,
      { id: newId, name: '', instructions: '' }
    ]);
  };

  // Quick insert preset
  const handleInsertPreset = (preset: { name: string; instructions: string }) => {
    const newId = `med-${Date.now()}`;
    setMedications(prev => [
      ...prev,
      { id: newId, name: preset.name, instructions: preset.instructions }
    ]);
  };

  // Remove medication
  const handleRemoveMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  // Update medication
  const handleUpdateMedication = (id: string, field: 'name' | 'instructions', value: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Render Canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Background Paper
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#1B2A3D";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);

    // 2. Draw Daaron Logo
    const logoImg = new Image();
    logoImg.src = '/pagnina.png';
    logoImg.onload = () => {
      drawContent(ctx, w, h, logoImg);
    };
    if (logoImg.complete && logoImg.naturalWidth !== 0) {
      drawContent(ctx, w, h, logoImg);
    } else {
      drawContent(ctx, w, h, null);
    }
  };

  const drawContent = (ctx: CanvasRenderingContext2D, w: number, h: number, logoImg: HTMLImageElement | null) => {
    // Top Logo
    if (logoImg && logoImg.naturalWidth !== 0) {
      const logoW = 340;
      const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;
      ctx.drawImage(logoImg, w - logoW - 40, 30, logoW, logoH);
    }

    // Clinic Info
    ctx.textAlign = "left";
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("Consulta dental Daaron", 50, 60);

    ctx.fillStyle = "#7A7568";
    ctx.font = "16px sans-serif";
    ctx.fillText("Maipú 461 edificio Salman local", 50, 88);
    ctx.fillText("304 piso 3 Linares", 50, 110);

    // Doctor info
    const docName = selectedDoctorName || 'Dr(a). Nombre Apellido';
    const docEsp = selectedSpecialty || 'Especialidad';

    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 23px Georgia, serif";
    ctx.fillText(docName, 50, 145);

    ctx.fillStyle = "#2F6E63";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(docEsp, 50, 170);

    // Top Divider Line
    ctx.strokeStyle = "#1F4B44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 195);
    ctx.lineTo(w - 50, 195);
    ctx.stroke();

    // Patient Banner
    const nombre = patientName || '—';
    const edad = patientAge ? ` (${patientAge})` : '';
    const rut = patientRut || '—';
    const fecha = formatFecha(prescriptionDate);

    ctx.textAlign = "left";
    
    // PACIENTE
    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("PACIENTE", 50, 225);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(nombre + edad, 50, 250);

    // RUT
    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("RUT", 450, 225);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(rut, 450, 250);

    // FECHA
    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("FECHA", 620, 225);
    ctx.fillStyle = "#1B2A3D";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(fecha, 620, 250);

    // Horizontal underline boxes
    ctx.strokeStyle = "#D8D2C4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 260); ctx.lineTo(420, 260);
    ctx.moveTo(450, 260); ctx.lineTo(600, 260);
    ctx.moveTo(620, 260); ctx.lineTo(w - 50, 260);
    ctx.stroke();

    // Section Header: Indicaciones
    ctx.fillStyle = "#1F4B44";
    ctx.font = "italic bold 28px Georgia, serif";
    ctx.fillText("Indicaciones y Receta Médica", 50, 315);

    // Medications list
    let startY = 365;

    if (medications.length === 0) {
      ctx.fillStyle = "#7A7568";
      ctx.font = "italic 20px sans-serif";
      ctx.fillText("1. (Sin medicamentos ni indicaciones prescritas aún)", 50, startY);
    } else {
      medications.forEach((med, i) => {
        const medNombre = med.name.trim() || '(nombre del medicamento)';
        const indic = med.instructions.trim();

        ctx.fillStyle = "#2F6E63";
        ctx.font = "bold 24px monospace";
        ctx.fillText(`${i + 1}.`, 50, startY);

        ctx.fillStyle = "#1B2A3D";
        ctx.font = "bold 23px sans-serif";
        ctx.fillText(medNombre, 90, startY);

        startY += 32;

        if (indic) {
          ctx.fillStyle = "#33302A";
          ctx.font = "19px sans-serif";
          
          // Simple multi-line text wrap
          const maxChars = 65;
          if (indic.length > maxChars) {
            const words = indic.split(' ');
            let line = '';
            words.forEach(word => {
              if ((line + word).length > maxChars) {
                ctx.fillText(line, 90, startY);
                startY += 28;
                line = word + ' ';
              } else {
                line += word + ' ';
              }
            });
            if (line) {
              ctx.fillText(line, 90, startY);
              startY += 28;
            }
          } else {
            ctx.fillText(indic, 90, startY);
            startY += 30;
          }
        }

        // Dotted divider
        ctx.strokeStyle = "#D8D2C4";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(50, startY + 5);
        ctx.lineTo(w - 50, startY + 5);
        ctx.stroke();
        ctx.setLineDash([]);

        startY += 35;
      });
    }

    // Signature and Stamp
    ctx.textAlign = "center";
    ctx.strokeStyle = "#1B2A3D";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w - 290, h - 180);
    ctx.lineTo(w - 60, h - 180);
    ctx.stroke();

    ctx.fillStyle = "#7A7568";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("FIRMA Y TIMBRE PROFESIONAL", w - 175, h - 155);

    ctx.fillStyle = "#1B2A3D";
    ctx.font = "12px sans-serif";
    ctx.fillText(docName, w - 175, h - 138);

    // Timetable & Footer
    ctx.textAlign = "left";
    ctx.strokeStyle = "#D8D2C4";
    ctx.beginPath();
    ctx.moveTo(50, h - 110);
    ctx.lineTo(w - 50, h - 110);
    ctx.stroke();

    ctx.fillStyle = "#2F6E63";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("HORARIO DE ATENCIÓN:", 50, h - 85);
    ctx.fillStyle = "#555";
    ctx.font = "14px sans-serif";
    ctx.fillText("Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs.", 50, h - 65);
    ctx.fillText("Sábado 10:00 a 13:00 hrs. — Linares, Maule", 50, h - 46);
  };

  useEffect(() => {
    renderCanvas();
  }, [selectedDoctorName, selectedSpecialty, patientName, patientRut, patientAge, prescriptionDate, medications]);

  // Download PDF
  const handleDownloadPdf = () => {
    renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });

    const imgData = canvas.toDataURL('image/png');
    // Place on the right half of the landscape sheet (US Letter half sheet format)
    pdf.addImage(imgData, 'PNG', 5.5, 0, 5.5, 8.5);

    const cleanName = (patientName || 'Paciente').replace(/\s+/g, '_');
    pdf.save(`Receta_Daaron_${cleanName}_${prescriptionDate}.pdf`);

    if (onSaveToHistory) {
      onSaveToHistory({
        doctorName: selectedDoctorName,
        specialty: selectedSpecialty,
        date: prescriptionDate,
        items: medications
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // WhatsApp send
  const handleSendWhatsApp = () => {
    const cleanPhone = (patient.whatsapp || patient.phone || '').replace(/[^0-9]/g, '');
    const medsText = medications
      .map((m, idx) => `*${idx + 1}. ${m.name}*\n👉 ${m.instructions}`)
      .join('\n\n');

    const message = `🦷 *DAARON CONSULTA DENTAL — RECETA & INDICACIONES*\n\n` +
      `Estimado(a) *${patientName}*,\n` +
      `Le adjuntamos su receta odontológica e indicaciones emitidas por *${selectedDoctorName}* (${selectedSpecialty}):\n\n` +
      `📅 *Fecha:* ${formatFecha(prescriptionDate)}\n` +
      `🆔 *RUT:* ${patientRut}\n\n` +
      `💊 *MEDICAMENTOS & TRATAMIENTO:*\n${medsText}\n\n` +
      `📍 *Atención:* Maipú 461 edificio Salman local 304 piso 3, Linares\n` +
      `⏰ *Horario:* Lun a Vie 10:00-13:00 / 15:00-19:00 | Sáb 10:00-13:00\n\n` +
      `Ante cualquier duda con su medicación, no dude en comunicarse con nosotros. ¡Que tenga una pronta recuperación!`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3">
          <img 
            src="/pagnina.png" 
            alt="Daaron Consulta Dental" 
            className="h-11 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>Generador de Recetas Médicas & Indicaciones (PDF)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Daaron Consulta Dental — Linares. Emisión digital de recetas oficiales con firma, timbre y descarga en PDF.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="py-2 px-3 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Enviar receta por WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Receta PDF</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Receta generada y descargada exitosamente en formato PDF oficial!</span>
        </div>
      )}

      {/* Main Layout: Left Form + Right Live Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Prescriptions */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Professional Selector */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-700/80">
              <User className="w-4 h-4" />
              <span>Profesional Tratante</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nombre del Médico / Odontólogo
                </label>
                <select
                  value={selectedDoctorName}
                  onChange={(e) => setSelectedDoctorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="Dr. Alejandro David">Dr. Alejandro David</option>
                  <option value="Dr. Jorge Deluque">Dr. Jorge Deluque</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Especialidad
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="Odontólogo general">Odontólogo general</option>
                  <option value="Ortodoncista">Ortodoncista</option>
                  <option value="Cirujano Dentista">Cirujano Dentista</option>
                  <option value="Rehabilitador Oral">Rehabilitador Oral</option>
                  <option value="Endodoncista">Endodoncista</option>
                  <option value="Periodoncista">Periodoncista</option>
                </select>
              </div>
            </div>
          </div>

          {/* Patient Details Section */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-700/80">
              <User className="w-4 h-4" />
              <span>Datos del Paciente</span>
            </h4>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
                  placeholder="Nombre del paciente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    RUT
                  </label>
                  <input
                    type="text"
                    value={patientRut}
                    onChange={(e) => setPatientRut(formatRut(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    placeholder="Ej: 34 años"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plantillas Rápidas Frecuentes (Clic para agregar):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DENTAL_MEDS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertPreset(preset)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-teal-950 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/50 rounded-lg text-[11px] font-medium transition-all"
                >
                  + {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Medications Builder */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4" />
                <span>Medicamentos & Indicaciones ({medications.length})</span>
              </h4>
              
              <button
                type="button"
                onClick={handleAddMedication}
                className="py-1 px-2.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Medicamento</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {medications.map((med, index) => (
                <div key={med.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-700/80 relative flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-500/40 text-[10px] font-bold font-mono">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Eliminar este medicamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Medicamento / Presentación:
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleUpdateMedication(med.id, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
                      placeholder="Ej: Paracetamol 500 mg, Amoxicilina 875 mg..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Indicaciones de toma / Posología:
                    </label>
                    <textarea
                      rows={2}
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedication(med.id, 'instructions', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
                      placeholder="Ej: Tomar 1 comprimido cada 8 horas por 5 días después de las comidas..."
                    />
                  </div>
                </div>
              ))}

              {medications.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                  <p>No hay medicamentos en la receta.</p>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="mt-2 text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Prescribir primer medicamento
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="mt-2 w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DESCARGAR RECETA EN PDF</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Canvas Document Preview */}
        <div className="lg:col-span-6 flex flex-col gap-3 sticky top-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Vista Previa del Documento (Lámina Oficial)</span>
            </span>
            <button
              type="button"
              onClick={renderCanvas}
              className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Canvas Shell */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-2xl flex justify-center items-center overflow-x-auto">
            <canvas
              ref={canvasRef}
              width={825}
              height={1275}
              className="w-full max-w-[420px] bg-white rounded-lg shadow-lg border border-slate-700"
            />
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Formato oficial estandarizado para impresión o envío digital al paciente (Linares).
          </p>
        </div>

      </div>

    </div>
  );
};
