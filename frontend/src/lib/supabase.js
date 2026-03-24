import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhocyjcuomnxrftmfgbm.supabase.co';
const supabaseKey = 'sb_publishable_LGI7cfsC0naqEgjejWhxPA_YlICKQfv';

export const supabase = createClient(supabaseUrl, supabaseKey);
