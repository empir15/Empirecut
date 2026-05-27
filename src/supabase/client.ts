/**
 * EmpireCut — Supabase Client
 *
 * Initialisation du client Supabase avec :
 * - AsyncStorage pour la persistance de session
 * - URL polyfill pour React Native
 * - Types générés depuis le schéma DB
 *
 * La publishable key Supabase est destinée au client mobile. Les accès restent
 * protégés par les policies RLS côté Supabase.
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/supabase.types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
