export const MAINSECTIONS = ['administrativo', 'medio ambiente', 'costas', 'aguas']

export const SUBSECTIONS = {
  'administrativo': [
    {name: 'Constitución Española', index: 1},
    {name: 'Ley 39/2015', index: 2},
    {name: 'Ley 40/2015', index: 3},
    {name: 'LCSP', index: 4},
    {name: 'EBEP', index: 5},
    {name: 'Igualdad, Violencia de Género y Dependencia', index: 6},
    {name: 'Unión Europea', index: 7},
    {name: 'Otros', index: 8},
  ],
  'medio ambiente': [
    {name: 'PNyB, Parques Nacionales y Montes', index: 1},
    {name: 'Convenio Aarhus', index: 2},
    {name: 'Medio Marino', index: 3},
    {name: 'Evaluación Ambiental', index: 4},
    {name: 'Residuos y Economía Circular', index: 5},
    {name: 'Cambio Climático', index: 6},
    {name: 'Responsabilidad MA', index: 7},
    {name: 'Otros', index: 8},
  ],
  'costas': [
    {name: 'LC Título I', index: 1},
    {name: 'LC Título II', index: 2},
    {name: 'LC Título III', index: 3},
    {name: 'LC Título IV', index: 4},
    {name: 'LC Título V', index: 5},
    {name: 'LC Título VI', index: 6},
    {name: 'LC Régimen Transitorio', index: 7},
    {name: 'Técnicas', index: 8},
    {name: 'Otros', index: 9},
  ],
  'aguas': [
    {name: 'TRLA Título I', index: 1},
    {name: 'TRLA Título II', index: 2},
    {name: 'TRLA Título III', index: 3},
    {name: 'TRLA Título IV', index: 4},
    {name: 'TRLA Título V', index: 5},
    {name: 'TRLA Título VI', index: 6},
    {name: 'TRLA Título VII', index: 7},
    {name: 'RPH e IPH', index: 8},
    {name: 'DMA', index: 9},
    {name: 'RD 817/2015', index: 10},
    {name: 'RD 1514/2009', index: 11},
    {name: 'RD Nitratos', index: 12},
    {name: 'Protocolos', index: 13},
    {name: 'Depuración y Reutilización', index: 14},
    {name: 'Inundaciones y Sequías', index: 15},
    {name: 'Calidad Aguas de Baño y de Consumo', index: 16},
    {name: 'Hidrología y Técnicas', index: 17},
    {name: 'Otros', index: 18},
  ],

}

export interface SUBSECTIONINTERFACE {
  'administrativo': { name: string; index: number; }[];
  'medio ambiente': { name: string; index: number; }[];
  'costas': { name: string; index: number; }[];
  'aguas': { name: string; index: number; }[];
}


