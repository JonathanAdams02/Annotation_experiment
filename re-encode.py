"""
Re-encode annotated videos to browser-compatible H.264 format
Converts videos in-place (replaces originals)
"""

import os
import subprocess
import glob

# Path to your ffmpeg executable
FFMPEG_PATH = r"C:\GBW_MyPrograms\ffmpeg_right\bin\video_converter.exe"

# Base directory containing all video folders
BASE_DIR = r"C:\Users\u0182754\OneDrive - KU Leuven\SCIVIS\Scraping_test\Youtube_Scraper\Edited videos"

# Find all annotated video files recursively
video_files = []
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith('_Annotated.mp4'):
            video_files.append(os.path.join(root, file))

print(f"Found {len(video_files)} annotated videos to convert")
print()

for i, input_path in enumerate(video_files, 1):
    filename = os.path.basename(input_path)
    temp_path = input_path.replace('.mp4', '_temp_h264.mp4')
    
    print(f"[{i}/{len(video_files)}] Converting: {filename}")
    
    # Build ffmpeg command
    cmd = [
        FFMPEG_PATH,
        '-i', input_path,
        '-c:v', 'libx264',       # H.264 video codec
        '-preset', 'medium',     # Encoding speed/quality balance
        '-crf', '23',            # Quality (lower = better, 18-28 is good range)
        '-c:a', 'aac',           # AAC audio codec
        '-b:a', '128k',          # Audio bitrate
        '-y',                    # Overwrite if exists
        temp_path
    ]
    
    try:
        # Run conversion
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        
        # If successful, replace original with converted version
        os.remove(input_path)
        os.rename(temp_path, input_path)
        
        print("  ✓ Success - Replaced original")
    except subprocess.CalledProcessError as e:
        print(f"  ✗ FFmpeg error:\n{e.stderr}")
        # Clean up temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except FileNotFoundError:
        print("  ✗ Executable not found — check FFMPEG_PATH")
    except Exception as e:
        print(f"  ✗ Unexpected error: {e}")
        # Clean up temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    print()

print("✓ Conversion complete!")
print("All annotated videos have been re-encoded to H.264")
print("You can now re-upload them to Backblaze")