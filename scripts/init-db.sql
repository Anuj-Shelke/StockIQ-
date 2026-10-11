-- StockIQ PostgreSQL Initialization Script
-- Automatically executed on container first boot

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for SEBI RAG Chatbot vector embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- Confirm installed extensions
DO $$
BEGIN
    RAISE NOTICE 'StockIQ extensions initialized: uuid-ossp and vector';
END $$;
