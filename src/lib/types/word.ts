export interface WordToken {
  raw: string;
  display: string;
  orpIndex: number;
  delay: number;
  punctuationType: "sentence_end" | "clause" | "none";
  syllableCount: number;
  isParaEnd: boolean;
  index: number;
}
