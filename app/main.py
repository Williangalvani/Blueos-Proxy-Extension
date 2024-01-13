#! /usr/bin/env python3
from pathlib import Path

import appdirs
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse, FileResponse
from fastapi_versioning import VersionedFastAPI, version
from loguru import logger
import time
import json
from typing import Any, List


from pydantic import BaseModel
import subprocess
from pathlib import Path

import signal
import subprocess
import sys



class Item(BaseModel):
    name: str
    url: str
    sidebar: bool

class ItemList(BaseModel):
    data: List[Item]

class NginxManager:
  base_port = 9000
  def __init__(self):
    self.process = None

  def start(self, servers: ItemList):
    config_file = Path("nginx.conf").resolve()
    with open(config_file, "w") as f:
      f.write("events {}\n")  # Add this line
      f.write("http {")
      for i, server in enumerate(servers):
        f.write(f"""
        server {{
          listen {self.base_port + i};
          server_name {server.name};
          location / {{
            proxy_pass {server.url};
          }}
        }}
        """)
        if server.sidebar:
          register_service = f"""
          {{
              "name":"{server.name}",
              "description":"Example Extension",
              "icon":"mdi-clock-fast",
              "company":"Blue Robotics",
              "version":"1.0.0",
              "webpage":"https://example.com",
              "api":""
          }}
          """
          f.write(f"""
          location /register_service {{
            return 200 {register_service};
          }}
          """)
      f.write("}")

    if self.process is None:
      self.process = subprocess.Popen(["nginx", "-c", config_file])

  def stop(self):
    if self.process is not None:
      self.process.terminate()
      self.process.wait()
      time.sleep(2)
      self.process = None


nginx = NginxManager()

def signal_handler(sig, frame):
    print('Signal caught, stopping Nginx server...')
    nginx.stop()  # send SIGTERM
    sys.exit(0)

# Register signal handler for SIGINT and SIGTERM
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)



SERVICE_NAME = "ExampleExtension4"
# logger.add(get_new_log_path(SERVICE_NAME))

app = FastAPI(
    title="Example Extension 4 API",
    description="API for an example extension that saves/loads data as files.",
)

servers = []

# We always use the same file, for simplicity
user_config_dir = Path(appdirs.user_config_dir())
text_file = user_config_dir / "file.txt"

if text_file.exists():
  try:
    with open(text_file, "r") as f:
      data = f.read()
      servers = ItemList.parse_raw(data).data
  except json.decoder.JSONDecodeError:
    logger.warning(f"File {text_file} is not a valid JSON file!")
    # delete file
    text_file.unlink()
print(servers)
nginx.start(servers)

logger.info(f"Starting {SERVICE_NAME}!")
logger.info(f"Text file in use: {text_file}")

@app.post("/save", status_code=status.HTTP_200_OK)
@version(1, 0)
async def save_data(data: ItemList) -> Any:
    nginx.stop()
    print(data.data)
    nginx.start(data.data)
    with open(text_file, "w") as f:
        servers = [json.loads(item.model_dump_json()) for item in data.data]
        f.write(json.dumps(servers))

@app.get("/load", status_code=status.HTTP_200_OK)
@version(1, 0)
async def load_data() -> Any:
    data = []
    if text_file.exists():
        try:
          with open(text_file, "r") as f:
              global servers
              servers = json.loads(f.read())
              data = servers
        except Exception as e:
            print(e)
    return data

app = VersionedFastAPI(app, version="1.0.0", prefix_format="/v{major}.{minor}", enable_latest=True)

app.mount("/", StaticFiles(directory="static",html = True), name="static")

@app.get("/", response_class=FileResponse)
async def root() -> Any:
        return "index.html"

if __name__ == "__main__":
    # Running uvicorn with log disabled so loguru can handle it
    uvicorn.run(app, host="0.0.0.0", port=80, log_config=None)
