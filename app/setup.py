#!/usr/bin/env python3

import os

from setuptools import setup

setup(
    name="Blueos Proxy Extension",
    version="1.0.2",
    description="BlueOS Proxy Extension",
    license="MIT",
    install_requires=[
        "appdirs == 1.4.4",
        "fastapi == 0.109.0",
        "fastapi-versioning == 0.10.0",
        "loguru == 0.5.3",
        "uvicorn == 0.25.0",
        "starlette==0.35.1",
        "aiofiles==0.8.0",
    ],
)
