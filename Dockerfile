from python:3.9-slim-bullseye

# Install dependencies for building Nginx
RUN apt-get update && apt-get install -y \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    zlib1g-dev \
    libssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set the version of Nginx and the Headers More module
ARG NGINX_VERSION=1.21.3
ARG HEADERS_MORE_VERSION=0.33
ARG SUB_FILTER_VERSION=0.6.4

# Download and extract the source code for Nginx and the Headers More module
RUN wget "http://nginx.org/download/nginx-$NGINX_VERSION.tar.gz" \
    && tar -xzf "nginx-$NGINX_VERSION.tar.gz" \
    && rm "nginx-$NGINX_VERSION.tar.gz" \
    && wget "https://github.com/openresty/headers-more-nginx-module/archive/v$HEADERS_MORE_VERSION.tar.gz" \
    && tar -xzf "v$HEADERS_MORE_VERSION.tar.gz" \
    && rm "v$HEADERS_MORE_VERSION.tar.gz" \
  && wget "https://github.com/yaoweibin/ngx_http_substitutions_filter_module/archive/v$SUB_FILTER_VERSION.tar.gz" \
  && tar -xzf "v$SUB_FILTER_VERSION.tar.gz" \
  && rm "v$SUB_FILTER_VERSION.tar.gz"

# Compile and install Nginx with the Headers More and Sub Filter modules
RUN cd "nginx-$NGINX_VERSION" \
  && ./configure --add-module="../headers-more-nginx-module-$HEADERS_MORE_VERSION" \
           --add-module="../ngx_http_substitutions_filter_module-$SUB_FILTER_VERSION" \
  && make \
  && make install


COPY app/setup.py /app/setup.py
RUN python /app/setup.py install
COPY app /app
RUN mkdir -p /usr/blueos/userdata/blueos-proxy/
EXPOSE 80/tcp

LABEL version="1.0.1"
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
