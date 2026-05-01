import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tbxcrjbdovdgdsjwumqy.supabase.co';
const supabaseAnonKey = 'sb_publishable_2B2bmjKvVqtIqWHGl5JHpw_wKQpZQ49';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
