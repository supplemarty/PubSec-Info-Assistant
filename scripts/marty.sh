# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

#!/bin/bash
set -e

figlet Marty Test

# Get the directory that this script is in - move to tests dir
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
pushd "$DIR/../tests" > /dev/null

# Get env vars for workspace from Terraform outputs
source "${DIR}/environments/infrastructure.env"
source "${DIR}/load-env.sh"

# Install requirements
pip install -r requirements.txt --disable-pip-version-check -q

BASE_PATH=$(realpath "$DIR/..")

# Marty tests
python marty.py 