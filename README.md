# AI Innovation Checker

AI Innovation Checker adalah platform web modern untuk mengelola, menilai, dan melakukan pengecekan kemiripan (plagiarisme) dokumen inovasi berbasis PDF menggunakan teknologi AI (Google Vertex AI Gemini, LangChain, vektor database, MinIO, dan FastAPI). Sistem ini menyediakan dashboard interaktif, upload PDF, penilaian otomatis, chat AI, analitik, dan fitur chatbot mengambang.

[![Build Status](https://github.com/alfiemohamad/ai-innovation-checker/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/alfiemohamad/ai-innovation-checker/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=alfiemohamad_ai-innovation-checker&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=alfiemohamad_ai-innovation-checker)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=alfiemohamad_ai-innovation-checker&metric=coverage)](https://sonarcloud.io/summary/new_code?id=alfiemohamad_ai-innovation-checker)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=alfiemohamad_ai-innovation-checker&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=alfiemohamad_ai-innovation-checker)
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-16%2F16%20passing-brightgreen)](https://github.com/alfiemohamad/ai-innovation-checker/actions)

---

## 🚀 Fitur Utama

### 📤 Upload & AI Analysis
- **Upload PDF Inovasi**: Upload dokumen dengan loading state dan AI summary real-time
- **Ekstraksi Otomatis**: AI mengekstrak latar belakang, tujuan, dan deskripsi inovasi
- **AI Summary**: Ringkasan komprehensif dengan analisis masalah, solusi, manfaat, dan keunikan
- **Auto-Refresh**: List inovasi terupdate otomatis setelah upload

### 🔍 Smart Search & Similarity
- **Innovation Search**: Pencarian natural language dengan AI explanation
- **Cek Kemiripan (Plagiarisme)**: Vector embedding dan LSA similarity detection
- **Semantic Search**: Pencarian berbasis makna, bukan hanya keyword matching

### 📊 Scoring & Analytics
- **Penilaian Otomatis**: AI-powered scoring berdasarkan 9 komponen penilaian
- **Ranking System**: Leaderboard inovasi berdasarkan total score
- **PDF Preview**: Preview dokumen tanpa download dengan blob URL
- **Memory Management**: Auto cleanup file preview untuk optimasi performa

### 💬 AI Chat & Interaction
- **Chatbot AI**: Chat interaktif per dokumen dan floating chatbot
- **Context-Aware**: AI memahami konteks dokumen untuk jawaban yang relevan
- **Chat History**: Riwayat percakapan tersimpan per dokumen

### 🎨 Modern UI/UX
- **Responsive Design**: Dashboard modern dengan sidebar navigation
- **Real-time Updates**: Loading states, progress indicators, dan live data sync
- **Interactive Components**: Modal detail, collapsible sections, toast notifications
- **Accessibility**: ARIA labels dan semantic HTML

---

## 🏗️ Arsitektur

### Backend Architecture
```
FastAPI (Async)
├── Routes (Modular Endpoints)
├── AI Integration (Gemini + LangChain)
├── Vector Database (PgVector)
├── File Storage (MinIO)
├── Database (PostgreSQL)
└── Authentication & Security
```

### Frontend Architecture
```
React (Vite + TypeScript)
├── Component-Based UI
├── State Management (React Hooks)
├── API Integration (Fetch)
├── Real-time Updates
└── Modern CSS (Responsive)
```

### Storage & AI
- **MinIO**: Secure PDF file storage with object URLs
- **PostgreSQL + PgVector**: Metadata dan vector embeddings
- **Google Vertex AI Gemini**: Multimodal AI untuk ekstraksi dan analisis
- **LangChain**: AI orchestration dan prompt management

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with PgVector extension
- **File Storage**: MinIO (S3-compatible object storage)
- **AI/ML**: Google Vertex AI Gemini, LangChain
- **Vector Search**: PgVector for embedding similarity
- **Authentication**: Header-based user identification
- **API Docs**: Auto-generated OpenAPI/Swagger documentation

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast dev server & build)
- **Styling**: Modern CSS with CSS Variables
- **Icons**: React Icons (Font Awesome)
- **HTTP Client**: Native Fetch API
- **State Management**: React Hooks (useState, useEffect)

