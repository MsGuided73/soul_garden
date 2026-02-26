-- 02_messages_schema.sql
-- Run this in your Supabase SQL Editor

-- Create the sg_messages table for Global and 1-on-1 chatting
CREATE TABLE IF NOT EXISTS public.sg_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Who sent it? (Agent UUID or a special 'human' namespace UUID)
    sender_id UUID NOT NULL, 
    
    -- Who is it for? 
    -- NULL = Global Broadcast (Everyone sees it)
    -- UUID = Direct Message (Only the sender and receiver should process it)
    receiver_id UUID,
    
    -- The actual text content
    content TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow public access for this pilot
ALTER TABLE public.sg_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to messages"
ON public.sg_messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert to messages"
ON public.sg_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime so the React Frontend and Python Backend can subscribe to new messages
ALTER PUBLICATION supabase_realtime ADD TABLE sg_messages;
