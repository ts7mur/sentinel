import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export default function Subscriptions() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', nextChargeDate: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const bg = dark ? '#08050f' : '#ffffff';
  const surface = dark ? '#0e0820' : '#faf7ff';
  const text = dark ? '#f4f1ff' : '#1a1430';
  const textDim = dark ? 'rgba(244,241,255,0.64)' : 'rgba(26,20,48,0.60)';
  const accent = dark ? '#a855f7' : '#7c3aed';
  const hairline = dark ? 'rgba(168,85,247,0.18)' : 'rgba(124,58,237,0.14)';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadSubs();
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadSubs();
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const loadSubs = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('next_charge_date', { ascending: true });
    if (!error) setSubs(data || []);
  };

  const handleAddSub = async () => {
    if (!form.name.trim() || !form.amount.trim() || !form.nextChargeDate.trim()) {
      Alert.alert('Missing fields', 'Fill in name, amount, and date');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('subscriptions').insert([
      {
        name: form.name,
        amount: parseFloat(form.amount),
        next_charge_date: form.nextChargeDate,
        category: form.category || 'Other',
      },
    ]);
    if (!error) {
      setForm({ name: '', amount: '', nextChargeDate: '', category: '' });
      loadSubs();
    } else {
      Alert.alert('Error', error.message);
    }
    setSubmitting(false);
  };

  const handleDeleteSub = async (id) => {
    await supabase.from('subscriptions').delete().eq('id', id);
    loadSubs();
  };

  const handleSignUp = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) Alert.alert('Success', 'Account created. Log in now.');
    else Alert.alert('Error', error.message);
    setSubmitting(false);
  };

  const handleLogin = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: bg, paddingTop: 60 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: text, marginBottom: 8, letterSpacing: -1 }}>Sentinel</Text>
        <Text style={{ fontSize: 14.5, color: textDim, marginBottom: 32 }}>Track your subscriptions and spending</Text>
        <TextInput placeholder="Email" placeholderTextColor={textDim} value={email} onChangeText={setEmail} autoCapitalize="none" style={{ backgroundColor: surface, borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 12 }} />
        <TextInput placeholder="Password" placeholderTextColor={textDim} value={password} onChangeText={setPassword} secureTextEntry style={{ backgroundColor: surface, borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 20 }} />
        <TouchableOpacity onPress={handleLogin} disabled={submitting} style={{ backgroundColor: accent, paddingVertical: 12, borderRadius: 10, marginBottom: 10, opacity: submitting ? 0.5 : 1 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>{submitting ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignUp} style={{ borderWidth: 1, borderColor: accent, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color: accent, textAlign: 'center', fontSize: 14, fontWeight: '600' }}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 }}>
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: text, marginBottom: 4, letterSpacing: -1 }}>Subscriptions</Text>
        <Text style={{ fontSize: 14.5, color: textDim }}>Logged in as {session.user?.email}</Text>
      </View>

      <View style={{ backgroundColor: surface, borderWidth: 1, borderColor: hairline, borderRadius: 16, padding: 20, marginBottom: 28 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: text, marginBottom: 16 }}>Add Subscription</Text>
        <TextInput placeholder="Name (e.g., Spotify)" placeholderTextColor={textDim} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} style={{ backgroundColor: dark ? '#0b0618' : '#fff', borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 12 }} />
        <TextInput placeholder="Amount (e.g., 9.99)" placeholderTextColor={textDim} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="decimal-pad" style={{ backgroundColor: dark ? '#0b0618' : '#fff', borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 12 }} />
        <TextInput placeholder="Next charge (YYYY-MM-DD)" placeholderTextColor={textDim} value={form.nextChargeDate} onChangeText={(v) => setForm({ ...form, nextChargeDate: v })} style={{ backgroundColor: dark ? '#0b0618' : '#fff', borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 12 }} />
        <TextInput placeholder="Category (optional)" placeholderTextColor={textDim} value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} style={{ backgroundColor: dark ? '#0b0618' : '#fff', borderWidth: 1, borderColor: hairline, borderRadius: 10, padding: 12, fontSize: 14, color: text, marginBottom: 12 }} />
        <TouchableOpacity onPress={handleAddSub} disabled={submitting} style={{ backgroundColor: accent, paddingVertical: 12, borderRadius: 10, opacity: submitting ? 0.5 : 1 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>{submitting ? 'Adding...' : 'Add Subscription'}</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: text, marginBottom: 12 }}>Your Subscriptions</Text>
        {subs.length === 0 ? (
          <Text style={{ fontSize: 14, color: textDim, textAlign: 'center', paddingVertical: 40 }}>No subscriptions yet</Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={subs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: surface, borderWidth: 1, borderColor: hairline, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: text }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: textDim, marginTop: 4 }}>{item.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: accent }}>${item.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 12, color: textDim }}>Next: {item.next_charge_date}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSub(item.id)} style={{ backgroundColor: dark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.1)', paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#dc2626', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ marginTop: 28, paddingVertical: 12, borderWidth: 1, borderColor: accent, borderRadius: 10 }}>
        <Text style={{ color: accent, textAlign: 'center', fontSize: 14, fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
