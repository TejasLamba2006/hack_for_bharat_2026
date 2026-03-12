#!/bin/bash
set -e
git fetch origin master
git merge origin/master --no-edit
echo "Successfully pulled from master"
