import vertexai
from vertexai.generative_models import GenerativeModel, Part
from google.oauth2 import service_account
from config.config import SaGoogle, GeminiConfig, PgCredential, MinioConfig
import base64
import logging
from typing import Optional, Dict
import json

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
            # Inisialisasi credentials Vertex AI
            gemini_config = GeminiConfig()
            sa = SaGoogle()
            
            credentials = service_account.Credentials.from_service_account_file(
                sa.vertex,  
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            
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

            Format output dalam JSON:
            {{
                "latar_belakang": "konten latar belakang disini",
                "tujuan_inovasi": "konten tujuan inovasi disini",
                "deskripsi_inovasi": "konten deskripsi inovasi disini"
            }}

            Jika section tidak ditemukan, isi dengan "TIDAK DITEMUKAN".
            Pastikan output adalah valid JSON.
            """
            
            # Generate content using Gemini
            response = self.model.generate_content([prompt, pdf_part])
            
            if response and response.text:
                try:
                    # Try to parse as JSON
                    result_text = response.text.strip()
                    
                    # Remove code block markers if present
                    if result_text.startswith('json'):
                        result_text = result_text[7:]
                    if result_text.startswith(''):
                        result_text = result_text[3:]
                    if result_text.endswith(''):
                        result_text = result_text[:-3]
                    
                    result = json.loads(result_text.strip())
                    logger.info("Multiple sections extracted successfully")
                    return result
                    
                except json.JSONDecodeError:
                    # If JSON parsing fails, return raw text
                    logger.warning("Failed to parse JSON, returning raw text")
                    return {"raw_response": response.text}
            else:
                logger.warning("No response from Gemini")
                return {}
                
        except Exception as e:
            logger.error(f"Failed to extract multiple sections: {e}")
            return {}
    
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