import { jsPDF } from 'jspdf';
import { TreatmentBudget, Patient, ProfessionalDoctor, ClinicSettings } from '../types/clinical';
import { ClinicalDatabase } from '../services/db';

export interface BudgetExportOptions {
  budget: TreatmentBudget;
  patient?: Patient;
  doctor?: ProfessionalDoctor;
  settings?: ClinicSettings;
}

const formatCLP = (val: number | string): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '$0';
  return '$' + Math.round(num).toLocaleString('es-CL');
};

const formatFecha = (dStr?: string): string => {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dStr;
};

const formatRut = (rutStr?: string): string => {
  if (!rutStr) return '—';
  const clean = rutStr.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return rutStr;
  const dv = clean.slice(-1).toUpperCase();
  const num = clean.slice(0, -1);
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
};

/**
 * Loads the image asynchronously from a given URL
 */
const loadImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

/**
 * Renders the exact budget document onto an HTMLCanvasElement
 */
export const renderBudgetToCanvas = async (
  canvas: HTMLCanvasElement,
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  customSettings?: ClinicSettings
): Promise<void> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const settings = customSettings || ClinicalDatabase.getClinicSettings();

  const w = 816;
  const h = 1056;
  canvas.width = w;
  canvas.height = h;

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // 2. Outer Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, w, h);

  // 3. Draw Clinic Logo on Right
  const logoSrc = settings.logoUrl || '/pagnina.png';
  const logoImg = await loadImage(logoSrc);
  if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
    const maxLogoW = 340;
    const maxLogoH = 90;
    let logoW = maxLogoW;
    let logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
    }
    ctx.drawImage(logoImg, w - logoW - 40, 25 + (maxLogoH - logoH) / 2, logoW, logoH);
  }

  // 4. Top-Left Header: Clinic & Doctor Info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(settings.name || 'Consulta dental Daaron', 50, 55);

  ctx.fillStyle = '#7A7568';
  ctx.font = '13px sans-serif';
  const addressLine1 = settings.address || 'Maipú 461 edificio Salman local';
  const addressLine2 = settings.city ? `${settings.city}${settings.phone ? ` • Tel: ${settings.phone}` : ''}` : '304 piso 3 Linares';
  ctx.fillText(addressLine1, 50, 77);
  ctx.fillText(addressLine2, 50, 95);

  const docName = budget.doctorName || doctor?.name || 'Dr. Alejandro David';
  const docEspecialidad = doctor?.specialty || (docName.includes('Alejandro') ? 'Implantología & Cirugía Oral' : 'Cirujano Dentista');

  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillText(docName, 50, 128);

  ctx.fillStyle = '#7A7568';
  ctx.font = '15px sans-serif';
  ctx.fillText(docEspecialidad, 50, 149);

  // 5. Green Divider Line
  ctx.strokeStyle = '#1F4B44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 185);
  ctx.lineTo(w - 50, 185);
  ctx.stroke();

  // 6. Patient Information Section
  const nombre = budget.patientName || (patient ? `${patient.firstName} ${patient.lastName}` : '—');
  const rut = formatRut(patient?.documentId || budget.patientRut);
  const telefono = patient?.phone || patient?.whatsapp || budget.patientPhone || '—';
  const fechaFmt = formatFecha(budget.createdAt);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('PACIENTE', 50, 215);
  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(nombre, 50, 237);

  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('RUT', 320, 215);
  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(rut, 320, 237);

  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TELÉFONO', 470, 215);
  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(telefono, 470, 237);

  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('FECHA', 640, 215);
  ctx.fillStyle = '#1B2A3D';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(fechaFmt, 640, 237);

  ctx.strokeStyle = '#D8D2C4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 245); ctx.lineTo(300, 245);
  ctx.moveTo(320, 245); ctx.lineTo(450, 245);
  ctx.moveTo(470, 245); ctx.lineTo(620, 245);
  ctx.moveTo(640, 245); ctx.lineTo(w - 50, 245);
  ctx.stroke();

  // 7. Document Subtitle & Budget Folio
  ctx.fillStyle = '#1F4B44';
  ctx.font = 'italic bold 19px Georgia, serif';
  ctx.fillText(`Presupuesto de Tratamiento — Folio ${budget.budgetNumber}`, 50, 285);

  // 8. Table Header
  let y = 315;
  ctx.fillStyle = '#F0F6F4';
  ctx.fillRect(50, y, w - 100, 30);

  ctx.fillStyle = '#1F4B44';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ZONA / PIEZA / TRATAMIENTO', 60, y + 20);
  ctx.textAlign = 'center';
  ctx.fillText('CANT.', 500, y + 20);
  ctx.textAlign = 'right';
  ctx.fillText('UNITARIO', 630, y + 20);
  ctx.fillText('TOTAL', w - 60, y + 20);

  y += 40;

  // 9. Table Rows
  let granTotal = 0;
  if (!budget.items || budget.items.length === 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7A7568';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText('Sin detalles de tratamientos...', 60, y + 10);
    y += 30;
  } else {
    budget.items.forEach((item) => {
      const tooth = item.toothNumber && item.toothNumber > 0 ? `[Pz. ${item.toothNumber}] ` : '';
      const itemNombre = `${tooth}${item.description || 'Tratamiento Dental'}`;
      const cant = item.quantity || 1;
      const precio = item.unitPrice ?? (item.patientCopay / cant) ?? 0;
      const subtotal = item.patientCopay ?? (cant * precio);
      granTotal += subtotal;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#1B2A3D';
      ctx.font = '14px sans-serif';
      
      // Truncate long descriptions if needed
      let displayDesc = itemNombre;
      if (ctx.measureText(displayDesc).width > 420) {
        while (ctx.measureText(displayDesc + '...').width > 420 && displayDesc.length > 5) {
          displayDesc = displayDesc.slice(0, -1);
        }
        displayDesc += '...';
      }
      ctx.fillText(displayDesc, 60, y);

      ctx.textAlign = 'center';
      ctx.fillText(cant.toString(), 500, y);

      ctx.textAlign = 'right';
      ctx.fillText(formatCLP(precio), 630, y);
      ctx.fillText(formatCLP(subtotal), w - 60, y);

      y += 12;
      ctx.strokeStyle = '#EFEBE1';
      ctx.beginPath();
      ctx.moveTo(50, y); ctx.lineTo(w - 50, y);
      ctx.stroke();
      y += 22;
    });
  }

  // 10. Total Estimado
  ctx.strokeStyle = '#1F4B44';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(400, y); ctx.lineTo(w - 50, y);
  ctx.stroke();

  y += 30;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1F4B44';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('TOTAL ESTIMADO:', w - 200, y);
  const totalToShow = budget.totalPatient || granTotal;
  ctx.fillText(formatCLP(totalToShow), w - 60, y);

  // 11. Observations / Conditions
  const obs = budget.notes;
  if (obs) {
    y += 40;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7A7568';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('OBSERVACIONES / CONDICIONES:', 50, y);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#1B2A3D';

    const words = obs.split(' ');
    let line = '';
    let obsY = y + 20;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 480 && n > 0) {
        ctx.fillText(line, 50, obsY);
        line = words[n] + ' ';
        obsY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 50, obsY);
  }

  // 12. Signature Line & Stamp
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#1B2A3D';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 270, h - 140);
  ctx.lineTo(w - 70, h - 140);
  ctx.stroke();

  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('FIRMA Y TIMBRE', w - 170, h - 120);

  // 13. Footer: Clinic opening hours
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#D8D2C4';
  ctx.beginPath();
  ctx.moveTo(50, h - 90);
  ctx.lineTo(w - 50, h - 90);
  ctx.stroke();

  ctx.fillStyle = '#7A7568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('HORARIO DE ATENCIÓN:', 50, h - 65);
  ctx.font = '13px sans-serif';
  ctx.fillText(settings.hours || 'Lunes a viernes 10:00 a 13:00 hrs. / 15:00 a 19:00 hrs. — Sábado 10:00 a 13:00 hrs.', 50, h - 45);
};

