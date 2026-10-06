// mobile/src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import KariosLogo from '../../components/KariosLogo';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Forgot password flow (matching web app)
  const [isForgot, setIsForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setError(null);
    setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Container strictly styled like web .login-card */}
          <View style={styles.loginCard}>
            {/* Web Logo Format */}
            <View style={styles.logoWrapper}>
              <KariosLogo size={46} subtitle="REPORTING" showTagline={true} />
            </View>

            {error ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={18} color={colors.rejected} />
                <Text style={styles.errorAlertText}>{error}</Text>
              </View>
            ) : null}

            {isForgot ? (
              /* ── Forgot Password View ── */
              <View>
                <View style={styles.forgotHeader}>
                  <Text style={styles.forgotTitle}>Reset Password</Text>
                  <Text style={styles.forgotSubtitle}>
                    {resetSuccess
                      ? 'Check your inbox for the password reset link.'
                      : 'Enter your registered email address and we will send you instructions to reset your password.'}
                  </Text>
                </View>

                {resetSuccess ? (
                  <View style={styles.successBlock}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.approved} />
                    <Text style={styles.successText}>
                      We sent a reset link to <Text style={{ fontWeight: '700' }}>{resetEmail}</Text>.
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        setIsForgot(false);
                        setResetSuccess(false);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Email or username</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputField}
                          placeholder="name@example.com"
                          placeholderTextColor={colors.textLight}
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleForgotPassword}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() => setIsForgot(false)}
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.primary} />
                      <Text style={styles.backLinkText}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              /* ── Normal Login View ── */
              <View>
                {/* Email Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email or username</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textLight}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (error) setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textLight}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass(!showPass)}
                      style={styles.eyeToggle}
                    >
                      <Ionicons
                        name={showPass ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <View style={styles.forgotLinkRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setResetEmail(email);
                      setIsForgot(true);
                    }}
                  >
                    <Text style={styles.forgotLinkText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Invitation Note */}
            <Text style={styles.invitationNote}>
              Access is by invitation only. Contact your administrator.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.rejectedBg,
    borderColor: colors.rejectedBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorAlertText: {
    color: colors.rejected,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  eyeToggle: {
    padding: 4,
  },
  forgotLinkRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  invitationNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 20,
  },
  forgotHeader: {
    textAlign: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  forgotSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  successBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  successText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  quickTestSection: {
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    paddingHorizontal: 10,
    letterSpacing: 0.6,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  roleBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  roleBadgeCeo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  roleBadgeTextCeo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
