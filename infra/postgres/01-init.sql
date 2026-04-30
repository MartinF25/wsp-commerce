-- Creates the n8n database alongside the main wsp_commerce database.
-- PostgreSQL creates wsp_commerce automatically via POSTGRES_DB.
-- This script runs once on first container start (initdb.d convention).
CREATE DATABASE n8n;
