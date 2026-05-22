import { createLogger } from '@AiDigital-com/design-system-sdk/server';
import { supabase } from './supabase.js';

// TODO: Change 'incremental-dashboard' to your app's tool ID
export const log = createLogger(supabase as any, 'incremental-dashboard');
