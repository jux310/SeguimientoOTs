import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WorkOrder, INCO_STAGES, ANTI_STAGES } from '../types';

export function useWorkOrders(session: any) {
  const [incoOrders, setIncoOrders] = useState<WorkOrder[]>([]);
  const [antiOrders, setAntiOrders] = useState<WorkOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<WorkOrder[]>([]);
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'juancruzcybulski@gmail.com');
    }
    checkAdminStatus();
  }, []);

  const getLastConfirmedStage = (workOrderDates: any[], stages: Stage[]) => {
    let lastConfirmedStage: Stage | null = null;
    
    for (const stage of stages) {
      const date = workOrderDates.find(d => d.stage === stage.name && d.confirmed);
      if (date) {
        lastConfirmedStage = stage;
      }
    }
    
    return lastConfirmedStage;
  };

  const loadChangeHistory = useCallback(async () => {
    try {
      const { data: history, error } = await supabase
        .from('work_order_history')
        .select('*, work_orders(ot), change_history_users(email)')
        .not('field', 'in', '(status,progress)')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedHistory = history.map(entry => ({
        ...entry,
        ot: entry.work_orders?.ot || '',
        email: entry.change_history_users?.email || '',
      }));

      setChangeHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading change history:', error);
      // Don't set error state for change history failures
      setChangeHistory([]);
    }
  }, []);

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.refreshSession();
        setLoading(false);
        return;
      }

      const { data: workOrders, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          work_order_dates (
            stage,
            date,
            confirmed
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!workOrders) {
        console.error('No work orders data returned');
        setIncoOrders([]);
        setAntiOrders([]);
        setArchivedOrders([]);
        setLoading(false);
        return;
      }

      const formatted = workOrders.map(wo => ({
        id: wo.id,
        ot: wo.ot,
        client: wo.client,
        description: wo.description,
        tag: wo.tag,
        status: wo.status,
        progress: wo.progress,
        priority: wo.priority,
        location: wo.location,
        created_at: wo.created_at,
        updated_at: wo.updated_at,
        dates: wo.work_order_dates.reduce((acc: Record<string, string>, curr) => {
          if (curr.date) {
            acc[curr.stage] = {
              date: curr.date,
              confirmed: curr.confirmed || false
            };
          }
          return acc;
        }, {}),
      }));

      const sortedWorkOrders = [...workOrders].sort((a, b) => {
        // Sort by priority first
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        // Then by progress
        return b.progress - a.progress;
      });

      setIncoOrders(formatted.filter(wo => wo.location === 'INCO'));
      setAntiOrders(formatted.filter(wo => wo.location === 'ANTI'));
      setArchivedOrders(formatted.filter(wo => wo.location === 'ARCHIVED'));
    } catch (error) {
      const message = error instanceof Error 
        ? error.message
        : 'Error loading work orders';
      console.error('Error in loadWorkOrders:', error);
      setError(message);
      setIncoOrders([]);
      setAntiOrders([]);
      setArchivedOrders([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;

    // Subscribe to work_orders changes
    const workOrdersSubscription = supabase
      .channel('work_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders'
        },
        () => {
          loadWorkOrders();
        }
      )
      .subscribe();

    setSubscription(workOrdersSubscription);

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [session, loadWorkOrders]);

  useEffect(() => {
    if (session?.user) {
      loadWorkOrders();
      loadChangeHistory();
    }
  }, [session, loadWorkOrders, loadChangeHistory]);

  const createWorkOrder = async (workOrder: WorkOrder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          ot: workOrder.ot,
          client: workOrder.client,
          tag: workOrder.tag,
          description: workOrder.description,
          location: 'INCO',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      await loadWorkOrders();
      return data;
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  };


  const updateWorkOrderDate = async (
    ot: string,
    stage: string,
    date: string | null,
    confirmed: boolean = false, 
    location: 'INCO' | 'ANTI' | 'ARCHIVED'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: workOrder } = await supabase
        .from('work_orders')
        .select('id')
        .eq('ot', ot)
        .single();

      if (!workOrder) throw new Error('Work order not found');

      // First try to update existing date
      const { data: existingDate, error: existingDateError } = await supabase
        .from('work_order_dates')
        .select('id')
        .eq('work_order_id', workOrder.id)
        .eq('stage', stage);

      if (existingDateError) throw existingDateError;

      // Handle case where no date exists yet
      if (!existingDate || existingDate.length === 0) {
        // Insert new date
        await supabase
          .from('work_order_dates')
          .insert({
            work_order_id: workOrder.id,
            stage,
            date: date || null,
            confirmed,
            created_by: user.id,
            updated_by: user.id,
          });
      } else {
        // Update existing date
        await supabase
          .from('work_order_dates')
          .update({
            date: date || null,
            confirmed,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }).eq('id', existingDate[0].id);
      }

      // Get all dates for this work order to determine the last confirmed stage
      const { data: allDates } = await supabase
        .from('work_order_dates')
        .select('*')
        .eq('work_order_id', workOrder.id);

      if (!allDates) return;

      // Only update status and progress based on the last confirmed stage
      const stages = location === 'INCO' ? INCO_STAGES : 
                    location === 'ANTI' ? ANTI_STAGES :
                    [...INCO_STAGES, ...ANTI_STAGES];

      const lastConfirmedStage = getLastConfirmedStage(allDates, stages);
      
      let newLocation = location;
      
      // Only process location changes for non-archived orders
      if (location !== 'ARCHIVED') {
        // Check if we should move the work order to ANTI
        const anticorrDate = allDates.find(d => d.stage === 'Anticorr' && d.confirmed);
        if (location === 'INCO' && anticorrDate) {
          newLocation = 'ANTI';
        }
        
        // Check if we should move to ARCHIVED
        if (location === 'ANTI' && stage === 'Despacho' && confirmed) {
          newLocation = 'ARCHIVED';
        }

        // Update status and progress for non-archived orders
        if (lastConfirmedStage) {
          await supabase
            .from('work_orders')
            .update({
              status: lastConfirmedStage.name,
              progress: lastConfirmedStage.progress,
              location: newLocation,
              updated_by: user.id
            })
            .eq('id', workOrder.id);
        }
      } else {
        // For archived orders, only update the dates without changing status/progress
        await supabase
          .from('work_orders')
          .update({
            updated_by: user.id
          })
          .eq('id', workOrder.id);
      }
      
      await loadWorkOrders();
    } catch (error) {
      console.error('Error updating work order date:', error);
      throw error;
    }
  };

  const togglePriority = async (workOrderId: string, currentPriority: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('work_orders')
        .update({ 
          priority: !currentPriority,
          updated_by: user.id 
        })
        .eq('id', workOrderId);

      if (error) throw error;
      await loadWorkOrders();
    } catch (error) {
      console.error('Error toggling priority:', error);
      throw error;
    }
  };

  return {
    incoOrders,
    antiOrders,
    archivedOrders,
    loading,
    changeHistory,
    createWorkOrder,
    updateWorkOrderDate,
    togglePriority,
  };
}