/**
 * Generates official Budget PDF Blob
 */
export const generateBudgetPdfBlob = async (
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  settings?: ClinicSettings
): Promise<{ blob: Blob; fileName: string }> => {
  const canvas = document.createElement('canvas');
  await renderBudgetToCanvas(canvas, budget, patient, doctor, settings);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);

  const safePacName = (budget.patientName || 'Paciente').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Presupuesto_${budget.budgetNumber}_${safePacName}.pdf`;
  const blob = pdf.output('blob');
  return { blob, fileName };
};

/**
 * Direct download function for any budget as PDF
 */
export const downloadBudgetPdf = async (
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  settings?: ClinicSettings
): Promise<void> => {
  const { blob, fileName } = await generateBudgetPdfBlob(budget, patient, doctor, settings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

/**
 * Direct download function for any budget as PNG Image
 */
export const downloadBudgetPng = async (
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  settings?: ClinicSettings
): Promise<void> => {
  const canvas = document.createElement('canvas');
  await renderBudgetToCanvas(canvas, budget, patient, doctor, settings);

  const link = document.createElement('a');
  const safePacName = (budget.patientName || 'Paciente').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.download = `Presupuesto_${budget.budgetNumber}_${safePacName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export interface WhatsAppShareResult {
  success: boolean;
  method: 'native_share' | 'clipboard_opened' | 'download_opened' | 'cancelled';
  message: string;
}

/**
 * Sends or prepares the budget as a PDF document for WhatsApp (no text description)
 */
export const shareBudgetViaWhatsAppPdf = async (
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  settings?: ClinicSettings
): Promise<WhatsAppShareResult> => {
  try {
    const { blob, fileName } = await generateBudgetPdfBlob(budget, patient, doctor, settings);
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

    const phone = patient?.whatsapp || patient?.phone || budget.patientPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 1. Try Native Web Share API with PDF file
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Presupuesto ${budget.budgetNumber} - ${budget.patientName}`,
        });
        return {
          success: true,
          method: 'native_share',
          message: '📄 Documento PDF del presupuesto compartido por WhatsApp exitosamente'
        };
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return {
            success: false,
            method: 'cancelled',
            message: 'Envío cancelado por el usuario'
          };
        }
        console.warn('Native share failed, using download fallback:', shareErr);
      }
    }

    // 2. Trigger direct download of the PDF file
    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 10000);

    // 3. Open WhatsApp chat window without text description
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}` 
      : `https://api.whatsapp.com/send`;
    
    window.open(waUrl, '_blank');

    return {
      success: true,
      method: 'download_opened',
      message: '📄 ¡Documento PDF del presupuesto descargado! Se abrió WhatsApp para adjuntar el archivo PDF directamente al paciente.'
    };
  } catch (err: any) {
    console.error('Error sharing budget PDF via WhatsApp:', err);
    return {
      success: false,
      method: 'cancelled',
      message: err.message || 'No se pudo enviar el PDF del presupuesto por WhatsApp'
    };
  }
};

/**
 * Sends or prepares the budget as an IMAGE for WhatsApp
 */
export const shareBudgetViaWhatsAppImage = async (
  budget: TreatmentBudget,
  patient?: Patient,
  doctor?: ProfessionalDoctor,
  settings?: ClinicSettings
): Promise<WhatsAppShareResult> => {
  return shareBudgetViaWhatsAppPdf(budget, patient, doctor, settings);
};

