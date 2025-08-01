import vertexai
from vertexai.generative_models import GenerativeModel, Part
from google.oauth2 import service_account
from google.auth import default
from config.config import SaGoogle, GeminiConfig, PgCredential, MinioConfig
import base64
import logging
from typing import Optional, Dict
import json
import re
import pandas as pd

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiPDFExtractor:
    def __init__(self):
        """Initialize Gemini PDF Extractor with service account credentials"""
        self.setup_gemini()
        
    def setup_gemini(self):
        """Setup Gemini with service account credentials"""
        try:
            # Initialize credentials Vertex AI
            gemini_config = GeminiConfig()
            sa = SaGoogle()
            
            # Check if sa.vertex is a file path or JSON content
            if sa.vertex and sa.vertex != '{}':
                try:
                    # Try to parse as JSON content first (for environment variable)
                    json_content = json.loads(sa.vertex)
                    credentials = service_account.Credentials.from_service_account_info(
                        json_content,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    logger.info("Loaded credentials from JSON content (environment variable)")
                except json.JSONDecodeError:
                    # If not JSON, treat as file path (for local development)
                    credentials = service_account.Credentials.from_service_account_file(
                        sa.vertex,  
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    logger.info("Loaded credentials from file path")
            else:
                # No credentials provided - skip Vertex AI initialization for testing
                logger.warning("No Google Cloud credentials found. Vertex AI features will be disabled.")
                return
            
            vertexai.init(
                credentials=credentials,
                project=gemini_config.project,
                location=gemini_config.location
            )
            
            # Initialize Gemini Flash model
            self.model = GenerativeModel("gemini-2.0-flash")
            
            logger.info("Gemini Flash multimodal initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            raise
    
    def load_pdf_as_part(self, pdf_path: str) -> Part:
        """Load PDF file and convert to Gemini Part object"""
        try:
            with open(pdf_path, 'rb') as pdf_file:
                pdf_data = pdf_file.read()
            
            # Create Part object for PDF
            pdf_part = Part.from_data(
                data=pdf_data,
                mime_type="application/pdf"
            )
            
            logger.info(f"PDF loaded successfully: {pdf_path}")
            return pdf_part
            
        except Exception as e:
            logger.error(f"Failed to load PDF {pdf_path}: {e}")
            raise
    
    def clean_json_response(self, response_text: str) -> str:
        """Clean and extract JSON from response text"""
        if not response_text:
            return ""
        
        # Remove leading/trailing whitespace
        text = response_text.strip()
        
        # Try to extract JSON from markdown code block first
        json_match = re.search(r'```json\s*\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()
        
        # Try to extract JSON from generic code block
        code_match = re.search(r'```\s*\n(.*?)\n```', text, re.DOTALL)
        if code_match:
            potential_json = code_match.group(1).strip()
            # Check if it looks like JSON
            if potential_json.startswith('{') and potential_json.endswith('}'):
                return potential_json
        
        # Try to find JSON object in raw text
        json_start = text.find('{')
        json_end = text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            return text[json_start:json_end]
        
        # Return original text if no JSON pattern found
        return text
    
    def extract_multiple_sections(self, pdf_path: str, sections: list) -> Dict[str, str]:
        """Extract multiple sections from PDF"""
        try:
            # Load PDF
            pdf_part = self.load_pdf_as_part(pdf_path)
            
            # Create sections list for prompt
            sections_list = "', '".join(sections)
            
            # Create prompt for extracting multiple sections
            prompt = f"""
            Analisis dokumen PDF ini dan ekstrak bagian-bagian berikut: '{sections_list}'

            Untuk setiap section:
            1. Cari section dengan judul yang sesuai (bisa dengan nomor seperti "1. Latar Belakang" atau tanpa nomor)
            2. Ekstrak seluruh konten dari section tersebut
            3. Jangan sertakan judul section dalam hasil

            Format output dalam JSON yang valid:
            {{
                "latar_belakang": "konten latar belakang disini",
                "tujuan_inovasi": "konten tujuan inovasi disini", 
                "deskripsi_inovasi": "konten deskripsi inovasi disini"
            }}

            Jika section tidak ditemukan, isi dengan "TIDAK DITEMUKAN".
            PENTING: Pastikan output adalah valid JSON tanpa karakter escape yang tidak perlu.
            Jangan gunakan markdown code block, berikan hanya JSON murni.
            """
            
            # Generate content using Gemini
            response = self.model.generate_content([prompt, pdf_part])
            
            if response and response.text:
                try:
                    # Clean the response text
                    cleaned_json = self.clean_json_response(response.text)
                    
                    # Try to parse as JSON
                    result = json.loads(cleaned_json)
                    
                    # Validate that we have the expected sections
                    for section in sections:
                        if section not in result:
                            result[section] = "TIDAK DITEMUKAN"
                    
                    logger.info("Multiple sections extracted successfully")
                    return result
                    
                except json.JSONDecodeError as e:
                    # If JSON parsing fails, return raw text for fallback processing
                    logger.warning(f"Failed to parse JSON: {e}")
                    logger.warning(f"Raw response: {response.text[:500]}...")
                    return {"raw_response": response.text}
            else:
                logger.warning("No response from Gemini")
                return {section: "TIDAK DITEMUKAN" for section in sections}
                
        except Exception as e:
            logger.error(f"Failed to extract multiple sections: {e}")
            return {section: "TIDAK DITEMUKAN" for section in sections}
    
    def extract_with_custom_prompt(self, pdf_path: str, custom_prompt: str) -> Optional[str]:
        """Extract content using custom prompt"""
        try:
            # Load PDF
            pdf_part = self.load_pdf_as_part(pdf_path)
            
            # Generate content using Gemini
            response = self.model.generate_content([custom_prompt, pdf_part])
            
            if response and response.text:
                logger.info("Custom extraction completed successfully")
                return response.text.strip()
            else:
                logger.warning("No response from Gemini")
                return None
                
        except Exception as e:
            logger.error(f"Failed to extract with custom prompt: {e}")
            return None
    
    @staticmethod
    def build_scoring_prompt(scoring_dict=None):
        """Build prompt for scoring using env config."""
        if scoring_dict is None:
            import os
            scoring_dict = {
                "substansi_orisinalitas": int(os.getenv("SCORING_SUBSTANSI_ORISINALITAS", 15)),
                "substansi_urgensi": int(os.getenv("SCORING_SUBSTANSI_URGENSI", 10)),
                "substansi_kedalaman": int(os.getenv("SCORING_SUBSTANSI_KEDALAMAN", 15)),
                "analisis_dampak": int(os.getenv("SCORING_ANALISIS_DAMPAK", 15)),
                "analisis_kelayakan": int(os.getenv("SCORING_ANALISIS_KELAYAKAN", 10)),
                "analisis_data": int(os.getenv("SCORING_ANALISIS_DATA", 10)),
                "sistematika_struktur": int(os.getenv("SCORING_SISTEMATIKA_STRUKTUR", 10)),
                "sistematika_bahasa": int(os.getenv("SCORING_SISTEMATIKA_BAHASA", 10)),
                "sistematika_referensi": int(os.getenv("SCORING_SISTEMATIKA_REFERENSI", 5)),
            }
        prompt = """
        Berikan penilaian untuk dokumen PDF ini berdasarkan komponen berikut (skor maksimal di dalam kurung):\n\n"""
        prompt += "I. Substansi & Gagasan Inovasi\n"
        prompt += f"A. Orisinalitas dan Kebaruan ({scoring_dict['substansi_orisinalitas']})\n"
        prompt += f"B. Urgensi dan Relevansi Masalah ({scoring_dict['substansi_urgensi']})\n"
        prompt += f"C. Kejelasan dan Kedalaman Gagasan ({scoring_dict['substansi_kedalaman']})\n"
        prompt += "II. Analisis, Potensi, & Kelayakan\n"
        prompt += f"A. Potensi Dampak dan Manfaat ({scoring_dict['analisis_dampak']})\n"
        prompt += f"B. Analisis Kelayakan Implementasi ({scoring_dict['analisis_kelayakan']})\n"
        prompt += f"C. Kekuatan Data dan Argumen ({scoring_dict['analisis_data']})\n"
        prompt += "III. Sistematika & Kualitas Penulisan\n"
        prompt += f"A. Struktur dan Alur Logika ({scoring_dict['sistematika_struktur']})\n"
        prompt += f"B. Kualitas Bahasa dan Tata Tulis ({scoring_dict['sistematika_bahasa']})\n"
        prompt += f"C. Penggunaan Referensi dan Sitasi ({scoring_dict['sistematika_referensi']})\n\n"
        prompt += "Berikan hasil penilaian dalam format JSON seperti contoh berikut:\n{\n  'substansi_orisinalitas': 12,\n  'substansi_urgensi': 8,\n  'substansi_kedalaman': 13,\n  'analisis_dampak': 14,\n  'analisis_kelayakan': 9,\n  'analisis_data': 8,\n  'sistematika_struktur': 9,\n  'sistematika_bahasa': 8,\n  'sistematika_referensi': 4,\n  'total': 85\n}\n"
        return prompt

    @staticmethod
    def generate_inovasi_id(judul_inovasi: str, nama_inovator: str) -> str:
        """Generate unique id for inovasi based on judul and inovator."""
        return f"{judul_inovasi.lower().replace(' ', '_')}_{nama_inovator.lower().replace(' ', '_')}"

    @staticmethod
    def build_inovasi_dataframe(local_path, judul_inovasi, x_inovator, extracted):
        return pd.DataFrame([{
            "pdf_path": str(local_path),
            "nama_inovasi": judul_inovasi.lower().replace(" ", "_"),
            "nama_inovator": x_inovator.lower().replace(" ", "_"),
            "id": GeminiPDFExtractor.generate_inovasi_id(judul_inovasi, x_inovator),
            "latar_belakang": extracted.get("latar_belakang", "TIDAK DITEMUKAN"),
            "tujuan_inovasi": extracted.get("tujuan_inovasi", "TIDAK DITEMUKAN"),
            "deskripsi_inovasi": extracted.get("deskripsi_inovasi", "TIDAK DITEMUKAN"),
        }])