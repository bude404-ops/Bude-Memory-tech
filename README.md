# 🧠 Bude Memory

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-red)](SPONSORS.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LISCENSE)

A drop-in memory layer for AI agents. **Smarter than raw context windows. Lighter than naive RAG.**

## The Problem

Your agent passes 10k tokens of chat history every turn just to remember the user's name. That's broken.

## The Fix

Bude Memory auto-compresses conversations into structured memory tiers:

- **Working** — recent context (last few turns)
- **Episodic** — key events, decisions, outcomes
- **Semantic** — persistent facts, preferences, relationships

Retrieval returns the *smallest relevant* set, not the *largest possible*.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker below)

### Install

```bash
npm install bude-memory
