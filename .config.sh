#!/bin/bash
config="
format: js
project:
  name: ${CI_PROJECT_NAME}
  description: ${CI_PROJECT_TITLE}
  id: ${CI_PROJECT_ID}
itemFormat: project_without_dot
configs:
  gitlab-config-server:
    - domain
  gitlab-config-web:
    - testkey
branch: ${CI_COMMIT_REF_NAME}
"
curl "${CONFIG_SERVER}" -fd "$config"