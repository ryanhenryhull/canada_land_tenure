export interface MFClass {
  code: number;
  labelEn: string;
  labelFr: string;
  color: [number, number, number]; // RGB 0-255
}

export const MF_CLASSES: MFClass[] = [
  { code: 11, labelEn: "Lands with long term volume- or area-based Crown timber dispositions", labelFr: "le volume à  long terme ou les dispositions territoriales sur le bois de la Couronne", color: [112, 156, 144] },
  { code: 12, labelEn: "Lands with short term volume- or area-based Crown timber dispositions", labelFr: "le volume à  court terme ou les dispositions territoriales sur le bois de la Couronne", color: [174, 207, 185] },
  { code: 13, labelEn: "Lands with no current Crown timber dispositions", labelFr: "aucune disposition actuelle du bois de la Couronne", color: [235, 234, 208] },
  { code: 20, labelEn: "Lands legal protection status (IUCN MFIA, IB, II, III, IV, V or VI equivalent)", labelFr: "statut légale( de protection (IUCN classe IA IB II III IV V équivalent VI)", color: [171, 189, 56] },
  { code: 31, labelEn: "Lands held in reserve by the Federal government for military or other purposes", labelFr: "réservé par le gouvernement fédéral à des fins militaires ou autres", color: [97, 102, 198] },
  { code: 32, labelEn: "Lands held in reserve by the Federal government under the Indian Act", labelFr: "réservé  par le gouvernement fédéral en vertu de la Loi sur les Indiens", color: [134, 81, 15] },
  { code: 33, labelEn: "Lands reserved or designated restricted use by provincial or territorial government", labelFr: "utilisation restreinte ou réservée par le gouvernement provincial ou territorial", color: [210, 225, 74] },
  { code: 40, labelEn: "Aboriginal Lands", labelFr: "Terres autochtones", color: [192, 122, 8] },
  { code: 50, labelEn: "Privately-owned lands", labelFr: "Terres privées", color: [70, 96, 90] },
  { code: 100, labelEn: "Water", labelFr: "Eau", color: [255, 255, 255] },
];

export const MF_CLASS_MAP = new Map(MF_CLASSES.map(c => [c.code, c]));
