// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import KariosLogo from '../../components/KariosLogo';
import axios from 'axios';

const DEMO_ACCOUNTS = [
  { label: 'CEO', email: 'ceo@karios.local' },
  { label: 'Developer', email: 'dev@karios.local' },
  { label: 'Sales', email: 'sales@karios.local' },
  { label: 'Marketing', email: 'marketing@karios.local' },
  { label: 'Finance', email: 'finance@karios.local' },
];

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Forgot password view state
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  function selectDemoAccount(acc) {
    setEmail(acc.email);
    setPassword('Password123!');
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your company email address.');
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      Alert.alert(
        'Password Reset Email Sent',
        `If an account exists for "${forgotEmail}", a password reset link has been dispatched to your inbox.`,
        [{ text: 'Back to Sign In', onPress: () => setIsForgot(false) }]
      );
    }, 900);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const devTokens = {
        'ceo@karios.local': 'dev-token-ceo',
        'dev@karios.local': 'dev-token-developer',
        'sales@karios.local': 'dev-token-sales',
        'marketing@karios.local': 'dev-token-marketing',
        'finance@karios.local': 'dev-token-finance',
      };

      const devToken = devTokens[email.trim().toLowerCase()];
      if (!devToken) {
        Alert.alert('Invalid Account', 'Please use one of the predefined demo accounts.');
        return;
      }
      await signIn(devToken);
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ── Brand Header (Center Aligned Logo) ── */}
        <View style={styles.brandRow}>
          <KariosLogo width={230} height={72} style={{ alignSelf: 'center' }} />
        </View>

        {isForgot ? (
          /* ── Forgot Password View ── */
          <>
            <View style={styles.welcomeBlock}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Reset Password</Text>
              <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>
                Enter your company email to receive reset instructions
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Company Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  placeholder="name@karios.local"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary }, forgotLoading && styles.loginBtnDisabled]}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
                activeOpacity={0.85}
              >
                {forgotLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.loginBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => setIsForgot(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.backToLoginText, { color: colors.primary }]}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ── Normal Sign In View ── */
          <>
            {/* ── Welcome text ── */}
            <View style={styles.welcomeBlock}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome back</Text>
              <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>
                Sign in with your company email
              </Text>
            </View>

            {/* ── Form ── */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="head@karios.local"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={[
                      styles.showBtn,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowPass(!showPass)}
                  >
                    <Text style={[styles.showBtnText, { color: colors.primary }]}>
                      {showPass ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => {
                  setForgotEmail(email);
                  setIsForgot(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary }, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Role Quick-Select Chips (Below Form) ── */}
            <View
              style={[
                styles.demoSection,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Sign in as:</Text>
              <View style={styles.demoChipsRow}>
                {DEMO_ACCOUNTS.map((acc) => {
                  const active = email === acc.email;
                  return (
                    <TouchableOpacity
                      key={acc.label}
                      style={[
                        styles.demoChip,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => selectDemoAccount(acc)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.demoChipText,
                          {
                            color: active ? colors.white : colors.text,
                            fontWeight: active ? '700' : '600',
                          },
                        ]}
                      >
                        {acc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
    marginTop: 20,
  },
  welcomeBlock: {
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
  },
  form: {
    gap: 20,
    marginBottom: 28,
  },
  inputGroup: { gap: 8 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  showBtn: {
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showBtnText: { fontSize: 13, fontWeight: '600' },
  loginBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backToLoginBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 8,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 12,
  },
});
