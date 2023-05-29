# Base image
FROM node:18


LABEL version="0.0.1"
# TODO: Add a Volume for persistence across boots
LABEL permissions='\
{\
    "NetworkMode":"host",\
    "HostConfig":{\
        "Privileged": true,\
        "NetworkMode":"host"\
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
LABEL readme='https://raw.githubusercontent.com/Williangalvani/Blueos-Proxy-Extension/{tag}/readme.md'
LABEL links='{\
        "website": "https://github.com/Williangalvani/Blueos-Proxy-Extension/",\
        "support": "https://github.com/Williangalvani/Blueos-Proxy-Extension/"\
    }'
LABEL requirements="core >= 1.1"

# Set working directory
WORKDIR /app

# Copy proxy.js file
COPY /app /app

# Run the proxy server
CMD [ "node", "index.js" ]