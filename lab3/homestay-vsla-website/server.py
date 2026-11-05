#!/usr/bin/env python3
import os
import re
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class RangeRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def send_head(self):
        if 'Range' not in self.headers:
            return super().send_head()
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        val = self.headers['Range'].strip()
        m = re.match(r'bytes=(\d+)-(\d*)', val)
        if not m:
            return super().send_head()
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1
        if start >= size:
            self.send_error(416, 'Requested Range Not Satisfiable')
            return None
        end = min(end, size - 1)
        length = end - start + 1
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        return f

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

def run(port=8000):
    for p in [port, 8080, 8001, 3000]:
        try:
            server = HTTPServer(('127.0.0.1', p), RangeRequestHandler)
            print(f'Homestay Vsla server started at: http://localhost:{p}')
            sys.stdout.flush()
            server.serve_forever()
            break
        except OSError as e:
            if p == 3000:
                raise e
            continue

if __name__ == '__main__':
    run()

