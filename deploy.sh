#!/bin/bash

# 建置專案
npm run generate

# 部署到 Firebase
firebase deploy --only hosting --force