import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AgentPresence {
  agent_id: string;
  name?: string;
  position: { x: number; y: number; z: number };
  current_action: string;
}

export function usePresence() {
  const [presences, setPresences] = useState<Record<string, AgentPresence>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial presence and agent names
    const fetchInitialData = async () => {
      // Fetch agents to get their names
      const { data: agentsData } = await supabase.from('sg_agents').select('id, name');
      const agentNames: Record<string, string> = {};
      agentsData?.forEach((agent) => {
        agentNames[agent.id] = agent.name;
      });

      // Fetch initial presences
      const { data: presenceData } = await supabase.from('sg_presence').select('*');
      
      const initialPresences: Record<string, AgentPresence> = {};
      presenceData?.forEach((p) => {
        initialPresences[p.agent_id] = {
          ...p,
          name: agentNames[p.agent_id] || 'Unknown Spirit',
        };
      });
      
      setPresences(initialPresences);
      setLoading(false);
    };

    fetchInitialData();

    // Subscribe to realtime updates on sg_presence
    const channel = supabase.channel('presence_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sg_presence' },
        async (payload) => {
          console.log('Realtime Presence Update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedPresence = payload.new as AgentPresence;
            
            // We might need the name if it's a new agent we haven't seen yet
            let name = 'Unknown Spirit';
            setPresences((prev) => {
              const existing = prev[updatedPresence.agent_id];
              if (existing && existing.name) {
                 name = existing.name;
              }
              return {
                ...prev,
                [updatedPresence.agent_id]: { 
                   ...updatedPresence, 
                   name: name 
                },
              };
            });
            
            // If we don't know the name, fetch it asynchronously and update again
            if (name === 'Unknown Spirit') {
               const { data } = await supabase.from('sg_agents').select('name').eq('id', updatedPresence.agent_id).single();
               if (data) {
                  setPresences((prev) => ({
                    ...prev,
                    [updatedPresence.agent_id]: {
                       ...prev[updatedPresence.agent_id],
                       name: data.name
                    }
                  }));
               }
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as AgentPresence;
            setPresences((prev) => {
              const newPresences = { ...prev };
              delete newPresences[oldRecord.agent_id];
              return newPresences;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { presences, loading };
}
