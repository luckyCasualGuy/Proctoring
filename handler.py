from os import read
import pathlib
from pandas import DataFrame, read_csv, concat
from pathlib import Path
from time import time

USER_LOGS = Path('user logs')

def data_handler(data: dict, user: int, session_name: str):
    df = DataFrame([data])

    user_path = USER_LOGS / str(user)
    if not user_path.exists(): user_path.mkdir()
    user_path = user_path / str(session_name)
    if not user_path.exists(): user_path.mkdir()

    files = list(user_path.glob('*'))
    print(files)
    csv_file = files[0] if files else None
    print(csv_file)
    if not csv_file:
        temp_csv = f"{int(time())}.csv"
        df.to_csv(user_path/ temp_csv)
    else:
        adf = read_csv(csv_file)
        adf = adf.append(df)
        adf.to_csv(csv_file)
        print(adf)