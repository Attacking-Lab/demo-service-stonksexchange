import multiprocessing
import os

worker_class = "uvicorn.workers.UvicornWorker"
workers = min(4, multiprocessing.cpu_count())
bind = f"0.0.0.0:{os.environ.get('CHECKER_PORT', '8000')}"
timeout = 90
