from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

from pathlib import Path


class Encrypt:
    __key_length = 32
    __key_dir = Path("./encrypt/KEY")
    __key_path = __key_dir / "K04211409.bin"
    __encryption_dir = Path('./encrypt/encyptions')

    def generate_key(self):
        key = get_random_bytes(self.__key_length)
        print('key: ', key)

    def store_key(self, key):
        # key has to be saved in .bin file
        self.__key_path.write_bytes(key)
        print(f"key stored in {self.__key_path.absolute()}")

    def read_key(self): return self.__key_path.read_bytes()

    def encrypt(self, key, data):
        cipher = AES.new(key, AES.MODE_EAX)
        ciphered_data, tag = cipher.encrypt_and_digest(data)
        return cipher.nonce, tag, ciphered_data

    def decrypt(self, key, nonce, tag, data):
        cipher = AES.new(key, AES.MODE_EAX, nonce)
        return cipher.decrypt_and_verify(data, tag)

    def save(self, roll_no, session, nonce, tag, data):
        en_path = self.__encryption_dir / session / roll_no
        file_out = open(en_path, "wb")
        file_out.write(nonce) # Write the nonce to the output file (will be required for decryption - fixed size)
        file_out.write(tag) # Write the tag out after (will be required for decryption - fixed size)
        file_out.write(data)
        file_out.close()