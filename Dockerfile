from python:3.9-slim-bullseye

COPY app /app
RUN python /app/setup.py install
RUN apt update && apt install -y nginx && rm -rf /var/lib/apt/lists/*

EXPOSE 80/tcp

LABEL version="1.0.1"
# TODO: Add a Volume for persistence across boots
LABEL permissions='\
{\
  "ExposedPorts": {\
    "80/tcp": {},\
    "9000/tcp": {},\
    "9001/tcp": {},\
    "9002/tcp": {},\
    "9003/tcp": {},\
    "9004/tcp": {},\
    "9005/tcp": {}\
  },\
  "HostConfig": {\
    "Binds":["/root/.config:/root/.config"],\
    "PortBindings": {\
      "80/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9000/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9001/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9002/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9003/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9004/tcp": [\
        {\
          "HostPort": ""\
        }\
      ],\
      "9005/tcp": [\
        {\
          "HostPort": ""\
        }\
      ]\
    }\
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
