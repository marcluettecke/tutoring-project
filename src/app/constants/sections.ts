export const MAINSECTIONS = ['administrativo', 'medio ambiente', 'costas', 'aguas']

export const SUBSECTIONS = {
  'administrativo': [
    {name: 'Constitución Española', index: 1},
    {name: 'Ley 39/2015', index: 2},
    {name: 'Ley 40/2015', index: 3},
    {name: 'LCSP', index: 4},
    {name: 'EBEP', index: 5},
    {name: 'Leyes de Derechos Sociales', index: 6},
    {name: 'Unión Europea', index: 7},
    {name: 'Otros', index: 8},
  ],
  'medio ambiente': [
    {name: 'PNyB, parques nacionales y montes', index: 1},
    {name: 'Convenio Aarhus', index: 2},
    {name: 'Medio marino', index: 3},
    {name: 'Evaluación ambiental', index: 4},
    {name: 'Residuos y economía circular', index: 5},
    {name: 'Cambio climático', index: 6},
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
    {name: 'LC régimen transitorio', index: 7},
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
    {name: 'Ley del PHN', index: 9},
    {name: 'DMA', index: 10},
    {name: 'RD 817/2015', index: 11},
    {name: 'RD 1514/2009', index: 12},
    {name: 'RD Nitratos', index: 13},
    {name: 'Protocolos', index: 14},
    {name: 'Depuración y reutilización', index: 15},
    {name: 'Inundaciones y sequías', index: 16},
    {name: 'Calidad aguas de baño y de consumo', index: 17},
    {name: 'Hidrología y técnicas', index: 18},
    {name: 'Otros', index: 19},
  ],

}

export interface SUBSECTIONINTERFACE {
  'administrativo': { name: string; index: number; }[];
  'medio ambiente': { name: string; index: number; }[];
  'costas': { name: string; index: number; }[];
  'aguas': { name: string; index: number; }[];
}


