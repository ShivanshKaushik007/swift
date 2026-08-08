# ARCHITECTURE.md

Version: 1.0

Project: Swift Workspace

---

# Architecture Philosophy

Swift Workspace is designed as a production-grade full-stack application.

Every architectural decision should prioritize:

- Scalability
- Maintainability
- Security
- Testability
- Performance
- Readability

The architecture should support future expansion without major rewrites.

---

# High-Level System Architecture

                    Browser
                       │
             React + TypeScript
                       │
                API + Socket.IO
                       │
             Express + TypeScript
               │               │
           REST API      WebSocket Server
               │               │
          Service Layer   Socket Layer
               │               │
         Repository Layer
               │
     MongoDB + Redis
               │
     Cloudinary / Local Storage

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Shadcn UI
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Framer Motion

## Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- MongoDB
- Redis
- JWT
- Multer

## Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- Nginx

---

# Backend Folder Structure

backend/

src/

config/

controllers/

services/

repositories/

routes/

middleware/

validators/

models/

socket/

utils/

types/

constants/

jobs/

docs/

tests/

app.ts

server.ts

---

# Frontend Folder Structure

frontend/

src/

app/

pages/

features/

components/

hooks/

services/

store/

types/

utils/

constants/

assets/

layouts/

providers/

routes/

styles/

tests/

---

# Feature Structure

Each feature should contain:

feature/

components/

hooks/

services/

types/

utils/

index.ts

---

# Layer Responsibilities

## Controller

Responsibilities

- Validate input
- Call service
- Return response

Must NOT

- Access database
- Contain business logic

---

## Service

Responsibilities

- Business logic
- Validation
- Authorization
- Data transformation

Must NOT

- Handle HTTP
- Query database directly

---

## Repository

Responsibilities

- Database queries
- Aggregation
- Transactions

Must NOT

- Contain business logic

---

## Middleware

Examples

Authentication

Authorization

Validation

Logging

Error Handling

Rate Limiting

---

# API Design

Use REST.

Version APIs.

Example

/api/v1/auth

/api/v1/users

/api/v1/channels

/api/v1/messages

/api/v1/workspaces

/api/v1/files

/api/v1/search

---

# API Response Format

Success

{
  success: true,
  message: "",
  data: {}
}

Error

{
  success: false,
  message: "",
  error: {}
}

Maintain consistent responses.

---

# Authentication Flow

User Login

↓

Validate Credentials

↓

Generate Access Token

↓

Generate Refresh Token

↓

Store Refresh Token

↓

Return Access Token

↓

Authenticated Requests

↓

Refresh when expired

---

# Authorization

Use Role-Based Access Control.

Roles

Owner

Admin

Moderator

Member

Guest

Every protected route must verify permissions.

---

# Database Collections

Users

Workspaces

Channels

ChannelMembers

Messages

Threads

Reactions

Files

Notifications

Sessions

AuditLogs

Invitations

---

# Message Schema

Message

- id
- senderId
- channelId
- content
- attachments
- edited
- deleted
- replyTo
- createdAt
- updatedAt

---

# User Schema

User

- id
- username
- email
- password
- avatar
- bio
- status
- role
- lastSeen
- createdAt

---

# Workspace Schema

Workspace

- id
- name
- description
- ownerId
- members
- settings

---

# Redis Usage

Redis should be used for:

- Presence
- Typing Indicator
- Cache
- Session Store
- Pub/Sub
- Rate Limiting

Redis should NOT store permanent data.

---

# Socket.IO Events

Connection

disconnect

join_workspace

leave_workspace

join_channel

leave_channel

typing_start

typing_stop

message_send

message_receive

message_edit

message_delete

reaction_add

reaction_remove

presence_update

notification

call_offer

call_answer

call_end

screen_share_start

screen_share_stop

Keep socket events small and well documented.

---

# File Upload Flow

Client

↓

Validation

↓

Backend

↓

Cloudinary

↓

MongoDB Metadata

↓

Response

Files supported

Images

Videos

PDF

ZIP

---

# Search

Search should support

Users

Messages

Channels

Files

Workspace

Future support

Semantic Search

---

# AI Architecture

All AI runs locally.

Use Ollama.

Supported Features

Conversation Summary

Smart Reply

Grammar Fix

Translation

Action Item Extraction

Spam Detection

Toxicity Detection

AI requests should be isolated into a dedicated AI service.

Never mix AI logic into controllers.

---

# Error Handling

Centralized.

Never duplicate try/catch unnecessarily.

Always return consistent errors.

Log unexpected failures.

---

# Logging

Use Winston.

Levels

Info

Warn

Error

Debug (development only)

---

# Validation

Use Zod everywhere.

Validate

Body

Query

Params

Forms

Environment Variables

---

# State Management

Server State

TanStack Query

Client State

Zustand

Never duplicate data.

---

# Performance

Always consider

Pagination

Infinite Scroll

Memoization

Redis Cache

Image Optimization

Database Indexing

Optimistic Updates

---

# Security

Helmet

JWT

Secure Cookies

Password Hashing

Rate Limiting

Input Sanitization

CORS

XSS Protection

Environment Variables

Secrets Management

Never expose credentials.

---

# Testing Strategy

Backend

Unit Tests

Integration Tests

API Tests

Frontend

Component Tests

E2E Tests

Target

80% Coverage

---

# CI/CD

Pipeline

Install

↓

Lint

↓

Test

↓

Build

↓

Docker Build

↓

Ready for Deployment

Deployment must never happen if tests fail.

---

# Documentation

Maintain

README

Swagger

Architecture Diagram

ER Diagram

API Documentation

Socket Documentation

Deployment Guide

Setup Guide

Every architectural change must update this document.

---

# Engineering Standards

Every new feature must:

- Follow folder structure
- Follow API conventions
- Follow response format
- Include validation
- Include tests when practical
- Include documentation
- Preserve backward compatibility

---

# Future Expansion

Architecture should support

Microservices

Horizontal Scaling

Redis Adapter

Message Queue

Worker Processes

Search Engine Integration

Offline Support

Mobile Applications

without requiring major refactoring.