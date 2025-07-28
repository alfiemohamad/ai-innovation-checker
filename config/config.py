import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SaGoogle:
    def __init__(self):
        self.vertex = os.getenv('GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON', '{}')
        self.api_key = os.getenv('GOOGLE_API_KEY', None)

class GeminiConfig:
    def __init__(self):
        self.project = os.getenv('GEMINI_PROJECT', '')
        self.location = os.getenv('GEMINI_LOCATION', 'us-central1')
        self.api_key = os.getenv('GEMINI_API_KEY', None)

class PgCredential:
    def __init__(self):
        self.hostname = os.getenv('PG_HOST', 'localhost')
        self.port = int(os.getenv('PG_PORT', 5432))
        self.username = os.getenv('PG_USER', 'postgres')
        self.password = os.getenv('PG_PASSWORD', '')
        self.database = os.getenv('PG_DATABASE', 'postgres')

class MinioConfig:
    def __init__(self):
        self.endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
        self.access_key = os.getenv('MINIO_ACCESS_KEY', '')
        self.secret_key = os.getenv('MINIO_SECRET_KEY', '')
        self.secure = os.getenv('MINIO_SECURE', 'False').lower() == 'true'
        self.bucket_name = os.getenv('MINIO_BUCKET', 'ai-innovation')
        self.base_url = os.getenv('MINIO_BASE_URL', f'http://{self.endpoint}')
