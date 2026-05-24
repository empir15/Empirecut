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

const SUPABASE_URL = 'https://cjkumuollslbwrdrytgm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Tk7US_pjZp80LCqhLy7iMQ_OCnwRocu';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
