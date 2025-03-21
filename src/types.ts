export interface WorkOrder {
  id: string;
  ot: string;
  client: string;
  description: string;
  tag: string;
  status: string;
  progress: number;
  priority: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
  dates: {
    [key: string]: {
      date: string;
      confirmed: boolean;
    };
  };
}

export interface Stage {
  name: string;
  progress: number;
}

export const TAG_DESCRIPTIONS: { [key: string]: string } = {
  "CA-10": "Calentador Indirecto 650.000 kcal/hr",
  "CD16-V-201": "Separador General Bifásico",
  "SB-001": "Separador Bifásico General 3000 m3/d",
  "SB-002": "Separador Bifásico General 3000 m3/d",
  "SB-102": "Separador Bifásico General 3000 m3/d",
  "SCC-801": "Colector Campo 6 300",
  "SCC-802": "Colector Campo 6 300",
  "SKID 16": "Skid de salida SDV",
  "SKID 2": "Skid de entrada SDV/PSV",
  "SKID 3": "Skid de entrada SDV/PSV",
  "SSC-004": "Colector Campo 12 300",
  "SSC-119": "Separador Bifásico Vertical 78.000 Sm3/d",
  "ST-001": "Separador General Trifásico 500.000 Sm3/d",
  "ST-002": "Separador General Trifásico 500.000 Sm3/d",
  "ST-013 AG": "Separador Trifásico Ctrol _GAS_ s/carretón",
  "ST-014 AG": "Separador Trifásico Ctrol _OIL_ s/carretón",
  "ST-101": "Separador General Trifásico 600.000 Sm3/d",
  "ST-103": "Separador Trifásico Ctrol 150 m3/d",
  "ST-111": " ",
  "ST-118": "Separador Trifásico General 1000 m³/d",
  "TRKO-900": "Separador KOD + bombas"
};

export const CLIENTS = [
  'YPF S.A.',
  'Pan American Energy S.L.',
  'Vista Energy Argentina S.A.U.',
  'Pluspetrol S.A.',
  'Shell Argentina S.A.',
  'CGC Energía S.A.U.',
  'Pecom Energía S.A.',
  'Tecpetrol S.A.',
  'Chevron Argentina S.R.L.',
  'TotalEnergies SE',
  'Aconcagua Energía S.A.'
] as const;

export const INCO_STAGES: Stage[] = [
  { name: 'Preparacion', progress: 20 },
  { name: 'Cuerpo', progress: 45 },
  { name: 'Paquet/Skid', progress: 70 },
  { name: 'E.N.D.', progress: 75 },
  { name: 'P.H.', progress: 79 },
  { name: 'Anticorr', progress: 80 },
];

export const ANTI_STAGES: Stage[] = [
  { name: 'Liberacion Pintura', progress: 85 },
  { name: 'FAT', progress: 99 },
  { name: 'Despacho', progress: 100 },
];