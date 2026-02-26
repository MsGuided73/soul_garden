import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: string
  garden_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

export function useChat(gardenId: string = 'main') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch last 50 messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('sg_chat_messages')
        .select('*')
        .eq('garden_id', gardenId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (!error && data) setMessages(data as ChatMessage[])
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to realtime inserts
    const channel = supabase
      .channel(`chat_${gardenId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sg_chat_messages',
          filter: `garden_id=eq.${gardenId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage
          setMessages((prev) => {
            // Skip if already present (optimistic update placed it)
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gardenId])

  const sendMessage = async (content: string, senderName: string = 'Dana') => {
    if (!content.trim()) return

    const optimistic: ChatMessage = {
      id: crypto.randomUUID(),
      garden_id: gardenId,
      sender_id: 'user',
      sender_name: senderName,
      content: content.trim(),
      created_at: new Date().toISOString(),
    }

    // Optimistic update — show immediately, realtime will confirm
    setMessages((prev) => [...prev, optimistic])

    await supabase.from('sg_chat_messages').insert({
      id: optimistic.id,
      garden_id: gardenId,
      sender_id: 'user',
      sender_name: senderName,
      content: content.trim(),
    })
  }

  return { messages, loading, sendMessage }
}
