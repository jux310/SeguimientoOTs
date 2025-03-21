import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HistoryEntry {
  type: 'date' | 'issue' | 'note' | 'status';
  timestamp: string;
  description: string;
  old_value?: string;
  new_value?: string;
  user_email?: string;
}

export function useWorkOrderHistory(workOrderId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        // Fetch work order changes
        const { data: changes, error: changesError } = await supabase
          .from('work_order_history_with_users')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('changed_at', { ascending: false });

        if (changesError) throw changesError;

        // Fetch issues and their notes
        const { data: issues, error: issuesError } = await supabase
          .from('issues')
          .select(`
            *,
            issue_notes_with_users (*)
          `)
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: false });

        if (issuesError) throw issuesError;

        // Combine and format all history entries
        const historyEntries: HistoryEntry[] = [];

        // Add work order changes
        changes?.forEach(change => {
          historyEntries.push({
            type: change.field === 'status' ? 'status' : 'date',
            timestamp: change.changed_at,
            description: `${change.field}: ${change.new_value}`,
            old_value: change.old_value || undefined,
            new_value: change.new_value,
            user_email: change.user_email
          });
        });

        // Add issues and their notes
        issues?.forEach(issue => {
          // Add issue creation
          historyEntries.push({
            type: 'issue',
            timestamp: issue.created_at,
            description: `Nuevo problema: ${issue.title}`,
            user_email: undefined
          });

          // Add issue notes
          issue.issue_notes_with_users?.forEach(note => {
            historyEntries.push({
              type: 'note',
              timestamp: note.created_at,
              description: note.content || '',
              user_email: note.user_email
            });
          });
        });

        // Sort all entries by timestamp
        historyEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setHistory(historyEntries);
      } catch (error) {
        console.error('Error loading work order history:', error);
        // Don't clear history on error, just keep previous state
      } finally {
        setLoading(false);
      }
    }

    if (workOrderId) {
      loadHistory();
    }
  }, [workOrderId]);

  return { history, loading };
}