from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

from pathlib import Path


class Encrypt:
    __key_length = 32
    __key_dir = Path("./encrypt/KEY")
    __key_path = __key_dir / "K04211409.bin"

    def generate_key(self):
        key = get_random_bytes(self.__key_length)
        print('key: ', key)

    def store_key(self, key):
        # key has to be saved in .bin file
        self.__key_path.write_bytes(key)
        print(f"key stored in {self.__key_path.absolute()}")


    def reead_key(self):
        return self.__key_path.read_bytes()