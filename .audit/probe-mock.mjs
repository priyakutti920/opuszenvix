import { supabase } from '../server/lib/supabase.js';

const chain = supabase.from('api_keys').select('*').eq('key_token', 'opm-live-5x-9f8a3c2e1b4d7f0a');

console.log('maybeSingle type:', typeof chain.maybeSingle);
console.log('single type:', typeof chain.single);

try {
  const r = await chain.maybeSingle();
  console.log('maybeSingle resolved:', JSON.stringify(r).slice(0, 150));
} catch (e) {
  console.log('maybeSingle THROWS ->', e.constructor.name + ':', e.message);
}

try {
  const r2 = await chain.single();
  console.log('single resolved:', JSON.stringify(r2).slice(0, 150));
} catch (e) {
  console.log('single THROWS ->', e.constructor.name + ':', e.message);
}
