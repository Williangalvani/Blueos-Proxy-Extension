from python:3.9-slim-bullseye

# Install dependencies for building Nginx
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

COPY app/setup.py /app/setup.py
RUN python /app/setup.py install
COPY app /app
RUN mkdir -p /usr/blueos/userdata/blueos-proxy/
EXPOSE 80/tcp

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
LABEL type="example"
LABEL readme='https://raw.githubusercontent.com/Williangalvani/BlueOS-examples/{tag}/example4-vue-backend/Readme.md'
LABEL links='{\
        "website": "https://github.com/Williangalvani/BlueOS-examples/",\
        "support": "https://github.com/Williangalvani/BlueOS-examples/"\
    }'
LABEL requirements="core >= 1.1"

ENTRYPOINT cd /app && python main.py
