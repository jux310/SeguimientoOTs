import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Issue {
  id: string;
  work_order_id: string;
  title: string;
  notes?: string;
  issue_notes?: IssueNote[];
  delay?: IssueDelay | null;
  stage?: string | null;
  status: 'OPEN' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface IssueNote {
  id: string;
  issue_id: string;
  content: string;
  created_at: string;
  created_by: string;
  user_email?: string;
}

export interface IssueDelay {
  start_date: string;
  end_date: string | null;
}

export function useIssues(workOrders: any[]) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workOrders) {
      loadIssues();
    }
  }, [workOrders]);

  const loadIssues = async () => {
    try {
      if (!workOrders || workOrders.length === 0) {
        setIssues([]);
        setLoading(false);
        return;
      }

      const workOrderIds = workOrders
        .filter(wo => wo && typeof wo === 'object' && 'id' in wo)
        .map(wo => wo.id)
        .filter(Boolean);

      if (workOrderIds.length === 0) {
        setIssues([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .in('work_order_id', workOrderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) {
        setIssues([]);
        return;
      }

      if (!data) {
        setIssues([]);
        return;
      }

      if (data.length === 0) {
        setIssues([]);
        return;
      }

      const notesPromise = supabase
          .from('issue_notes_with_users')
          .select()
          .in('issue_id', data.map(i => i.id || ''))
          .order('created_at', { ascending: true });

      const delaysPromise = supabase
          .from('issue_delays')
          .select()
          .in('issue_id', data.map(i => i.id || ''))
          .order('start_date', { ascending: true });

      let notesResponse, delaysResponse;
      try {
        [notesResponse, delaysResponse] = await Promise.all([notesPromise, delaysPromise]);
      } catch (err) {
        console.error('Error in parallel requests:', err);
        notesResponse = { data: [], error };
        delaysResponse = { data: [], error };
      }

      const notes = notesResponse.error ? [] : (notesResponse.data || []);
      if (notesResponse.error) {
        console.error('Error fetching notes:', notesResponse.error);
      }

      const delays = delaysResponse.error ? [] : (delaysResponse.data || []);
      if (delaysResponse.error) {
        console.error('Error fetching delays:', delaysResponse.error);
      }

      // Combine issues with their notes and delays
      const issuesWithNotes = data.map(issue => ({
        ...issue,
        issue_notes: notes.filter(n => n.issue_id === issue.id),
        delay: delays.find(d => d.issue_id === issue.id)
          ? {
              start_date: delays.find(d => d.issue_id === issue.id)!.start_date,
              end_date: delays.find(d => d.issue_id === issue.id)!.end_date
            }
          : null
      }));

      setIssues(issuesWithNotes);
    } catch (error) {
      console.error('Error in loadIssues:', error);
      setIssues([]); // Fallback to empty state on error
    } finally {
      setLoading(false);
    }
  };

  const addIssueNote = async (issueId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('issue_notes')
        .insert({
          issue_id: issueId,
          content,
          created_by: user.id
        })
        .select('*')
        .single();

      if (error) throw error;

      // Get user email for the new note
      const { data: noteWithUser } = await supabase
        .from('issue_notes_with_users')
        .select('*')
        .eq('id', data.id)
        .single();

      setIssues(prev => prev.map(issue => 
        issue.id === issueId
          ? {
              ...issue,
              issue_notes: [...(issue.issue_notes || []), noteWithUser]
            }
          : issue
      ));

      return noteWithUser;
    } catch (error) {
      console.error('Error adding issue note:', error);
      throw error;
    }
  };

  const createIssue = async (issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create the issue first
      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issue,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // If there are initial notes, create them as a note entry
      if (issue.notes?.trim()) {
        const { error: noteError } = await supabase
          .from('issue_notes')
          .insert({
            issue_id: data.id,
            content: issue.notes,
            created_by: user.id
          });

        if (noteError) throw noteError;
      }
      
      setIssues(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get current issue data
      const { data: currentIssue, error: issueError } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id.trim())
        .single();

      if (issueError) throw issueError;
      if (!currentIssue) throw new Error('Issue not found');

      // Create a copy of updates to avoid modifying the original object
      const issueUpdates = { ...updates };

      // If marking as resolved and there's an open delay, set its end date
      if (issueUpdates.status === 'RESOLVED') {
        const { data: currentDelay } = await supabase
          .from('issue_delays')
          .select('*')
          .eq('issue_id', id)
          .is('end_date', null)
          .single();

        if (currentDelay?.id) {
          const today = new Date();
          const { error: delayError } = await supabase
            .from('issue_delays')
            .update({
              end_date: format(today, 'yyyy-MM-dd'),
              updated_by: user.id
            })
            .eq('id', currentDelay.id);

          if (delayError) throw delayError;
        }
      }

      if (issueUpdates.delay !== undefined) {
        const { data: currentIssue } = await supabase
          .from('issues')
          .select(`
            priority,
            issue_delays (*)
          `)
          .eq('id', id)
          .single();

        if (currentIssue && issueUpdates.delay && currentIssue.priority !== 'HIGH' && currentIssue.priority !== 'CRITICAL') {
          throw new Error('Solo se pueden agregar demoras a problemas de prioridad alta o crítica');
        }

        if (issueUpdates.delay) {
          // Check if a delay already exists
          const { data: existingDelay } = await supabase
            .from('issue_delays')
            .select('id')
            .eq('issue_id', id)
            .single();

          if (existingDelay) {
            // Update existing delay
            const { error: updateError } = await supabase
              .from('issue_delays')
              .update({
                start_date: issueUpdates.delay.start_date,
                end_date: issueUpdates.delay.end_date,
                updated_by: user.id
              })
              .eq('id', existingDelay.id);

            if (updateError) throw updateError;
          } else {
            // Insert new delay
            const { error: insertError } = await supabase
              .from('issue_delays')
              .insert({
                issue_id: id,
                start_date: issueUpdates.delay.start_date,
                end_date: issueUpdates.delay.end_date,
                created_by: user.id,
                updated_by: user.id
              });

            if (insertError) throw insertError;
          }
        } else {
          // If delay is null/undefined, remove existing delay
          const { error: deleteError } = await supabase
            .from('issue_delays')
            .delete()
            .eq('issue_id', id);

          if (deleteError) throw deleteError;
        }

        delete issueUpdates.delay;
      }

      // If there are notes in the updates, create them as a note entry
      if (issueUpdates.notes?.trim()) {
        const { error: noteError } = await supabase
          .from('issue_notes')
          .insert({
            issue_id: id,
            content: issueUpdates.notes,
            created_by: user.id
          });

        if (noteError) throw noteError;
        delete issueUpdates.notes;
      }

      // Only update the issue if there are other fields to update
      if (Object.keys(issueUpdates).length === 0) {
        await loadIssues();
        return;
      }

      const { data, error } = await supabase
        .from('issues')
        .update({ ...issueUpdates, updated_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, ...data } : issue
      ));

      return data;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error instanceof Error 
        ? new Error(`Error updating issue: ${error.message}`)
        : new Error('Error updating issue');
    }
  };

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    addIssueNote,
  };
}
