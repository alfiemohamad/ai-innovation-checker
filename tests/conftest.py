"""
Simplified test configuration for minimal coverage tests
"""
import pytest
import asyncio
import os

# Set testing environment
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/test_db"
os.environ["MINIO_ENDPOINT"] = "localhost:9000"
os.environ["MINIO_ACCESS_KEY"] = "testuser"
os.environ["MINIO_SECRET_KEY"] = "testpass123"
os.environ["MINIO_BUCKET_NAME"] = "test-bucket"
os.environ["MINIO_SECURE"] = "false"

# Note: For minimal testing, we avoid importing the main app to prevent initialization issues


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_user():
    """Test user data."""
    return {
        "name": "test_user",
        "email": "test@example.com"
    }


@pytest.fixture
def sample_innovation_data():
    """Sample innovation data for testing."""
    return {
        "judul_inovasi": "Test Innovation: Smart IoT System",
        "table_name": "innovations",
        "nama_inovator": "test_user"
    }


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment variables and cleanup."""
    # Setup
    original_env = dict(os.environ)
    
    yield
    
    # Cleanup - restore original environment
    os.environ.clear()
    os.environ.update(original_env)
