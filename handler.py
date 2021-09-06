from datetime import time
from weakref import KeyedRef
from numpy import ndarray
from pandas import DataFrame, read_csv
from pathlib import Path
from flask_mysqldb import MySQL
from MySQLdb.cursors import Cursor
from dateutil.parser import parse
from pandas.core.series import Series

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
        'MISSING PERSON START': 'MISSING PERSON END',
        'LOOKING AWAY START': 'LOOKING AWAY END',
        'TAB CHANGE INVISIBLE': 'TAB CHANGE VISIBLE',
        'LOOKING DOWN START': 'LOOKING DOWN END',
        'CLIENT PAGE FOCUS LOST': 'CLIENT PAGE FOCUS GAINED'
    }
        
    weights = {
        'MISSING PERSON START': 5,
        'LOOKING AWAY START': 5,
        'TAB CHANGE INVISIBLE': 5,
        'LOOKING DOWN START': 5,
        'CLIENT PAGE FOCUS LOST': 5,
    }

    single_events = [
        'WINDOWS KEYPRESS DETECTED',
        'ALT KEYPRESS DETECTED',
        'PAGE LEAVE',
        'KEY TRAPS',
        'LEFT MOUSE TRAPS',
        'RIGHT MOUSE TRAPS'
    ]


    def __init__(self, sql_connect: MySQLConnect):
        self.sql_connect = sql_connect
        self.init_stacks()
        self.init_single_events()
        self.init_tresh()


    def thresh(self, value: int, threshold: int): return 100 if (value / threshold) > 1 else (value / threshold) * 100


    def init_tresh(self):
        self.threshold = {
            'MISSING PERSON START': self.penalty_calculate(10, 6*(10**3), 5),
            'LOOKING AWAY START': self.penalty_calculate(10, 6*(10**3), 5),
            'TAB CHANGE INVISIBLE': self.penalty_calculate(10, 6*(10**3), 5),
            'LOOKING DOWN START': self.penalty_calculate(10, 6*(10**3), 5),
            'CLIENT PAGE FOCUS LOST': self.penalty_calculate(10, 6*(10**3), 5),
            'WINDOWS KEYPRESS DETECTED': self.default_threshold(10, 5),
            'ALT KEYPRESS DETECTED':self.default_threshold(10, 5),
            'PAGE LEAVE':self.default_threshold(10, 5),
            'KEY TRAPS':self.default_threshold(10, 5),
            'LEFT MOUSE TRAPS':self.default_threshold(10, 5),
            'RIGHT MOUSE TRAPS':self.default_threshold(10, 5)
        }

    def init_single_events(self):
        self.single_event_functionality = {
            'WINDOWS KEYPRESS DETECTED': self.default_calculate,
            'ALT KEYPRESS DETECTED': self.default_calculate,
            'PAGE LEAVE': self.default_calculate,
            'KEY TRAPS': self.trap,
            'LEFT MOUSE TRAPS': self.trap,
            'RIGHT MOUSE TRAPS': self.trap,
        }

    def key_trap(self, df: DataFrame, cost):
        kd = 0
        lc = 0
        rc = 0
        for key_event in df['event'].values:
            splits = key_event.split("|")
            kd += int(splits[1][1:])
            lc += int(splits[2][1:])
            rc += int(splits[3][1:])

        return (kd + lc + rc) * cost * 250

    def trap(self, df: DataFrame, cost):
        kd = 0
        for key_event in df['event'].values:
            splits = key_event.split("|")
            kd += int(splits[1][1:])

        return kd  * cost * 250


    def default_calculate(self, df: DataFrame, cost): return len(df) * cost * 250
    def default_threshold(self, length, cost): return length * cost * 250

    def init_stacks(self):
        self.stacks = {}
        for key in self.opposite_pairs.keys():
            self.stacks[key] = []


    def penalty_calculate(self, times, total, cost):
        return cost * (times + (total * 0.01) + ((times / total) * 0.01))

    def penalty(self, array_in_sec, cost):
        x = array_in_sec
        len_x = len(x)

        if not len_x: return 0
        total_time = sum(x)
    
        return self.penalty_calculate(len_x, total_time, cost)


    def event_wise_calculate(self, df: DataFrame, cost: int) -> dict:
        '''
        penalties for that part
        '''
        penalties_type_1 = {}
        for key, value in self.opposite_pairs.items():
            time_values = df[df['event'].isin([key, value])]['timestamp'].values
            event_start_time, event_stop_time = time_values[::2], time_values[1::2]

            assert(event_start_time.shape == event_stop_time.shape)

            time_delta: ndarray = event_stop_time - event_start_time
            time_delta = time_delta.astype('timedelta64[ms]').astype('int64')

            penalties_type_1[key] = self.thresh(self.penalty(time_delta, self.weights[key]), self.threshold[key])

        set_nan = False
        penalties_type_2 = {}
        for key, value in self.single_event_functionality.items():
            pdf = df[df['event'] == key]
            if pdf.empty:
                pdf = df[df['event'].str.startswith(key)]
                if pdf.empty: set_nan = True

            val = value(pdf, 5) if not set_nan else 0
            penalties_type_2[key] = self.thresh(val, self.threshold[key])

            set_nan = False

        return penalties_type_1, penalties_type_2

    def calculate_overall(self, penalties_1, penalties_2):
        # wt needs to add upto 100
        # item -> [value, wt]
        condition_wt_format = {
            #average -> 100
            "average": [self.calc_average(penalties_1, penalties_2), 100],
        }

        return self.calc_score(condition_wt_format)
    
    def calc_score(self, format):
        score = 0
        for item in format.values():
            score += item[0] * (item[1]/100)
        return score

    def calc_average(self, penalties_1, penalties_2):
        tot = 0
        for i in [penalties_1, penalties_2]:
            tot += sum(i.values())
        return tot/(len(penalties_1) + len(penalties_2))

    def calculate_score(self, session_name, cost):
        roll_nos = self.sql_connect.roll_list_for_session(session_name)
        student_penalties = {}

        for i, roll_no in enumerate(roll_nos, 1):
            df = self.sql_connect.get_data_roll_no(session_name, roll_no)
            self.pre_process_database(df)
            penalties_1, penalties_2 = self.event_wise_calculate(df.copy(), cost)
            overall = self.calculate_overall(penalties_1, penalties_2)
            student_penalties[roll_no] = {
                'index': i,
                'type 1': penalties_1,
                'type 2': penalties_2,
                'overall': overall,
            }

        return student_penalties


    def pre_process_database(self, db: DataFrame):
        db['timestamp'] = db['timestamp'].map(lambda x: parse(x))