### Development & Deployment
- **Package Manager**: npm (frontend), pip (backend)
- **Code Quality**: ESLint, Prettier, SonarCloud
- **Testing**: pytest (backend), Vitest (frontend)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker & Docker Compose

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL with PgVector extension
- MinIO server
- Google Cloud account (untuk Vertex AI)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/ai-innovation-checker.git
cd ai-innovation-checker
```

### 2. Backend Setup

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Configuration
Create `.env` file in root directory:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_innovation_db

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=ai-innovation
MINIO_SECURE=false

# Google Cloud Vertex AI Configuration
# Option 1: Use JSON file path (for local development)
GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON=config/key/vertex.json

# Option 2: Use JSON content directly (for CI/CD environments)
# GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}

# Option 3: Disable Vertex AI for testing
# GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON={}

GEMINI_PROJECT=your-project-id
GEMINI_LOCATION=us-central1

# Application
APP_ENV=development
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Google Cloud Authentication Setup

The application supports three authentication methods for Google Cloud Vertex AI:

**Option 1: JSON File Path (Recommended for Local Development)**
```env
GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON=config/key/vertex.json
```
- Place your service account JSON file in `config/key/vertex.json`
- Best for local development and testing with real credentials

**Option 2: JSON Content as Environment Variable (Recommended for CI/CD)**
```env
GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}'
```
- Ideal for CI/CD pipelines and containerized deployments
- Set as a repository secret in GitHub Actions
- More secure as credentials are not stored as files

**Option 3: Disable Vertex AI (For Testing)**
```env
GOOGLE_VERTEX_SERVICE_ACCOUNT_JSON={}
```
- Disables all Vertex AI features gracefully
- Application will run without AI capabilities
- Useful for testing infrastructure components

#### Database Setup
```bash
# Install PostgreSQL with PgVector
# Ubuntu/Debian:
sudo apt-get install postgresql-15 postgresql-15-pgvector

# macOS:
brew install postgresql pgvector

# Create database and enable PgVector
psql -U postgres -c "CREATE DATABASE ai_innovation_db;"
psql -U postgres -d ai_innovation_db -c "CREATE EXTENSION vector;"
```

#### Start Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend akan running di: http://localhost:8000

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd app/
```

#### Install Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```
Frontend akan running di: http://localhost:5173

### 4. Services Setup

#### MinIO Setup
```bash
# Menggunakan Docker
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

#### Access MinIO Console
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

Create bucket named `ai-innovation` with public read policy.

---

## 📖 Development Guide

### Backend Development

#### Project Structure
```
├── main.py                 # FastAPI entry point
├── routes/                 # API endpoints
│   ├── innovation.py       # Innovation management
│   ├── chat.py            # AI chat endpoints
│   └── user.py            # User management
├── module/                 # Core modules
│   ├── multimodal_model.py # AI model integration
│   ├── vector.py          # Vector operations
│   └── __init__.py
├── config/                 # Configuration
│   ├── config.py          # App configuration
│   └── key/               # Service account keys
└── uploads/               # Temporary file storage
```

#### Adding New Endpoints
```python
# routes/example.py
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["example"])

@router.get("/example")
async def get_example(
    x_inovator: Optional[str] = Header(None, alias="X-Inovator")
):
    """Example endpoint with authentication header"""
    if not x_inovator:
        raise HTTPException(status_code=401, detail="X-Inovator header required")
    
    return {"message": f"Hello, {x_inovator}!"}

# main.py
from routes.example import router as example_router
app.include_router(example_router)
```

#### Database Operations
```python
import psycopg2
from config.config import get_db_connection

