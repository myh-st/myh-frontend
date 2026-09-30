import http.server, os, sys, socketserver
root, port = sys.argv[1], int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
    def log_message(self, *a): pass
    def send_head(self):
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(path) or (os.path.isdir(path) and not os.path.exists(os.path.join(path, 'index.html'))):
            self.path = '/index.html'
        return super().send_head()
socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', port), H) as s:
    print('Local ready', flush=True); s.serve_forever()
