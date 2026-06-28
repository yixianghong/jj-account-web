#!/bin/bash

# 安裝 Cloud Functions 依賴
cd functions && npm install && cd ..

# 建置專案
npm run generate

# 部署到 Firebase（hosting + functions + firestore 安全規則）
firebase deploy --only hosting,functions,firestore:rules --force --project jj-account