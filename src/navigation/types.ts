/**
 * EmpireCut — Navigation Types
 * ParamList typé pour toute la navigation
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ===== Auth Stack =====
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ===== App (Bottom Tabs) =====
export type AppTabParamList = {
  HomeTab: undefined;
  ProfileTab: undefined;
  SettingsTab: undefined;
};

// ===== Root Stack (englobe tout) =====
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;           // groupe Auth (Login/Register)
  App: undefined;            // groupe App (Tabs)
  Import: undefined;
  Editor: { projectId?: string };
  Export: { projectId: string };
};

// ===== Props helpers =====
export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;
export type ImportScreenProps = NativeStackScreenProps<RootStackParamList, 'Import'>;
export type EditorScreenProps = NativeStackScreenProps<RootStackParamList, 'Editor'>;
export type ExportScreenProps = NativeStackScreenProps<RootStackParamList, 'Export'>;

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export type HomeTabProps = BottomTabScreenProps<AppTabParamList, 'HomeTab'>;
export type ProfileTabProps = BottomTabScreenProps<AppTabParamList, 'ProfileTab'>;

// ===== Déclaration globale pour useNavigation sans types =====
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
