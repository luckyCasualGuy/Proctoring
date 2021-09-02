from numpy import ndarray
from pandas import DataFrame, read_csv
from pathlib import Path
from flask_mysqldb import MySQL
from MySQLdb.cursors import Cursor
from dateutil.parser import parse

USER_LOGS = Path('user logs')


class MySQLConnect:
    def __init__(self, flask_app) -> None:
        self.app = flask_app
        self.mysql = MySQL(self.app)


    def log_to_db(self, data):
        cursor = self.mysql.connection.cursor()
        cursor.execute(f"INSERT INTO logs (roll_no, session_name, event, timestamp) VALUES ({data['roll_no']}, '{data['session']}', '{data['event']}', '{data['timestamp']}');")
        self.mysql.connection.commit()


    def get_data_roll_no(self, session, roll_no):
        cursor: Cursor = self.mysql.connection.cursor()
        cursor.execute(f"SELECT * FROM logs WHERE session_name='{session}' AND roll_no='{roll_no}' ORDER BY log_id ASC")
        logs = cursor.fetchall()
        self.mysql.connection.commit()

        df = DataFrame(logs, columns=['index', 'roll_no', 'session', 'event', 'timestamp'])
        return df.iloc[:, 1:]

    def roll_list_for_session(self, session) -> ndarray:
        """
        ndarray containing roll_no as str
        """

        cursor: Cursor = self.mysql.connection.cursor()
        cursor.execute(f"SELECT DISTINCT roll_no FROM logs WHERE session_name='{session}'")
        logs = cursor.fetchall()
        self.mysql.connection.commit()

        df = DataFrame(logs, columns=['roll_no'])
        return df['roll_no'].values


class CalculateResult:
    opposite_pairs = {
        'LOOKING AWAY': 'NEUTRAL',
        'TAB CHANGE INVISIBLE': 'TAB CHANGE VISIBLE'
    }

    def __init__(self, sql_connect: MySQLConnect):
        self.sql_connect = sql_connect
        self.init_stacks()

    def init_stacks(self):
        self.stacks = {}
        for key in self.opposite_pairs.keys():
            self.stacks[key] = []

    def penalty(self, array_in_sec, cost):
        x = array_in_sec
        len_x = len(x)
        
        if not len_x: return 'NAN'

        total_time = sum(x)
    
        return cost * (len_x + (total_time * 0.01) + ((len_x / total_time) * 0.01))

    def event_wise_calculate(self, df: DataFrame, cost: int) -> dict:
        '''
        penalties for that part
        '''
        penalties = {}
        for key, value in self.opposite_pairs.items():
            time_values = df[df['event'].isin([key, value])]['timestamp'].values
            event_start_time, event_stop_time = time_values[::2], time_values[1::2]

            assert(event_start_time.shape == event_stop_time.shape)

            time_delta: ndarray = event_stop_time - event_start_time
            time_delta = time_delta.astype('timedelta64[ms]').astype('int64')


            penalties[key] = self.penalty(time_delta, cost)

        return penalties

    def calculate_score(self, session_name, cost):
        roll_nos = self.sql_connect.roll_list_for_session(session_name)
        student_penalties = {}

        for roll_no in roll_nos:
            df = self.sql_connect.get_data_roll_no(session_name, roll_no)
            self.pre_process_database(df)
            penalties = self.event_wise_calculate(df.copy(), cost)

            student_penalties[roll_no] = penalties

        return student_penalties


    def pre_process_database(self, db: DataFrame):
        db['timestamp'] = db['timestamp'].map(lambda x: parse(x))