async def create_innovation(data: dict):
    """Create new innovation record"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO innovations (id, title, content, creator)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (data['id'], data['title'], data['content'], data['creator']))
        
        result = cursor.fetchone()
        conn.commit()
        return result[0]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
```

#### AI Integration
```python
from module.multimodal_model import get_gemini_response

async def analyze_innovation(pdf_path: str):
    """Analyze innovation PDF with AI"""
    prompt = """
    Analyze this innovation document and extract:
    1. Background (latar_belakang)
    2. Innovation goals (tujuan_inovasi)  
    3. Innovation description (deskripsi_inovasi)
    
    Return as JSON with sections and AI summary.
    """
    
    response = await get_gemini_response(prompt, pdf_path)
    return response
```

### Frontend Development

#### Project Structure
```
app/
├── index.tsx              # Main React entry point
├── index.css              # Global styles
├── types.ts               # TypeScript type definitions
├── components/            # React components
│   ├── InnovationUploader.tsx
│   ├── InnovationList.tsx
│   ├── InnovationSearchMenu.tsx
│   ├── GetScoreMenu.tsx
│   ├── SidebarMenu.tsx
│   ├── LoginPage.tsx
│   └── UserProfileModal.tsx
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite configuration
```

#### Creating New Components
```typescript
// components/ExampleComponent.tsx
import React, { useState, useEffect, type FC } from 'react';
import type { User } from '../types';

interface ExampleProps {
  user: User;
  onAction?: (data: any) => void;
}

const ExampleComponent: FC<ExampleProps> = ({ user, onAction }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Component initialization
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/endpoint', {
        headers: {
          'X-Inovator': user.name,
          'accept': 'application/json'
        }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Example Component</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {/* Component content */}
        </div>
      )}
    </div>
  );
};

export default ExampleComponent;
```

#### State Management Pattern
```typescript
// Centralized state in main component
const [activeMenu, setActiveMenu] = useState('upload');
const [user, setUser] = useState<User | null>(null);
const [innovations, setInnovations] = useState<Innovation[]>([]);

// Pass data and handlers to child components
<InnovationUploader 
  user={user}
  onUploadSuccess={(innovation) => {
    setInnovations(prev => [innovation, ...prev]);
    setActiveMenu('my_innovations');
  }}
/>
```

#### API Integration
```typescript
// Utility function for API calls
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers: {
        'accept': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};
```

### Styling Guidelines

#### CSS Architecture
```css
/* CSS Variables for theming */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --bg-color: #1a1a1a;
  --card-bg-color: #2d2d2d;
  --text-color: #ffffff;
  --text-secondary-color: #b0b0b0;
  --border-color: #444;
}

/* Component styling pattern */
.component-name {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  /* Visual */
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  
  /* Typography */
  color: var(--text-color);
}

/* State-based styling */
.component-name.loading {
  opacity: 0.7;
  pointer-events: none;
}

.component-name .error-message {
  color: var(--danger-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
```

### Backend Testing (pytest)

#### Test Structure
```
tests/
├── conftest.py              # Test configuration & fixtures
├── test_main.py             # Main API tests
├── test_innovation.py       # Innovation endpoints
├── test_chat.py             # Chat functionality
├── test_vector.py           # Vector operations
└── test_integration.py      # Integration tests
```

#### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html --cov-report=xml

# Run specific test file
pytest tests/test_innovation.py

# Run with verbose output
pytest -v

# Run only integration tests
pytest -m integration
```

#### Test Examples
```python
# tests/test_innovation.py
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_upload_innovation():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        with open("test_files/sample.pdf", "rb") as f:
            response = await ac.post(
                "/innovations/",
                headers={"X-Inovator": "test_user"},
                files={"file": ("test.pdf", f, "application/pdf")},
                data={"judul_inovasi": "Test Innovation", "table_name": "innovations"}
            )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_get_score():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/get_score",
            headers={"X-Inovator": "test_user"},
            data={"id": "test_innovation_id", "table_name": "innovations"}
        )
    assert response.status_code == 200
    assert "total_score" in response.json()
```

### Frontend Testing (Vitest)

#### Test Structure
```
app/
├── src/
│   └── __tests__/           # Test files
│       ├── components/      # Component tests
│       ├── utils/           # Utility tests
│       └── integration/     # Integration tests
├── setupTests.ts            # Test setup
└── vitest.config.ts         # Vitest configuration
```

#### Running Tests
```bash
cd app/

# Install test dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run UI mode
npm run test:ui
```

#### Test Examples
```typescript
// app/src/__tests__/components/InnovationUploader.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InnovationUploader from '../../components/InnovationUploader';

const mockUser = { name: 'test_user' };
const mockOnUploadSuccess = vi.fn();

describe('InnovationUploader', () => {
  it('renders upload form', () => {
    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess} 
      />
    );
    
    expect(screen.getByLabelText(/judul inovasi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('shows loading state during upload', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      })
    );

    render(
      <InnovationUploader 
        user={mockUser} 
        onUploadSuccess={mockOnUploadSuccess} 
      />
    );

    const titleInput = screen.getByLabelText(/judul inovasi/i);
    const uploadButton = screen.getByRole('button', { name: /upload/i });

    fireEvent.change(titleInput, { target: { value: 'Test Innovation' } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });
});
```

### Performance Testing

#### Load Testing with Locust
```python
# locustfile.py
from locust import HttpUser, task, between

class InnovationUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        self.client.headers.update({"X-Inovator": "load_test_user"})
    
    @task(3)
    def search_innovations(self):
        self.client.post("/search_inovasi", data={
            "query": "IoT innovation",
            "table_name": "innovations"
        })
    
    @task(1)
    def get_ranking(self):
        self.client.get("/get_rank?table_name=innovations")
```

```bash
# Run load tests
pip install locust
locust -f locustfile.py --host=http://localhost:8000
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

#### Main CI/CD Pipeline (`.github/workflows/ci.yml`)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  PYTHON_VERSION: '3.11'
  NODE_VERSION: '18'

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      minio:
        image: minio/minio
        env:
          MINIO_ROOT_USER: testuser
          MINIO_ROOT_PASSWORD: testpass123
        options: --health-cmd "curl -f http://localhost:9000/minio/health/live"
        ports:
          - 9000:9000
        command: server /data

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Cache Python dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov httpx
    
    - name: Set up test environment
      run: |
        echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db" >> .env
        echo "MINIO_ENDPOINT=localhost:9000" >> .env
        echo "MINIO_ACCESS_KEY=testuser" >> .env
        echo "MINIO_SECRET_KEY=testpass123" >> .env
        echo "MINIO_BUCKET_NAME=test-bucket" >> .env
        echo "MINIO_SECURE=false" >> .env
        echo "APP_ENV=testing" >> .env
    
    - name: Initialize database
      run: |
        PGPASSWORD=postgres psql -h localhost -U postgres -d test_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
    
    - name: Run backend tests
      run: |
        pytest --cov=. --cov-report=xml --cov-report=html --junitxml=junit.xml -v
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        flags: backend
        name: backend-coverage
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: app/package-lock.json
    
    - name: Install frontend dependencies
      working-directory: ./app
      run: npm ci
    
    - name: Run frontend linting
      working-directory: ./app
      run: npm run lint
    
    - name: Run frontend tests
      working-directory: ./app
      run: npm run test:coverage
    
    - name: Upload frontend coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./app/coverage/lcov.info
        flags: frontend
        name: frontend-coverage
    
    - name: Build frontend
      working-directory: ./app
      run: npm run build

  integration-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: integration_test_db
        ports:
          - 5432:5432
      
      minio:
        image: minio/minio
        env:
          MINIO_ROOT_USER: testuser
          MINIO_ROOT_PASSWORD: testpass123
        ports:
          - 9000:9000
        command: server /data

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        cd app && npm ci
    
    - name: Run integration tests
      run: |
        # Start backend in background
        uvicorn main:app --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        
        # Start frontend in background
        cd app && npm run dev -- --host 0.0.0.0 --port 3000 &
        FRONTEND_PID=$!
        
        # Wait for services to start
        sleep 30
        
        # Run integration tests
        pytest tests/test_integration.py -v
        
        # Cleanup
        kill $BACKEND_PID $FRONTEND_PID

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

  deploy:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, integration-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment scripts here
```

#### SonarCloud Configuration (`sonar-project.properties`)
```properties
sonar.projectKey=your-organization_ai-innovation-checker
sonar.organization=your-organization

# Source directories
sonar.sources=.
sonar.exclusions=**/*test*/**,**/node_modules/**,**/coverage/**,**/__pycache__/**,**/uploads/**

# Test directories
sonar.tests=tests/,app/src/__tests__/
sonar.test.inclusions=**/*test*/**

# Coverage reports
sonar.python.coverage.reportPaths=coverage.xml
sonar.javascript.lcov.reportPaths=app/coverage/lcov.info

# Language specific settings
sonar.python.version=3.11
sonar.typescript.tsconfigPath=app/tsconfig.json

# Quality gate
sonar.qualitygate.wait=true
```

### Code Quality Configuration

#### Backend - pytest.ini
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --strict-config
    --verbose
    --tb=short
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-report=xml
markers =
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    slow: marks tests as slow
```

#### Frontend - vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

#### Pre-commit Configuration (`.pre-commit-config.yaml`)
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
  
  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        language_version: python3.11
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: [--max-line-length=88, --extend-ignore=E203,W503]
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.57.0
    hooks:
      - id: eslint
        files: \.tsx?$
        types: [file]
        additional_dependencies:
          - '@typescript-eslint/eslint-plugin'
          - '@typescript-eslint/parser'
          - 'eslint-plugin-react'
```

---

## 📊 Monitoring & Analytics

### Application Metrics
- **Performance**: Response time, throughput, error rates
- **Usage**: API endpoint usage, user activity patterns
- **Resources**: Memory usage, database connections, file storage
- **Business**: Upload success rates, AI processing times, user engagement

### Health Checks
```python
# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": await check_database_health(),
            "minio": await check_minio_health(),
            "ai": await check_ai_service_health()
        }
    }
```

### Logging Configuration
```python
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
```

---

---

## API Endpoint Utama & Contoh Penggunaan

### 1. Upload Inovasi
**POST** `/innovations/`

Contoh cURL:
```bash
curl -X 'POST' \
  'http://localhost:8000/innovations/' \
  -H 'accept: application/json' \
  -H 'X-Inovator: user tester' \
  -H 'Content-Type: multipart/form-data' \
  -F 'judul_inovasi=Sistem "Nusantara Eco-Hub": Solusi Cerdas Pengelolaan Sampah Perkotaan Berbasis IoT, AI, dan Gamifikasi' \
  -F 'file=@Sistem _Nusantara Eco-Hub__ Solusi Cerdas Pengelolaan Sampah Perkotaan Berbasis IoT, AI, dan Gamifikasi.pdf;type=application/pdf' \
  -F 'table_name=innovations'
```
Contoh Response:
```json
{
  "status": "success",
  "code": 200,
  "table": "innovations",
  "extracted_sections": {
    "latar_belakang": "✓",
    "tujuan_inovasi": "✗",
    "deskripsi_inovasi": "✓"
  },
  "ai_summary": {
    "ringkasan_singkat": "Sistem ...",
    "masalah_yang_diatasi": "Krisis ...",
    "solusi_yang_ditawarkan": "Implementasi ...",
    "potensi_manfaat": "Peningkatan ...",
    "keunikan_inovasi": "Integrasi ..."
  },
  "innovation_id": "sistem_..._user_tester"
}
```

### 2. Penilaian Inovasi
**POST** `/get_score`

Contoh cURL:
```bash
curl -X 'POST' \
  'http://localhost:8000/get_score' \
  -H 'accept: application/json' \
  -H 'X-Inovator: user tester' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'id=773e4160-2961-4f29-8702-7bbf5d1f7765&table_name=innovations'
```
Contoh Response:
```json
{
  "innovation_id": "773e4160-2961-4f29-8702-7bbf5d1f7765",
  "nama_inovasi": "sistem_...",
  "nama_inovator": "user_tester",
  "link_document": "http://localhost:9000/ai-innovation/innovations/773e4160-2961-4f29-8702-7bbf5d1f7765.pdf",
  "component_scores": {
    "substansi_orisinalitas": 13,
    "substansi_urgensi": 9,
    "substansi_kedalaman": 12,
    "analisis_dampak": 13,
    "analisis_kelayakan": 8,
    "analisis_data": 7,
    "sistematika_struktur": 9,
    "sistematika_bahasa": 9,
    "sistematika_referensi": 3
  },
  "total_score": 83,
  "plagiarism_check": [
    {
      "similarity_score": 1,
      "nama_inovasi": "sistem_...",
      "nama_inovator": "user_tester",
      "compared_innovation_description": "Sistem ..."
    }
  ]
}
```

### 3. LSA Similarity
**GET** `/innovations/{id}/lsa_results`

Contoh cURL:
```bash
curl -X 'GET' \
  'http://localhost:8000/innovations/773e4160-2961-4f29-8702-7bbf5d1f7765/lsa_results?table_name=innovations' \
  -H 'accept: application/json'
```
Contoh Response:
```json
{
  "innovation_id": "773e4160-2961-4f29-8702-7bbf5d1f7765",
  "total_similar_documents": 1,
  "lsa_results": [
    {
      "compared_innovation_id": "sistem_...",
      "similarity_score": 1,
      "compared_innovation_description": "Sistem ...",
      "nama_inovator": "user_tester",
      "created_at": "2025-08-01T11:06:36.258387"
    }
  ]
}
```

### 4. Ringkasan AI
**GET** `/innovations/{id}/summary`

Contoh cURL:
```bash
curl -X 'GET' \
  'http://localhost:8000/innovations/sistem_%22nusantara_eco-hub%22%3A_solusi_cerdas_pengelolaan_sampah_perkotaan_berbasis_iot%2C_ai%2C_dan_gamifikasi_user_tester/summary?table_name=innovations' \
  -H 'accept: application/json'
```
Contoh Response:
```json
{
  "innovation_id": "sistem_..._user_tester",
  "nama_inovasi": "sistem_...",
  "nama_inovator": "user_tester",
  "link_document": "http://localhost:9000/ai-innovation/innovations/sistem_..._user_tester.pdf",
  "ai_summary": {
    "ringkasan_singkat": "Sistem ...",
    "masalah_yang_diatasi": "Krisis ...",
    "solusi_yang_ditawarkan": "Sistem ...",
    "potensi_manfaat": "Peningkatan ...",
    "keunikan_inovasi": "Integrasi ..."
  }
}
```

### 5. Chat Inovasi
**POST** `/innovations/{id}/chat`

Contoh cURL:
```bash
curl -X 'POST' \
  'http://localhost:8000/innovations/sistem_%22nusantara_eco-hub%22%3A_solusi_cerdas_pengelolaan_sampah_perkotaan_berbasis_iot%2C_ai%2C_dan_gamifikasi_user_tester/chat' \
  -H 'accept: application/json' \
  -H 'X-Inovator: user_tester' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'question=pakah%20ada%20saran%20perbaikan%20yg%20bisa%20dikembangkan%20dari%20inovasi%20saya&table_name=innovations'
```
Contoh Response:
```json
{
  "chat_id": "cf46f82c-eef1-495c-8af9-eead26e4923d",
  "innovation_id": "sistem_..._user_tester",
  "question": "pakah ada saran perbaikan yg bisa dikembangkan dari inovasi saya",
  "answer": "Tentu, berikut adalah beberapa saran ...",
  "timestamp": "2025-08-01T09:45:37.922913",
  "innovation_name": "sistem_..."
}
```

### 6. Ranking Inovasi
**GET** `/get_rank?table_name=innovations`

Contoh cURL:
```bash
curl -X 'GET' \
  'http://localhost:8000/get_rank?table_name=innovations' \
  -H 'accept: application/json'
```
Contoh Response:
```json
{
  "ranking": [
    {
      "innovation_id": "sistem_\"nusantara_eco-hub\":_solusi_cerdas_pengelolaan_sampah_perkotaan_berbasis_iot,_ai,_dan_gamifikasi_user_tester",
      "substansi_orisinalitas": 13,
      "substansi_urgensi": 9,
      "substansi_kedalaman": 14,
      "analisis_dampak": 13,
      "analisis_kelayakan": 8,
      "analisis_data": 7,
      "sistematika_struktur": 9,
      "sistematika_bahasa": 9,
      "sistematika_referensi": 4,
      "total_score": 86,
      "created_at": "2025-08-01T10:02:12.921681"
    },
    // ...
  ],
  "total": 7
}
```

### 7. Pencarian Inovasi Serupa
**POST** `/search_inovasi`

Contoh cURL:
```bash
curl -X 'POST' \
  'http://localhost:8000/search_inovasi' \
  -H 'accept: application/json' \
  -H 'X-Inovator: user test' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'query=saya%20ingin%20mengetahui%20apakah%20ada%20inovasi%20yg%20memanfaatkan%20iot&table_name=innovations'
```
Contoh Response:
```json
{
  "query": "saya ingin mengetahui apakah ada inovasi yg memanfaatkan iot",
  "top_innovation": {
    "id": "fe361b37-138a-499a-bfe4-5bcb79f8ae75",
    "nama_inovasi": "pemanfaatan_kecerdasan_buatan_dan_internet_of_things_untuk_pertanian_presisi_berkelanjutan_di_indonesia",
    "nama_inovator": "ryza",
    "latar_belakang": "Sebagai negara agraris, Indonesia ...",
    "tujuan_inovasi": "Tujuan dari penulisan makalah ini adalah ...",
    "deskripsi_inovasi": "Agri-Synth adalah sebuah ekosistem teknologi ...",
    "link_document": "http://localhost:9000/ai-innovation/innovations/fe361b37-138a-499a-bfe4-5bcb79f8ae75.pdf",
    "similarity": 0.7259951526999864
  },
  "ai_explanation": "Bayangkan sebuah sistem pintar untuk membantu petani ...",
  "results": [ /* ...list hasil similarity... */ ]
}
```

---

### Diagram Alur Proses (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant FastAPI
    participant MinIO
    participant PostgreSQL
    participant GeminiAI

    User->>Frontend: Upload PDF & data inovasi
    Frontend->>FastAPI: POST /innovations/ (PDF, judul, header)
    FastAPI->>MinIO: Simpan file PDF
    FastAPI->>GeminiAI: Ekstrak & ringkas PDF
    FastAPI->>PostgreSQL: Simpan metadata & hasil ekstraksi
    FastAPI-->>Frontend: Response (innovation_id, summary, etc)
    Frontend-->>User: Tampilkan hasil upload

    User->>Frontend: Request penilaian inovasi
    Frontend->>FastAPI: POST /get_score
    FastAPI->>PostgreSQL: Ambil metadata & file
    FastAPI->>GeminiAI: Skoring otomatis
    FastAPI->>PostgreSQL: Simpan hasil scoring & similarity
    FastAPI-->>Frontend: Response skor & similarity
    Frontend-->>User: Tampilkan skor & plagiarisme

    User->>Frontend: Chat/summary/analytics request
    Frontend->>FastAPI: Request endpoint terkait
    FastAPI->>PostgreSQL: Query data/chat/analytics
    FastAPI-->>Frontend: Response
    Frontend-->>User: Tampilkan jawaban/analitik
```

---

