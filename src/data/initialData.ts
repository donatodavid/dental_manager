import { 
  Patient, 
  ProfessionalDoctor, 
  Branch, 
  Appointment, 
  TreatmentTariffItem, 
  TreatmentBudget, 
  PaymentTransaction, 
  CashRegisterSession,
  ToothState,
  ToothNumber
} from '../types/clinical';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Sucursal Providencia (Central)',
    address: 'Av. Providencia 1208, Piso 5',
    city: 'Santiago',
    phone: '+56 2 2345 6789',
    boxesCount: 6,
    color: '#0d9488' // Teal
  },
  {
    id: 'branch-2',
    name: 'Sucursal Las Condes',
    address: 'Av. Apoquindo 4400, Of. 302',
    city: 'Santiago',
    phone: '+56 2 2890 1234',
    boxesCount: 4,
    color: '#0284c7' // Sky
  },
  {
    id: 'branch-3',
    name: 'Sucursal Viña del Mar',
    address: 'Calle Valparaíso 560',
    city: 'Viña del Mar',
    phone: '+56 32 265 4321',
    boxesCount: 3,
    color: '#7c3aed' // Violet
  }
];

export const INITIAL_DOCTORS: ProfessionalDoctor[] = [
  {
    id: 'doc-1',
    name: 'Dra. Camila Morales Valenzuela',
    documentId: '15.432.876-K',
    specialty: 'Rehabilitación Oral & Estética',
    licenseNumber: 'REG-MED-84920',
    email: 'c.morales@cimacloud.dental',
    phone: '+56 9 8765 4321',
    branchIds: ['branch-1', 'branch-2'],
    commissionRatePercent: 45,
    color: '#0d9488',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-2',
    name: 'Dr. Alejandro Soto Henríquez',
    documentId: '13.876.543-2',
    specialty: 'Implantología & Cirugía Maxilofacial',
    licenseNumber: 'REG-MED-72109',
    email: 'a.soto@cimacloud.dental',
    phone: '+56 9 7654 3210',
    branchIds: ['branch-1', 'branch-3'],
    commissionRatePercent: 50,
    color: '#0284c7',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-3',
    name: 'Dra. Valentina Rojas Méndez',
    documentId: '16.901.234-5',
    specialty: 'Ortodoncia & Ortopedia Dentomaxilar',
    licenseNumber: 'REG-MED-91044',
    email: 'v.rojas@cimacloud.dental',
    phone: '+56 9 6543 2109',
    branchIds: ['branch-1', 'branch-2', 'branch-3'],
    commissionRatePercent: 40,
    color: '#8b5cf6',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813681-ef05a8286a14?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-4',
    name: 'Dr. Matías Espinoza Castro',
    documentId: '17.345.678-9',
    specialty: 'Endodoncia Microscópica',
    licenseNumber: 'REG-MED-63821',
    email: 'm.espinoza@cimacloud.dental',
    phone: '+56 9 5432 1098',
    branchIds: ['branch-1'],
    commissionRatePercent: 45,
    color: '#f59e0b',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_TARIFFS: TreatmentTariffItem[] = [
  // Prevención
  { id: 'tf-1', category: 'PREVENCION', code: 'PRV-01', name: 'Destartraje Supragingival & Profilaxis Completa', description: 'Limpieza con ultrasonido y pulido coronario con pasta de flúor', defaultPrice: 48000, requiresTooth: false, requiresSurface: false, estimatedMinutes: 45 },
  { id: 'tf-2', category: 'PREVENCION', code: 'PRV-02', name: 'Sellante de Fosas y Fisuras Fotocurable', description: 'Aplicación preventiva de resina fluida en molares sanos', defaultPrice: 22000, requiresTooth: true, requiresSurface: true, estimatedMinutes: 20 },
  { id: 'tf-3', category: 'PREVENCION', code: 'PRV-03', name: 'Fluoración Tópica en Barniz', description: 'Aplicación de barniz de flúor 5% para remineralización', defaultPrice: 25000, requiresTooth: false, requiresSurface: false, estimatedMinutes: 20 },

  // Operatoria / Restauración
  { id: 'tf-4', category: 'OPERATORIA', code: 'OPR-01', name: 'Restauración Estética Composite Simple (1 cara)', description: 'Obturación directa con resina nanohíbrida fotocurable', defaultPrice: 42000, requiresTooth: true, requiresSurface: true, estimatedMinutes: 40 },
  { id: 'tf-5', category: 'OPERATORIA', code: 'OPR-02', name: 'Restauración Estética Composite Compuesta (2 caras)', description: 'Obturación proximal con matriz seccional', defaultPrice: 55000, requiresTooth: true, requiresSurface: true, estimatedMinutes: 50 },
  { id: 'tf-6', category: 'OPERATORIA', code: 'OPR-03', name: 'Restauración Composite Compleja (3+ caras)', description: 'Reconstrucción coronal multi-superficie', defaultPrice: 68000, requiresTooth: true, requiresSurface: true, estimatedMinutes: 60 },
  { id: 'tf-7', category: 'OPERATORIA', code: 'OPR-04', name: 'Carilla Directa de Resina de Alta Estética', description: 'Diseño estratificado vestibular en sector anterior', defaultPrice: 120000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 75 },

  // Endodoncia
  { id: 'tf-8', category: 'ENDODONCIA', code: 'END-01', name: 'Tratamiento de Conducto Unirradicular', description: 'Instrumentación rotatoria y obturación tridimensional en incisivo/canino', defaultPrice: 110000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },
  { id: 'tf-9', category: 'ENDODONCIA', code: 'END-02', name: 'Tratamiento de Conducto Birradicular', description: 'Instrumentación en premolares', defaultPrice: 145000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 75 },
  { id: 'tf-10', category: 'ENDODONCIA', code: 'END-03', name: 'Tratamiento de Conducto Multirradicular', description: 'Endodoncia mecanizada en molares', defaultPrice: 195000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 90 },

  // Rehabilitación
  { id: 'tf-11', category: 'REHABILITACION', code: 'RHB-01', name: 'Corona de Zirconio Monolítico Cad-Cam', description: 'Prótesis fija libre de metal de alta resistencia', defaultPrice: 280000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },
  { id: 'tf-12', category: 'REHABILITACION', code: 'RHB-02', name: 'Corona Cerámica Disilicato de Litio (E-Max)', description: 'Corona estética de máxima translucidez anterior', defaultPrice: 310000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },
  { id: 'tf-13', category: 'REHABILITACION', code: 'RHB-03', name: 'Incrustación Estética Onlay/Inlay Zirconio', description: 'Restauración indirecta para cavidades amplias', defaultPrice: 190000, requiresTooth: true, requiresSurface: true, estimatedMinutes: 50 },

  // Cirugía e Implantes
  { id: 'tf-14', category: 'CIRUGIA', code: 'CIR-01', name: 'Exodoncia Simple', description: 'Extracción dentaria sin ostectomía', defaultPrice: 45000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 30 },
  { id: 'tf-15', category: 'CIRUGIA', code: 'CIR-02', name: 'Cirugía de Tercer Molar Incluido / Semincluido', description: 'Exodoncia quirúrgica compleja con odontosección', defaultPrice: 135000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },
  { id: 'tf-16', category: 'IMPLANTOLOGIA', code: 'IMP-01', name: 'Fase Quirúrgica Implante Titanio Grado V', description: 'Colocación de fijación oseointegrada Straumann/MIS', defaultPrice: 490000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },
  { id: 'tf-17', category: 'IMPLANTOLOGIA', code: 'IMP-02', name: 'Corona sobre Implante Atornillada Zirconio', description: 'Fase rehabilitadora protésica sobre pilar de titanio', defaultPrice: 340000, requiresTooth: true, requiresSurface: false, estimatedMinutes: 60 },

  // Ortodoncia
  { id: 'tf-18', category: 'ORTODONCIA', code: 'ORT-01', name: 'Instalación Brackets Autoligados Interactivos', description: 'Cementado bimaxilar técnica Damon/In-Ovation', defaultPrice: 450000, requiresTooth: false, requiresSurface: false, estimatedMinutes: 90 },
  { id: 'tf-19', category: 'ORTODONCIA', code: 'ORT-02', name: 'Control Mensual de Ortodoncia', description: 'Cambio de arcos térmicos, elásticos y biomecánica', defaultPrice: 38000, requiresTooth: false, requiresSurface: false, estimatedMinutes: 30 },
  
  // Estética
  { id: 'tf-20', category: 'ESTETICA', code: 'EST-01', name: 'Blanqueamiento Dental Led en Clínica (2 Sesiones)', description: 'Peróxido de hidrógeno al 35% fotoactivado', defaultPrice: 160000, requiresTooth: false, requiresSurface: false, estimatedMinutes: 60 }
];

export function createDefaultToothState(toothNum: ToothNumber): ToothState {
  return {
    toothNumber: toothNum,
    wholeCondition: 'normal',
    surfaces: {
      occlusal: 'healthy',
      vestibular: 'healthy',
      lingual: 'healthy',
      mesial: 'healthy',
      distal: 'healthy'
    }
  };
}

export function createBlankAdultTeeth(): Record<ToothNumber, ToothState> {
  const adultTeethNumbers: ToothNumber[] = [
    // Cuadrante 1 (Superior Derecho)
    18, 17, 16, 15, 14, 13, 12, 11,
    // Cuadrante 2 (Superior Izquierdo)
    21, 22, 23, 24, 25, 26, 27, 28,
    // Cuadrante 4 (Inferior Derecho)
    48, 47, 46, 45, 44, 43, 42, 41,
    // Cuadrante 3 (Inferior Izquierdo)
    31, 32, 33, 34, 35, 36, 37, 38
  ];

  const teeth: Record<ToothNumber, ToothState> = {};
  adultTeethNumbers.forEach(num => {
    teeth[num] = createDefaultToothState(num);
  });
  return teeth;
}

export function createBlankPediatricTeeth(): Record<ToothNumber, ToothState> {
  const pediatricTeethNumbers: ToothNumber[] = [
    // Superior
    55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
    // Inferior
    85, 84, 83, 82, 81, 71, 72, 73, 74, 75
  ];

  const teeth: Record<ToothNumber, ToothState> = {};
  pediatricTeethNumbers.forEach(num => {
    teeth[num] = createDefaultToothState(num);
  });
  return teeth;
}

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    documentId: '18.942.311-4',
    firstName: 'Constanza Paz',
    lastName: 'Herrera Valdés',
    birthDate: '1995-04-12',
    gender: 'F',
    phone: '+56 9 9123 4567',
    whatsapp: '+56 9 9123 4567',
    email: 'c.herrera.valdes@gmail.com',
    address: 'Av. Tobalaba 1450, Depto 604',
    city: 'Providencia, Santiago',
    insuranceProvider: 'Colmena Golden Cross',
    insuranceNumber: 'COL-994821',
    emergencyContact: {
      name: 'Ignacio Herrera (Hermano)',
      phone: '+56 9 8456 1234',
      relationship: 'Hermano'
    },
    allergies: [
      {
        id: 'alg-1',
        allergen: 'Penicilina / Amoxicilina',
        severity: 'severe',
        reaction: 'Edema facial y urticaria generalizada (Precaución antibiótica)',
        isDrugAllergy: true
      },
      {
        id: 'alg-2',
        allergen: 'Látex',
        severity: 'moderate',
        reaction: 'Dermatitis de contacto labial',
        isDrugAllergy: false
      }
    ],
    medicalBackground: {
      hypertension: false,
      diabetes: false,
      heartDisease: false,
      coagulationDisorder: false,
      pregnancy: false,
      infectiousDiseases: [],
      currentMedications: ['Anticonceptivos orales'],
      smoker: false,
      bruxism: true,
      otherConditions: 'Bruxismo céntrico nocturno con desgaste en bordes incisales anteroinferiores.',
      surgicalHistory: 'Apendicectomía laparoscópica en 2018.',
      lastMedicalCheckup: '2026-02-15'
    },
    odontogram: {
      id: 'odo-1',
      patientId: 'pat-1',
      type: 'ADULT',
      updatedAt: '2026-08-20',
      updatedByDoctorId: 'doc-1',
      teeth: {
        ...createBlankAdultTeeth(),
        16: {
          toothNumber: 16,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'caries', vestibular: 'healthy', lingual: 'healthy', mesial: 'caries', distal: 'healthy' },
          notes: 'Caries Oclusomesial profunda sin compromiso pulpar evidente'
        },
        21: {
          toothNumber: 21,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'fracture', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Fractura no complicada esmalte/dentina borde incisal'
        },
        26: {
          toothNumber: 26,
          wholeCondition: 'crown',
          surfaces: { occlusal: 'healthy', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Corona de zirconio en buen estado colocada en 2024'
        },
        36: {
          toothNumber: 36,
          wholeCondition: 'endodontics',
          surfaces: { occlusal: 'composite', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'composite' },
          notes: 'Endodoncia previa asintomática, requiere incrustación'
        },
        48: {
          toothNumber: 48,
          wholeCondition: 'extraction_indicated',
          surfaces: { occlusal: 'caries', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Molar semierupcionado con pericoronaritis recurrente'
        },
        46: {
          toothNumber: 46,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'sealant', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        }
      },
      generalNotes: 'Higiene bucal adecuada (Índice de O’Leary 18%). Paciente refiere dolor leve a cambios térmicos en sector posterosuperior derecho (pieza 1.6).'
    },
    evolutions: [
      {
        id: 'evo-1',
        patientId: 'pat-1',
        date: '2026-08-20',
        time: '11:30',
        doctorId: 'doc-1',
        doctorName: 'Dra. Camila Morales',
        specialty: 'Rehabilitación Oral',
        branchId: 'branch-1',
        subjective: 'Paciente acude por sensibilidad al frío y dulce en molar superior derecho desde hace 2 semanas.',
        objective: 'Inspección: Pieza 1.6 presenta cavitación oclusomesial con esmalte desmineralizado y dentina reblandecida. Pruebas de vitalidad pulpar frías (+) reversibles a los 3 segundos. No duele a la percusión vertical ni horizontal. Sondaje periodontal ≤ 2mm.',
        assessment: 'Pulpitis reversible secundaria a caries dentinaria profunda pieza 1.6. Bruxismo del sueño grado II.',
        plan: 'Se explica plan: Aislamiento absoluto, remoción de caries bajo magnificación, protección pulpar indirecta con silicato de calcio y restauración con resina estratificada compuesta.',
        signed: true,
        signatureStamp: 'Firma Digital Validada - Dra. Camila Morales (Reg. 84920) - 2026-08-20 12:15:32 CLT',
        teethInvolved: [16]
      },
      {
        id: 'evo-2',
        patientId: 'pat-1',
        date: '2026-07-05',
        time: '15:00',
        doctorId: 'doc-1',
        doctorName: 'Dra. Camila Morales',
        specialty: 'Rehabilitación Oral',
        branchId: 'branch-1',
        subjective: 'Control de rutina y profilaxis anual.',
        objective: 'Presencia de cálculo leve en lingual de incisivos inferiores.',
        assessment: 'Gingivitis marginal inducida por biofilm.',
        plan: 'Destartraje supragingival completo + profilaxis con ultrasonido + técnica de cepillado de Bass modificada.',
        signed: true,
        signatureStamp: 'Firma Digital Validada - Dra. Camila Morales (Reg. 84920) - 2026-07-05 15:45:00 CLT'
      }
    ],
    documents: [
      {
        id: 'doc-img-1',
        patientId: 'pat-1',
        title: 'Radiografía Panorámica Digital (Ortopantomografía)',
        category: 'panoramic',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
        uploadDate: '2026-08-20',
        doctorName: 'Dr. Alejandro Soto',
        size: '3.4 MB',
        notes: 'Visualización de terceros molares 1.8, 2.8, 3.8 y 4.8 con inclinación mesioangular.'
      },
      {
        id: 'doc-img-2',
        patientId: 'pat-1',
        title: 'Radiografía Bitewing (Aleta de Mordida) Derecha',
        category: 'xray',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
        uploadDate: '2026-08-20',
        doctorName: 'Dra. Camila Morales',
        size: '1.8 MB',
        notes: 'Confirmación radiolúcida coronaria en 1.6 que respeta límite pulpar.'
      },
      {
        id: 'doc-img-3',
        patientId: 'pat-1',
        title: 'Consentimiento Informado Tratamiento Operatoria y Restauración',
        category: 'consent',
        url: '#',
        uploadDate: '2026-08-20',
        doctorName: 'Dra. Camila Morales',
        size: '420 KB',
        signedConsent: true,
        notes: 'Firmado digitalmente con clave biométrica y RUT del paciente.'
      }
    ],
    status: 'ACTIVE',
    registeredAt: '2024-03-10',
    lastVisit: '2026-08-20',
    tags: ['Alergia a Penicilina', 'Bruxismo', 'Ortodoncia previa']
  },
  {
    id: 'pat-2',
    documentId: '14.209.834-1',
    firstName: 'Rodrigo Andrés',
    lastName: 'Lagos Cárdenas',
    birthDate: '1981-11-28',
    gender: 'M',
    phone: '+56 9 7890 1234',
    whatsapp: '+56 9 7890 1234',
    email: 'rodrigo.lagos.c@gmail.com',
    address: 'Av. Las Condes 10300, Torre B',
    city: 'Las Condes, Santiago',
    insuranceProvider: 'Banmédica',
    insuranceNumber: 'BAN-449102',
    emergencyContact: {
      name: 'Marcela Fuentes (Esposa)',
      phone: '+56 9 6543 9876',
      relationship: 'Cónyuge'
    },
    allergies: [],
    medicalBackground: {
      hypertension: true,
      diabetes: false,
      heartDisease: false,
      coagulationDisorder: false,
      pregnancy: false,
      infectiousDiseases: [],
      currentMedications: ['Losartán 50mg cada 12 hrs'],
      smoker: true,
      smokerCigarettesPerDay: 5,
      bruxism: false,
      otherConditions: 'Hipertensión arterial controlada por médico cardiólogo (PA habitual: 125/80 mmHg).',
      surgicalHistory: 'Sin antecedentes relevantes.',
      lastMedicalCheckup: '2026-01-10'
    },
    odontogram: {
      id: 'odo-2',
      patientId: 'pat-2',
      type: 'ADULT',
      updatedAt: '2026-08-22',
      updatedByDoctorId: 'doc-2',
      teeth: {
        ...createBlankAdultTeeth(),
        14: {
          toothNumber: 14,
          wholeCondition: 'missing',
          surfaces: { occlusal: 'healthy', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Pieza ausente por extracción antigua en 2020. Paciente candidato a Implante Dental'
        },
        24: {
          toothNumber: 24,
          wholeCondition: 'implant',
          surfaces: { occlusal: 'healthy', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Implante Straumann osteointegrado con corona atornillada'
        },
        37: {
          toothNumber: 37,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'composite', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        },
        47: {
          toothNumber: 47,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'caries', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        }
      },
      generalNotes: 'Evaluación quirúrgica para instalación de implante unitario en brecha edéntula de pieza 1.4.'
    },
    evolutions: [
      {
        id: 'evo-3',
        patientId: 'pat-2',
        date: '2026-08-22',
        time: '09:00',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alejandro Soto',
        specialty: 'Implantología',
        branchId: 'branch-2',
        subjective: 'Paciente desea reponer pieza premolar superior derecha para mejorar función masticatoria.',
        objective: 'Brecha 1.4 con reborde óseo clase I de Seibert. Mucosa queratinizada > 4mm. PA preoperatoria: 124/82 mmHg. Se revisa TAC Cone Beam: altura ósea 13.5mm, ancho 6.8mm, sin compromiso del piso del seno maxilar.',
        assessment: 'Edentulismo parcial maxilar clase III de Kennedy modificación 1.',
        plan: 'Planificación de cirugía de implante de titanio de conexión cónica 3.75 x 11.5 mm + regeneración ósea guiada particulada si se requiere.',
        signed: true,
        signatureStamp: 'Firma Digital Validada - Dr. Alejandro Soto (Reg. 72109) - 2026-08-22 09:50:11 CLT',
        teethInvolved: [14]
      }
    ],
    documents: [
      {
        id: 'doc-img-4',
        patientId: 'pat-2',
        title: 'Tomografía Computarizada Cone Beam (CBCT) Maxilar',
        category: 'tomography',
        url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
        uploadDate: '2026-08-21',
        doctorName: 'Dr. Alejandro Soto',
        size: '18.2 MB',
        notes: 'Cortes coronales y sagitales zona 1.4. Adecuada densidad ósea tipo II.'
      }
    ],
    status: 'ACTIVE',
    registeredAt: '2025-01-15',
    lastVisit: '2026-08-22',
    tags: ['Hipertenso Controlado', 'Plan Implante', 'Fumador leve']
  },
  {
    id: 'pat-3',
    documentId: '22.840.199-K',
    firstName: 'Matías Ignacio',
    lastName: 'Silva Oyarzún',
    birthDate: '2016-09-14',
    gender: 'M',
    phone: '+56 9 8234 5678',
    whatsapp: '+56 9 8234 5678',
    email: 'madre.silva.carolina@gmail.com',
    address: 'Calle Álvarez 1220',
    city: 'Viña del Mar',
    insuranceProvider: 'Cruz Blanca',
    insuranceNumber: 'CRZ-881203',
    emergencyContact: {
      name: 'Carolina Oyarzún (Madre)',
      phone: '+56 9 8234 5678',
      relationship: 'Madre'
    },
    allergies: [],
    medicalBackground: {
      hypertension: false,
      diabetes: false,
      heartDisease: false,
      coagulationDisorder: false,
      pregnancy: false,
      infectiousDiseases: [],
      currentMedications: [],
      smoker: false,
      bruxism: false,
      otherConditions: 'Paciente pediátrico en dentición mixta temprana.',
      surgicalHistory: 'Sin antecedentes.',
      lastMedicalCheckup: '2026-03-01'
    },
    odontogram: {
      id: 'odo-3',
      patientId: 'pat-3',
      type: 'PEDIATRIC',
      updatedAt: '2026-08-25',
      updatedByDoctorId: 'doc-3',
      teeth: {
        ...createBlankPediatricTeeth(),
        55: {
          toothNumber: 55,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'sealant', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        },
        65: {
          toothNumber: 65,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'caries', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' },
          notes: 'Caries de fisura en segundo molar temporal superior izquierdo'
        },
        75: {
          toothNumber: 75,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'sealant', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        },
        85: {
          toothNumber: 85,
          wholeCondition: 'normal',
          surfaces: { occlusal: 'sealant', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        }
      },
      generalNotes: 'Buena colaboración pediátrica. Erupción en curso de primeros molares permanentes (1.6, 2.6, 3.6, 4.6).'
    },
    evolutions: [
      {
        id: 'evo-4',
        patientId: 'pat-3',
        date: '2026-08-25',
        time: '16:00',
        doctorId: 'doc-3',
        doctorName: 'Dra. Valentina Rojas',
        specialty: 'Ortodoncia & Odontopediatría',
        branchId: 'branch-3',
        subjective: 'Consulta de control pediátrico y evaluación de desarrollo maxilar.',
        objective: 'Dentición mixta primera fase. Relación molar Clase I bilateral. Mordida profunda 50%.',
        assessment: 'Riesgo cariogénico moderado. Mordida profunda leve en desarrollo.',
        plan: 'Sellantes en piezas 5.5, 7.5, 8.5 realizados hoy. Pendiente obturación estética pieza 6.5 y aplicación de barniz de flúor.',
        signed: true,
        signatureStamp: 'Firma Digital Validada - Dra. Valentina Rojas (Reg. 91044) - 2026-08-25 16:40:00 CLT'
      }
    ],
    documents: [],
    status: 'ACTIVE',
    registeredAt: '2025-06-20',
    lastVisit: '2026-08-25',
    tags: ['Pediátrico', 'Dentición Mixta', 'Sellantes']
  },
  {
    id: 'pat-4',
    documentId: '11.654.321-8',
    firstName: 'Guillermo Enrique',
    lastName: 'Morales Alarcón',
    birthDate: '1972-03-08',
    gender: 'M',
    phone: '+56 9 6789 0123',
    whatsapp: '+56 9 6789 0123',
    email: 'g.morales.alarcon@empresa.cl',
    address: 'Av. El Golf 99, Piso 14',
    city: 'Las Condes, Santiago',
    insuranceProvider: 'Particular / Reembolso Metlife',
    emergencyContact: {
      name: 'Sofía Morales (Hija)',
      phone: '+56 9 5555 4321',
      relationship: 'Hija'
    },
    allergies: [
      {
        id: 'alg-3',
        allergen: 'Antiinflamatorios No Esteroideos (AINEs / Ketorolaco / Ibuprofeno)',
        severity: 'severe',
        reaction: 'Broncoespasmo y gastritis severa. Usar solo Paracetamol o Tramadol',
        isDrugAllergy: true
      }
    ],
    medicalBackground: {
      hypertension: false,
      diabetes: true,
      diabetesType: 'Tipo 2 compensada con Metformina (HbA1c 6.4%)',
      heartDisease: false,
      coagulationDisorder: false,
      pregnancy: false,
      infectiousDiseases: [],
      currentMedications: ['Metformina 850mg c/12 hrs', 'Atorvastatina 20mg'],
      smoker: false,
      bruxism: true,
      otherConditions: 'Diabetes Mellitus tipo 2 con excelente control metabólico.',
      surgicalHistory: 'Colecistectomía en 2012.',
      lastMedicalCheckup: '2026-04-10'
    },
    odontogram: {
      id: 'odo-4',
      patientId: 'pat-4',
      type: 'ADULT',
      updatedAt: '2026-08-26',
      updatedByDoctorId: 'doc-4',
      teeth: {
        ...createBlankAdultTeeth(),
        11: {
          toothNumber: 11,
          wholeCondition: 'crown',
          surfaces: { occlusal: 'healthy', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        },
        12: {
          toothNumber: 12,
          wholeCondition: 'endodontics',
          surfaces: { occlusal: 'composite', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        },
        46: {
          toothNumber: 46,
          wholeCondition: 'endodontics',
          surfaces: { occlusal: 'composite', vestibular: 'healthy', lingual: 'healthy', mesial: 'healthy', distal: 'healthy' }
        }
      },
      generalNotes: 'Evaluación periodontal y endodóntica.'
    },
    evolutions: [
      {
        id: 'evo-5',
        patientId: 'pat-4',
        date: '2026-08-26',
        time: '14:30',
        doctorId: 'doc-4',
        doctorName: 'Dr. Matías Espinoza',
        specialty: 'Endodoncia',
        branchId: 'branch-1',
        subjective: 'Control de endodoncia de pieza 1.2 realizada hace 1 mes.',
        objective: 'Asintomático, mucosa peri-apical sana, sin fístula ni dolor a la palpación.',
        assessment: 'Evolución favorable post-tratamiento de conductos.',
        plan: 'Alta endodóntica de pieza 1.2. Se deriva a Dra. Morales para restauración definitiva con perno de fibra de vidrio y corona.',
        signed: true,
        signatureStamp: 'Firma Digital Validada - Dr. Matías Espinoza (Reg. 63821) - 2026-08-26 15:05:00 CLT',
        teethInvolved: [12]
      }
    ],
    documents: [],
    status: 'ACTIVE',
    registeredAt: '2024-11-05',
    lastVisit: '2026-08-26',
    tags: ['Alergia a AINEs', 'Diabético Controlado', 'Endodoncia']
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'Constanza Paz Herrera Valdés',
    patientPhone: '+56 9 9123 4567',
    doctorId: 'doc-1',
    doctorName: 'Dra. Camila Morales Valenzuela',
    doctorSpecialty: 'Rehabilitación Oral & Estética',
    branchId: 'branch-1',
    branchName: 'Sucursal Providencia (Central)',
    boxNumber: 'Box 02',
    date: '2026-08-28',
    startTime: '09:30',
    endTime: '10:30',
    durationMinutes: 60,
    reason: 'Restauración Estética Composite Pieza 1.6 (Caries Oclusomesial)',
    treatmentName: 'Restauración Composite Compuesta',
    status: 'IN_TREATMENT',
    notes: 'Alergia a Penicilina y Látex. Usar guantes de nitrilo sin talco.',
    reminderSent: {
      whatsapp: true,
      sms: true,
      email: true,
      lastSentAt: '2026-08-27 18:00'
    }
  },
  {
    id: 'apt-2',
    patientId: 'pat-2',
    patientName: 'Rodrigo Andrés Lagos Cárdenas',
    patientPhone: '+56 9 7890 1234',
    doctorId: 'doc-2',
    doctorName: 'Dr. Alejandro Soto Henríquez',
    doctorSpecialty: 'Implantología & Cirugía Maxilofacial',
    branchId: 'branch-1',
    branchName: 'Sucursal Providencia (Central)',
    boxNumber: 'Pabellón Quirúrgico 01',
    date: '2026-08-28',
    startTime: '11:00',
    endTime: '12:30',
    durationMinutes: 90,
    reason: 'Instalación de Implante de Titanio Grado V en zona 1.4',
    treatmentName: 'Fase Quirúrgica Implante',
    status: 'WAITING_ROOM',
    notes: 'Hipertenso controlado con Losartán. Tomar presión arterial al ingresar.',
    reminderSent: {
      whatsapp: true,
      sms: false,
      email: true,
      lastSentAt: '2026-08-27 18:05'
    }
  },
  {
    id: 'apt-3',
    patientId: 'pat-3',
    patientName: 'Matías Ignacio Silva Oyarzún',
    patientPhone: '+56 9 8234 5678',
    doctorId: 'doc-3',
    doctorName: 'Dra. Valentina Rojas Méndez',
    doctorSpecialty: 'Ortodoncia & Ortopedia Dentomaxilar',
    branchId: 'branch-1',
    branchName: 'Sucursal Providencia (Central)',
    boxNumber: 'Box 04',
    date: '2026-08-28',
    startTime: '14:00',
    endTime: '14:45',
    durationMinutes: 45,
    reason: 'Obturación estética molar temporal 6.5 + Flúor barniz',
    treatmentName: 'Restauración Pediátrica',
    status: 'CONFIRMED',
    notes: 'Acompañado por su madre Carolina Oyarzún.',
    reminderSent: {
      whatsapp: true,
      sms: true,
      email: false,
      lastSentAt: '2026-08-27 18:10'
    }
  },
  {
    id: 'apt-4',
    patientId: 'pat-4',
    patientName: 'Guillermo Enrique Morales Alarcón',
    patientPhone: '+56 9 6789 0123',
    doctorId: 'doc-1',
    doctorName: 'Dra. Camila Morales Valenzuela',
    doctorSpecialty: 'Rehabilitación Oral & Estética',
    branchId: 'branch-1',
    branchName: 'Sucursal Providencia (Central)',
    boxNumber: 'Box 02',
    date: '2026-08-28',
    startTime: '15:30',
    endTime: '16:30',
    durationMinutes: 60,
    reason: 'Preparación y toma de impresión digital para Corona Zirconio 1.2',
    treatmentName: 'Corona Cerámica Cad-Cam',
    status: 'SCHEDULED',
    notes: 'Alergia severa a AINEs (Ketorolaco/Ibuprofeno). Paciente diabético tipo 2.',
    reminderSent: {
      whatsapp: false,
      sms: false,
      email: true,
      lastSentAt: '2026-08-27 10:00'
    }
  },
  {
    id: 'apt-5',
    patientId: 'pat-1',
    patientName: 'Constanza Paz Herrera Valdés',
    patientPhone: '+56 9 9123 4567',
    doctorId: 'doc-2',
    doctorName: 'Dr. Alejandro Soto Henríquez',
    doctorSpecialty: 'Implantología & Cirugía Maxilofacial',
    branchId: 'branch-1',
    branchName: 'Sucursal Providencia (Central)',
    boxNumber: 'Pabellón Quirúrgico 01',
    date: '2026-09-04',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    reason: 'Exodoncia quirúrgica de tercer molar inferior 4.8 con osteotomía',
    treatmentName: 'Cirugía Tercer Molar',
    status: 'SCHEDULED',
    reminderSent: {
      whatsapp: false,
      sms: false,
      email: false
    }
  }
];

export const INITIAL_BUDGETS: TreatmentBudget[] = [
  {
    id: 'bud-1',
    budgetNumber: 'PRE-2026-0089',
    patientId: 'pat-1',
    patientName: 'Constanza Paz Herrera Valdés',
    doctorId: 'doc-1',
    doctorName: 'Dra. Camila Morales Valenzuela',
    branchId: 'branch-1',
    createdAt: '2026-08-20',
    validUntil: '2026-09-20',
    status: 'ACCEPTED',
    items: [
      {
        id: 'bi-1',
        tariffItemId: 'tf-5',
        code: 'OPR-02',
        description: 'Restauración Estética Composite Compuesta (2 caras - OM)',
        toothNumber: 16,
        surface: 'Oclusal, Mesial',
        quantity: 1,
        unitPrice: 55000,
        discountPercent: 10,
        insuranceCoverageAmount: 20000,
        patientCopay: 29500,
        total: 49500,
        status: 'IN_PROGRESS'
      },
      {
        id: 'bi-2',
        tariffItemId: 'tf-7',
        code: 'OPR-04',
        description: 'Reconstrucción Estética Borde Incisal Resina',
        toothNumber: 21,
        surface: 'Incisal',
        quantity: 1,
        unitPrice: 65000,
        discountPercent: 10,
        insuranceCoverageAmount: 25000,
        patientCopay: 33500,
        total: 58500,
        status: 'PENDING'
      },
      {
        id: 'bi-3',
        tariffItemId: 'tf-15',
        code: 'CIR-02',
        description: 'Cirugía de Tercer Molar Incluido / Semincluido',
        toothNumber: 48,
        quantity: 1,
        unitPrice: 135000,
        discountPercent: 15,
        insuranceCoverageAmount: 50000,
        patientCopay: 64750,
        total: 114750,
        status: 'PENDING'
      }
    ],
    subtotal: 255000,
    discountTotal: 32250,
    insuranceTotal: 95000,
    totalPatient: 127750,
    totalPaid: 50000,
    balanceDue: 77750,
    notes: 'Presupuesto con descuento convenio Colmena Golden Cross 10-15%. Se permite pago en 3 cuotas sin interés.'
  },
  {
    id: 'bud-2',
    budgetNumber: 'PRE-2026-0092',
    patientId: 'pat-2',
    patientName: 'Rodrigo Andrés Lagos Cárdenas',
    doctorId: 'doc-2',
    doctorName: 'Dr. Alejandro Soto Henríquez',
    branchId: 'branch-2',
    createdAt: '2026-08-22',
    validUntil: '2026-09-22',
    status: 'ACCEPTED',
    items: [
      {
        id: 'bi-4',
        tariffItemId: 'tf-16',
        code: 'IMP-01',
        description: 'Fase Quirúrgica Implante Titanio Grado V',
        toothNumber: 14,
        quantity: 1,
        unitPrice: 490000,
        discountPercent: 0,
        insuranceCoverageAmount: 120000,
        patientCopay: 370000,
        total: 490000,
        status: 'IN_PROGRESS'
      },
      {
        id: 'bi-5',
        tariffItemId: 'tf-17',
        code: 'IMP-02',
        description: 'Corona sobre Implante Atornillada Zirconio Cad-Cam',
        toothNumber: 14,
        quantity: 1,
        unitPrice: 340000,
        discountPercent: 0,
        insuranceCoverageAmount: 80000,
        patientCopay: 260000,
        total: 340000,
        status: 'PENDING'
      }
    ],
    subtotal: 830000,
    discountTotal: 0,
    insuranceTotal: 200000,
    totalPatient: 630000,
    totalPaid: 370000,
    balanceDue: 260000,
    notes: 'Incluye tomografía pre y post quirúrgica y controles de osteointegración a los 3 y 6 meses.'
  }
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'pay-1',
    receiptNumber: 'BOL-2026-0412',
    patientId: 'pat-1',
    patientName: 'Constanza Paz Herrera Valdés',
    budgetId: 'bud-1',
    branchId: 'branch-1',
    doctorId: 'doc-1',
    doctorName: 'Dra. Camila Morales',
    amount: 50000,
    paymentMethod: 'DEBIT_CARD',
    date: '2026-08-28',
    time: '09:20',
    concept: 'Abono inicio tratamiento Operatoria Dental (Presupuesto PRE-2026-0089)',
    receiptType: 'BOLETA',
    authorizationCode: 'TBK-984210',
    cashRegisterId: 'cr-session-today',
    receivedBy: 'Recepcionista Turno Mañana'
  },
  {
    id: 'pay-2',
    receiptNumber: 'BOL-2026-0413',
    patientId: 'pat-2',
    patientName: 'Rodrigo Andrés Lagos Cárdenas',
    budgetId: 'bud-2',
    branchId: 'branch-1',
    doctorId: 'doc-2',
    doctorName: 'Dr. Alejandro Soto',
    amount: 370000,
    paymentMethod: 'CREDIT_CARD',
    date: '2026-08-28',
    time: '10:45',
    concept: 'Pago completo Fase Quirúrgica Implante 1.4 (Presupuesto PRE-2026-0092)',
    receiptType: 'BOLETA',
    authorizationCode: 'TBK-771923',
    cashRegisterId: 'cr-session-today',
    receivedBy: 'Recepcionista Turno Mañana'
  },
  {
    id: 'pay-3',
    receiptNumber: 'BOL-2026-0410',
    patientId: 'pat-3',
    patientName: 'Matías Ignacio Silva Oyarzún',
    branchId: 'branch-1',
    doctorId: 'doc-3',
    doctorName: 'Dra. Valentina Rojas',
    amount: 45000,
    paymentMethod: 'CASH',
    date: '2026-08-28',
    time: '08:45',
    concept: 'Consulta y Evaluación Odontopediátrica + Plan Preventivo',
    receiptType: 'BOLETA',
    cashRegisterId: 'cr-session-today',
    receivedBy: 'Recepcionista Turno Mañana'
  }
];

export const INITIAL_CASH_SESSION: CashRegisterSession = {
  id: 'cr-session-today',
  branchId: 'branch-1',
  branchName: 'Sucursal Providencia (Central)',
  openedAt: '2026-08-28 08:00',
  openedBy: 'Recepcionista Turno Mañana',
  openingCash: 120000,
  totalCashIncome: 45000,
  totalCardIncome: 420000,
  totalTransferIncome: 0,
  totalInsuranceIncome: 0,
  totalExpenses: 15000,
  expectedCashTotal: 150000, // 120000 + 45000 - 15000
  status: 'OPEN',
  notes: 'Caja diaria abierta con sencillo de $120.000 en billetes y monedas. Egreso de $15.000 por compra de insumos de cafetería.'
};
