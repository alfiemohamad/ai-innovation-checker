export interface User {
  name: string;
}

export interface ExtractedSections {
  latar_belakang?: '✓' | '✗';
  tujuan_inovasi?: '✓' | '✗';
  deskripsi_inovasi?: '✓' | '✗';
}

export interface LsaSimilarityResult {
  lsa_similarity: number;
  link_document: string;
}

export interface Innovation {
  innovation_id: string;
  judul_inovasi: string;
  extracted_sections: ExtractedSections;
  lsa_similarity_results: LsaSimilarityResult[];
}

export interface Score {
  substansi_orisinalitas: number;
  substansi_urgensi: number;
  substansi_kedalaman: number;
  analisis_dampak: number;
  analisis_kelayakan: number;
  analisis_data: number;
  sistematika_struktur: number;
  sistematika_bahasa: number;
  sistematika_referensi: number;
  total: number;
}

export interface Summary {
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}
