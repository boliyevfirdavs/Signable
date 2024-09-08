#!/bin/sh
set -e
gunicorn main:app --log-file -