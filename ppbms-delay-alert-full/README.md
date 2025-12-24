# PPBMS Delay Alert System

## Features
- Detect delayed milestones
- Email supervisors automatically
- Log alerts for audit

## Setup
- Environment variables:
  SMTP_HOST
  SMTP_PORT
  SMTP_USER
  SMTP_PASS
  SHEET_ID

## Run
- Manual: POST /alerts/run-delay-alert
- Scheduled: run job daily via cron
