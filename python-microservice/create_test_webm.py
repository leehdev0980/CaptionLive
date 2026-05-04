import wave
import struct
import subprocess

# 1. Generate a 3-second sawtooth wave at 440 Hz (A4 note)
sample_rate = 16000   # samples per second
duration = 3          # seconds
frequency = 440       # Hz
amplitude = 0.3 * 32767  # 30% of max 16-bit value

samples = []
for i in range(sample_rate * duration):
    # Simple sawtooth: ramps from -1 to +1 each cycle
    value = int(amplitude * ((i * frequency / sample_rate) % 1.0 * 2 - 1))
    samples.append(struct.pack('<h', value))

# 2. Write the raw audio as a temporary WAV file
with wave.open('temp_test.wav', 'w') as wav_file:
    wav_file.setnchannels(1)          # mono
    wav_file.setsampwidth(2)          # 16-bit
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(b''.join(samples))

# 3. Convert WAV to WebM using ffmpeg (the same tool pydub would call)
subprocess.run([
    'ffmpeg',
    '-i', 'temp_test.wav',
    '-c:a', 'libopus',   # Opus codec (standard for WebM)
    'test.webm',
    '-y'                  # overwrite without asking
], check=True)

print("Created synthetic test.webm")