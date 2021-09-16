import re
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

from pathlib import Path
import random
import string

from chardet.universaldetector import UniversalDetector
from numpy.core.numeric import roll
from handler import MySQLConnect

class Tokenizer:

    def __init__(self, sql: MySQLConnect) -> None:
        self.sql = sql
    
    def generate_token(self): return ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(28))

    def set_roll_no(self, session_name, roll_no):
        if self.check_if_roll_no_exists(session_name, roll_no):
            return 0

        token = self.generate_token()
        self.sql.log_token(session_name, roll_no, token)

        return token

    def check_if_roll_no_exists(self, session_name, roll_no):
        token = self.sql.get_token_for_roll_no(session_name, roll_no)
        if token: return token[0]

        return None


    def get_roll_no_for_token(self, session_name, token):
        roll_no = self.sql.get_roll_no_for_token(session_name, token)
        print('##', roll_no)

class Encrypt:
    __key_length = 32
    __key_dir = Path("./encrypt/KEY")
    __key_path = __key_dir / "K04211409.bin"
    __encryption_dir = Path('./encrypt/encryptions')

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
        self.__encryption_dir.mkdir(exist_ok=True)
        en_path = self.__encryption_dir / session
        
        token = self.generate_token()
        
        en_path.mkdir(exist_ok=True)
        en_path = self.__encryption_dir / session / (roll_no + '-' + token + '.bin')

        file_out = open(en_path, "wb")
        file_out.write(nonce)
        file_out.write(tag)
        file_out.write(data)
        file_out.close()

        return token

    def retreive(self, token, roll_no, session):
        input_file = self.__encryption_dir / session / (roll_no + '-' + token + '.bin')
        if not input_file.exists(): return 0
        key = self.read_key()

        file_in = open(input_file, 'rb')
        iv = file_in.read(16)
        tag = file_in.read(16)
        ciphered_data = file_in.read()
        file_in.close()

        return iv, tag, ciphered_data

    def check_if_roll_no_exists(self, roll_no, session):
        all_saves = (self.__encryption_dir / session).glob('*.bin')
        for bin in all_saves:
            if bin.name.startswith(roll_no): return True
        else: return False

    def detect_encryption(self, data):
        detector = UniversalDetector()
        detector.feed(data)
        detector.close()
        return detector.result

    def generate_token(self):
        output_string = ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(28))
        print(output_string)
        return output_string


    def client_encrypt(self, roll_no, session):
        if not self.check_if_roll_no_exists(roll_no, session):
            key = self.read_key()
            data = roll_no.encode('utf-8')
            nonce, tag, ciphered_data = self.encrypt(key, data)
            token = self.save(roll_no, session, nonce, tag, ciphered_data)
            detected = self.detect_encryption(ciphered_data)
            return ciphered_data.decode(detected['encoding']), token
        
        return 0
