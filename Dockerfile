from python:3.11-slim-bullseye

# Install dependencies for building Nginx
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

COPY app/setup.py /app/setup.py
RUN python /app/setup.py install
COPY app /app
RUN mkdir -p /usr/blueos/userdata/blueos-proxy/

LABEL version="1.0.0"
# TODO: Add a Volume for persistence across boots
LABEL permissions='\
{\
  "ExposedPorts": {},\
  "HostConfig": {\
    "Binds":["/usr/blueos/userdata/blueos-proxy/:/usr/blueos/userdata/blueos-proxy/"],\
    "NetworkMode": "host"\
  }\
}'
LABEL authors='[\
    {\
        "name": "Willian Galvani",\
        "email": "willian@bluerobotics.com"\
    }\
]'
LABEL company='{\
        "about": "",\
        "name": "Blue Robotics",\
        "email": "support@bluerobotics.com"\
    }'
LABEL type="tool"
LABEL readme='https://raw.githubusercontent.com/Williangalvani/Blueos-Proxy-Extension/{tag}/Readme.md'
LABEL links='{\
        "website": "https://github.com/Williangalvani/Blueos-Proxy-Extension",\
        "support": "https://github.com/Williangalvani/Blueos-Proxy-Extension"\
    }'
LABEL requirements="core >= 1.1"

ENTRYPOINT cd /app && python main.py
