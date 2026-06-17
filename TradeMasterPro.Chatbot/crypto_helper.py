import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")

def decrypt_credentials(cipher_text: str) -> str:
    if not cipher_text:
        return ""
        
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET environment variable is missing for decryption.")
        
    try:
        # 1. Hash the secret key to 32 bytes (same as C# SHA256)
        key_bytes = hashlib.sha256(JWT_SECRET.encode('utf-8')).digest()
        
        # 2. Base64 decode
        full_cipher = base64.b64decode(cipher_text)
        
        if len(full_cipher) < 16:
            return ""

        # 3. Extract IV (first 16 bytes) and ciphertext
        iv = full_cipher[:16]
        ciphertext = full_cipher[16:]
        
        # 4. Decrypt via AES-256 CBC
        cipher = Cipher(algorithms.AES(key_bytes), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        decrypted = decryptor.update(ciphertext) + decryptor.finalize()
        
        # 5. Remove PKCS7 padding
        padding_len = decrypted[-1]
        if padding_len < 1 or padding_len > 16:
            return decrypted.decode('utf-8', errors='ignore')
            
        return decrypted[:-padding_len].decode('utf-8')
        
    except Exception as e:
        print(f"Decryption Exception: {e}")
        return ""
