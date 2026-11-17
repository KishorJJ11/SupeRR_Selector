import zipfile
import os
import shutil

# Files and directories to package in zip (excluding node_modules, dist, .git, scratch)
include_files = [
    'index.html',
    'metadata.json',
    'METHODOLOGY_REPORT.md',
    'package-lock.json',
    'package.json',
    'README.md',
    'server.ts',
    'tsconfig.json',
    'vite.config.ts'
]

include_dirs = [
    'dataset',
    'ml_model',
    'public/assets',
    'scripts',
    'src'
]

output_zip = 'public/superr-selector-codebase.zip'

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in include_files:
        if os.path.exists(f):
            z.write(f, f)
    for d in include_dirs:
        for root, dirs, files in os.walk(d):
            # Exclude __pycache__
            if '__pycache__' in root:
                continue
            for file in files:
                filepath = os.path.join(root, file)
                arcname = filepath.replace('\\', '/')
                z.write(filepath, arcname)

print(f"Successfully packaged {output_zip} (size: {os.path.getsize(output_zip)} bytes)")
if os.path.exists('dist'):
    shutil.copyfile(output_zip, 'dist/superr-selector-codebase.zip')
    print("Copied to dist/superr-selector-codebase.zip")
