# Setup SonarCloud untuk AI Innovation Checker

## 1. Setup SonarCloud Project

1. **Login ke SonarCloud**: https://sonarcloud.io/
2. **Import Project**: 
   - Pilih "Import your project" 
   - Pilih GitHub repository: `alfiemohamad/ai-innovation-checker`
3. **Set Organization**: `alfiemohamad`
4. **Set Project Key**: `alfiemohamad_ai-innovation-checker`

## 2. Generate SonarCloud Token

1. **My Account → Security**: https://sonarcloud.io/account/security/
2. **Generate Token**:
   - Name: `ai-innovation-checker-ci`
   - Type: `Project Analysis Token`
   - Project: `alfiemohamad_ai-innovation-checker`
3. **Copy the token** (simpan untuk langkah berikutnya)

## 3. Add GitHub Repository Secrets

1. **Go to Repository Settings**: https://github.com/alfiemohamad/ai-innovation-checker/settings/secrets/actions
2. **Add New Secret**:
   - Name: `SONAR_TOKEN`
   - Value: `[paste token dari langkah 2]`

## 4. Disable Automatic Analysis (PENTING!)

**Error yang sering terjadi**:
```
ERROR You are running CI analysis while Automatic Analysis is enabled. 
Please consider disabling one or the other.
```

**Solusi**:
1. **Go to SonarCloud Project**: https://sonarcloud.io/project/overview?id=alfiemohamad_ai-innovation-checker
2. **Administration → Analysis Method**
3. **Disable "Automatic Analysis"**
4. **Enable "CI-based analysis"** 

## 5. Verify Setup

Setelah setup, push commit untuk trigger CI/CD pipeline dan verifikasi:

1. **SonarCloud job berjalan** (tidak di-skip lagi)
2. **Quality Gate metrics** muncul di SonarCloud dashboard
3. **Badges di README** menampilkan status real-time

## 6. Create Pull Request untuk Test Pipeline

```bash
# Create develop branch (sudah dibuat)
git checkout develop

# Create PR via GitHub CLI atau web interface
# URL otomatis: https://github.com/alfiemohamad/ai-innovation-checker/pull/new/develop
```

**Kunjungi URL untuk membuat PR**: https://github.com/alfiemohamad/ai-innovation-checker/pull/new/develop

## 7. Expected Results

Setelah pipeline selesai pada PR:
- ✅ Build Status Badge: Green/Red based on CI status
- ✅ Quality Gate: Pass/Fail based on code quality
- ✅ Coverage: Percentage dari backend + frontend tests (target: >75%)
- ✅ Code Smells: Jumlah issues yang perlu diperbaiki
- ✅ Frontend Tests: 16/16 passing
- ✅ Backend Coverage: Detailed HTML reports

## Troubleshooting

### Badge tidak muncul:
- Pastikan repository public atau SonarCloud project visible
- Cek nama project key di sonar-project.properties match dengan URL badge
- Tunggu 1-2 menit setelah pipeline selesai untuk badge update

### SonarCloud analysis gagal:
- ✅ **Fixed**: Updated to `sonarqube-scan-action@v5.0.0`
- ✅ **Fixed**: Added `sonar.analysis.mode=publish`
- Pastikan SONAR_TOKEN ada di GitHub Secrets
- Pastikan Automatic Analysis disabled di SonarCloud
- Cek coverage file paths di sonar-project.properties

### "Automatic Analysis" Error:
1. **Disable Automatic Analysis** di SonarCloud project settings
2. **Enable CI-based analysis** 
3. Re-run pipeline
