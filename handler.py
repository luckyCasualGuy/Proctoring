from datetime import time, datetime
from os import stat
from weakref import KeyedRef
from numpy import ndarray, mean, array, append, mean, isnan
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
    
    def log_image_db(self, data):
        cursor = self.mysql.connection.cursor()
        cursor.execute(f"INSERT INTO images (roll_no, session_name, image, timestamp) VALUES ({data['roll_no']}, '{data['session']}', '{data['image']}', '{data['timestamp']}');")
        self.mysql.connection.commit()

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
            'PAGE LEAVE': self.page_leave,
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
    def page_leave(self, df: DataFrame, cost): return (len(df) - 1) * cost * 250
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



class DataPreprocess:
    __RESULT = {
        'OOP': 'Not Set',
        'roll list': 'Not Set',
        'event summary': {},
        'senario result': {}
    }

    __OPP = {
        "missing for": {
            'type': 'interval',
            'required': [('MISSING PERSON START', 'MISSING PERSON END'), (10, 6*(10**3), 5)],
            'results': {},
        },
        "looking away": {
            'type': 'interval',
            'required': [('LOOKING AWAY START', 'LOOKING AWAY END'), (10, 6*(10**3), 5)],
            'results': {},
        },
        "tab changed": {
            'type': 'interval',
            'required': [('TAB CHANGE INVISIBLE', 'TAB CHANGE VISIBLE'), (10, 6*(10**3), 5)],
            'results': {},
        },
        "looking down": {
            'type': 'interval',
            'required': [('LOOKING DOWN START', 'LOOKING DOWN END'), (10, 6*(10**3), 5)],
            'results': {},
        },
        "client lost focus": {
            'type': 'interval',
            'required': [('CLIENT PAGE FOCUS LOST', 'CLIENT PAGE FOCUS GAINED'), (10, 6*(10**3), 5)],
            'results': {},
        },
        "Alt key press": {
            'type': 'keypress',
            'required': [('ALT KEYPRESS DETECTED',), (10, 1, 5)],
            'results': {},
        },
        "Windows key press": {
            'type': 'keypress',
            'required': [('WINDOWS KEYPRESS DETECTED',),  (10, 1, 5)],
            'results': {},
        },
        "Copy": {
            'type': 'keypress',
            'required': [('CUT DETECTED', 'COPY DETECTED'),  (10, 1, 5)],
            'results': {},
        },
        "Paste": {
            'type': 'keypress',
            'required': [('PASTE DETECTED',),  (10, 1, 5)],
            'results': {},
        },
        "Key press": {
            'type': 'keysummary',
            'required': [('ALL KEY TRAPS',), (10, 1, 5)],
            'results': {},
        },
        "Left click": {
            'type': 'keypress',
            'required': [('LOOKING DOWN START',), (10, 1, 5)],
            'results': {},
        },
        "Right click": {
            'type': 'keypress',
            'required': [('LOOKING DOWN START',), (10, 1, 5)],
            'results': {},
        },
        "Page leave": {
            'type': 'end',
            'required': [('PAGE LEAVE',), (2, 0, 5)],
            'results': {},
        },
    }


    __SENARIOS = [
        {
            'name': 'Moving from seat',
            'required': ['missing for'],
            'type': 'overall thresholding'
        },
        {
            'name': 'Copying/Googleing',
            'required': ['Copy', 'tab changed', 'client lost focus', 'Paste'],
            'type': 'overall thresholding'
        },
        {
            'name': 'Reading from notes',
            'required': ['looking down'],
            'type': 'overall thresholding'
        },
        {
            'name': 'Taking help',
            'required': ['looking away'],
            'type': 'overall thresholding'
        },
    ]


    def __init__(self, DB: MySQLConnect) -> None:
        self.DB = DB
        
    def __init_cost(self, cost: dict):
        if set(self.__get_all_event_list()) == set(cost.keys()):
            self.__RESULT['COSTING'] = cost
        else:
            raise ValueError(f"SET EVENTS -> {self.__get_all_event_list()}")

    def __main_loop(self, session_name) -> None:
        roll_list = self.DB.roll_list_for_session(session_name)
        self.__RESULT['roll list'] = [str(n) for n in roll_list]
        
        for i, roll_no in enumerate(roll_list, 1):
        
            df = self.DB.get_data_roll_no(session_name, roll_no)
            df['timestamp'] = df['timestamp'].map(lambda x: parse(x))

            for condition, params in self.__OPP.items():
                results = {}
                required = params['required']
                type_ = params['type']
                thresh = required[1]

                if type_ == 'interval':
                    pairs = required[0]
                    
                    time_values = df[df['event'].isin(pairs)]['timestamp'].values
                    event_start_time, event_stop_time = time_values[::2], time_values[1::2]

                    time_delta: ndarray = event_stop_time - event_start_time
                    time_delta = time_delta.astype('timedelta64[ms]').astype('int64')

                    checker = time_delta

                    # result generation
                    results['start time'] = [str(n) for n in event_start_time]
                    results['happened for'] = [int(n) for n in time_delta]
                    results['total time'] = int(sum(time_delta))
                    results['total times happened'] = int(len(time_delta))
                    results['happened'] = True if results['start time'] else False

                elif type_ == 'keypress':
                    time_values = df[df['event'].isin(required[0])]['timestamp'].values

                    results['start time'] = [str(n) for n in time_values]
                    results['happened for'] = []
                    results['total time'] = 0
                    results['total times happened'] = int(len(time_values))
                    results['happened'] = True if results['start time'] else False

                    checker = time_values

                elif type_ == 'keysummary':
                    event_values = df[df['event'].str.startswith(required[0][0])]['event'].values
                    time_values = df[df['event'].str.startswith(required[0][0])]['timestamp'].values
                    
                    total_key_press = 0
                    for key_event in event_values:
                        splits = key_event.split("|")
                        total_key_press += int(splits[1][1:])

                    results['start time'] = [str(n) for n in time_values]
                    results['happened for'] = []
                    results['total time'] = 0
                    results['total times happened'] = total_key_press
                    results['happened'] = True if total_key_press else False
                    
                    checker = time_values

                elif type_ == 'end':
                    time_values = df[df['event'].isin(required[0])]['timestamp'].values
                    results['start time'] = [str(n) for n in time_values]
                    results['happened for'] = []
                    results['total time'] = 0
                    results['total times happened'] = int(len(time_values))
                    results['happened'] = True if results['total times happened'] > 1 else False
                    
                    checker = time_values


                else: continue

                results['penalty'] = self.penalty(results['total times happened'], results['total time'], self.__RESULT['COSTING'][condition]) if results["happened"] else 0
                results['over all'] = self.thresh(results['penalty'], thresh)

                #overall calculations
                if condition not in self.__RESULT['event summary']: self.__RESULT['event summary'][condition] = {}

                if 'avg' not in self.__RESULT['event summary'][condition]: self.__RESULT['event summary'][condition]['avg'] = array([])
                self.__RESULT['event summary'][condition]['avg'] = append(self.__RESULT['event summary'][condition]['avg'], len(checker))

                if 'total' not in self.__RESULT['event summary'][condition]: self.__RESULT['event summary'][condition]['total'] = array([])
                self.__RESULT['event summary'][condition]['total'] = append(self.__RESULT['event summary'][condition]['total'], len(checker))

                if 'total_time' not in self.__RESULT['event summary'][condition]: self.__RESULT['event summary'][condition]['total_time'] = array([])
                self.__RESULT['event summary'][condition]['total_time'] = append(self.__RESULT['event summary'][condition]['total_time'], sum(checker) if (checker.dtype == 'float64') or (checker.dtype == 'int64') or (checker.dtype == 'int32') else 0)
                
                if 'over all avg' not in self.__RESULT['event summary'][condition]: self.__RESULT['event summary'][condition]['over all avg'] = array([])
                self.__RESULT['event summary'][condition]['over all avg'] = append(self.__RESULT['event summary'][condition]['over all avg'], results['over all'])
                
                if 'penalty avg' not in self.__RESULT['event summary'][condition]: self.__RESULT['event summary'][condition]['penalty avg'] = array([])
                self.__RESULT['event summary'][condition]['penalty avg'] = append(self.__RESULT['event summary'][condition]['penalty avg'], results['penalty'])


                # SCORE
                self.__OPP[condition]['results'][roll_no] = results


        # refining event summary
        for event, summary in self.__RESULT['event summary'].items():
            for operation, value in summary.items():
                if operation == 'avg': self.__RESULT['event summary'][event]['avg'] = 0 if isnan(mean(value)) else float(mean(value))

                if operation == 'total': self.__RESULT['event summary'][event]['total'] = 0 if isnan(sum(value)) else int(sum(value))

                if operation == 'total_time': self.__RESULT['event summary'][event]['total_time'] = 0 if isnan(sum(value)) else int(sum(value))

                if operation == 'over all avg': self.__RESULT['event summary'][event]['over all avg'] = 0 if isnan(mean(value)) else float(mean(value))
                
                if operation == 'penalty avg': self.__RESULT['event summary'][event]['penalty avg'] = 0 if isnan(mean(value)) else float(mean(value))


    def generate_results(self, session_name, cost):
        self.__init_cost(cost)
        self.__main_loop(session_name)
        self.__RESULT['OOP'] = self.__OPP
        self.__RESULT['EVENT_LIST'] = self.__get_all_event_list()
        self.check_senarios()
        self.__RESULT['SENARIO_LIST'] = {senario['name']:{'required': senario['required']} for senario in self.__SENARIOS}
        return self.__RESULT
                    
    
    def __get_all_event_list(self): return list(self.__OPP.keys())

    
    def penalty(self, times, total, cost):
        total = total if total else 1
        return cost * (times + (total * 0.01) + ((times / total) * 0.01))


    def thresh(self, penalty, thresh_params):
        limit = self.penalty(*thresh_params)
        return 100 if (penalty / limit) > 1 else (penalty / limit) * 100

    def get_results(self): return self.__OPP


    def check_senarios(self):
            for roll_no in self.__RESULT['roll list']:
                senario_result = {}
                count = 0
                for senario in self.__SENARIOS:
                    senario_result[senario['name']] = {}
                    
                    if senario['type'] == 'overall thresholding':
                        thresh_columns = senario['required']
                        
                        status = False
                        for event in thresh_columns:
                            overall = self.__OPP[event]['results'][roll_no]['over all']
                            if overall == 100 and not status: status = True

                            if status:
                                count += 1 
                            else:
                                count = 0
                                break

                        senario_result[senario['name']]['status'] = status


                self.__RESULT['senario result'][roll_no] = senario_result
                self.__RESULT['senario result'][roll_no]['total'] = count