import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';

const SYMBOL = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', AED: 'AED ', RUB: '\u20BD', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', CHF: 'CHF ' };
const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
const money = (n, s = '$') => `${s}${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const PRESETS = [
  { name: 'Save $10,000', icon: 'wallet-outline', target: '10000' },
  { name: 'Buy a car', icon: 'car-sport-outline', target: '25000' },
  { name: 'Emergency fund', icon: 'umbrella-outline', target: '6000' },
  { name: 'Vacation fund', icon: 'airplane-outline', target: '3000' },
  { name: 'Business fund', icon: 'briefcase-outline', target: '15000' },
];

function Press({ children, onPress, disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable disabled={disabled} onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start()}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function ProgressBar({ t, pct }) {
  const w = useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(w, { toValue: Math.min(pct, 1), duration: 700, useNativeDriver: false }).start(); }, [pct, w]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: t.bg2, overflow: 'hidden', marginTop: 12 }}>
      <Animated.View style={{ width, height: '100%', borderRadius: 5, backgroundColor: pct >= 1 ? '#34C759' : t.graphite }} />
    </View>
  );
}

export default function Goals({ t, baseCur = 'USD', userId, goals = [], reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const sym = SYMBOL[baseCur] || '$';

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: t.card, borderRadius: 22, padding: 20, borderWidth: t.bg === '#0B0B0B' ? 1 : 0, borderColor: t.cardLine, shadowColor: '#000', shadowOpacity: t.bg === '#0B0B0B' ? 0 : 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: t.bg === '#0B0B0B' ? 0 : 3 }, style]}>{children}</View>
  );

  const monthsLeft = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline); const now = new Date();
    const m = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    return Math.max(m, 0);
  };

  const updateAmount = (g) => {
    Alert.prompt('Update saved amount', `How much have you saved toward "${g.name}"?`, async (text) => {
      const v = num(text);
      await supabase.from('goals').update({ current_amount: v }).eq('id', g.id);
      reload && reload();
    }, 'plain-text', String(g.current_amount || ''));
  };
  const removeGoal = (g) => {
    Alert.alert('Delete goal?', g.name, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('goals').delete().eq('id', g.id); reload && reload(); } }]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 4 }}>Goals</Text>
      <Text style={{ color: t.sub, fontSize: 14, marginBottom: 22 }}>What you are building toward.</Text>

      <Press onPress={() => setShowAdd(true)} style={{ backgroundColor: t.graphite, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22 }}>
        <Ionicons name="add" size={19} color={t.onGraphite} />
        <Text style={{ color: t.onGraphite, fontWeight: '600', fontSize: 15, marginLeft: 6 }}>New Goal</Text>
      </Press>

      {goals.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="flag-outline" size={28} color={t.faint} />
          </View>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>No goals yet</Text>
          <Text style={{ color: t.sub, fontSize: 13.5, textAlign: 'center', paddingHorizontal: 30 }}>Set your first target and Sentinel will track your progress.</Text>
        </View>
      ) : goals.map((g) => {
        const pct = num(g.target_amount) > 0 ? num(g.current_amount) / num(g.target_amount) : 0;
        const remaining = Math.max(num(g.target_amount) - num(g.current_amount), 0);
        const ml = monthsLeft(g.deadline);
        const perMonth = ml && ml > 0 ? remaining / ml : null;
        const gsym = SYMBOL[g.currency] || sym;
        return (
          <Card key={g.id} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name={g.icon || 'flag-outline'} size={19} color={t.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{g.name}</Text>
                <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 2 }}>{money(num(g.current_amount), gsym)} of {money(num(g.target_amount), gsym)}</Text>
              </View>
              <Text style={{ color: pct >= 1 ? '#34C759' : t.text, fontSize: 17, fontWeight: '700' }}>{Math.round(pct * 100)}%</Text>
            </View>
            <ProgressBar t={t} pct={pct} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              {g.deadline ? <Text style={{ color: t.sub, fontSize: 12.5 }}>{ml === 0 ? 'Due this month' : `${ml} mo left \u00B7 ${g.deadline}`}</Text> : <Text style={{ color: t.faint, fontSize: 12.5 }}>No deadline</Text>}
              {perMonth != null && pct < 1 ? <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '600' }}>{money(perMonth, gsym)}/mo needed</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Press onPress={() => updateAmount(g)} style={{ flex: 1, borderWidth: 1, borderColor: t.cardLine, borderRadius: 12, paddingVertical: 11 }}>
                <Text style={{ color: t.text, textAlign: 'center', fontSize: 13.5, fontWeight: '600' }}>Update</Text>
              </Press>
              <Press onPress={() => removeGoal(g)} style={{ width: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.cardLine, borderRadius: 12, paddingVertical: 11 }}>
                <Ionicons name="trash-outline" size={17} color={t.faint} />
              </Press>
            </View>
          </Card>
        );
      })}

      <AddGoal visible={showAdd} onClose={() => setShowAdd(false)} t={t} userId={userId} baseCur={baseCur} reload={reload} />
    </ScrollView>
  );
}

function AddGoal({ visible, onClose, t, userId, baseCur, reload }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('flag-outline');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const sym = SYMBOL[baseCur] || '$';

  const reset = () => { setName(''); setIcon('flag-outline'); setTarget(''); setCurrent(''); setDeadline(''); };
  const save = async () => {
    if (!name.trim()) { Alert.alert('Name required', 'Give your goal a name.'); return; }
    if (num(target) <= 0) { Alert.alert('Target required', 'Set a target amount.'); return; }
    setBusy(true);
    const { error } = await supabase.from('goals').insert([{ user_id: userId, name: name.trim(), target_amount: num(target), current_amount: num(current), currency: baseCur, deadline: deadline.trim() || null, icon }]);
    setBusy(false);
    if (error) { Alert.alert('Error', error.message); return; }
    reset(); reload && reload(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 22 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>New Goal</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={26} color={t.sub} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>QUICK START</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 22 }}>
            {PRESETS.map((p) => (
              <Press key={p.name} onPress={() => { setName(p.name); setIcon(p.icon); setTarget(p.target); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11, marginRight: 8, marginBottom: 8, backgroundColor: name === p.name ? t.graphite : t.bg2 }}>
                <Ionicons name={p.icon} size={15} color={name === p.name ? t.onGraphite : t.sub} style={{ marginRight: 6 }} />
                <Text style={{ color: name === p.name ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '600' }}>{p.name}</Text>
              </Press>
            ))}
          </View>

          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>GOAL NAME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. New MacBook" placeholderTextColor={t.faint} style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 15, fontSize: 15, color: t.text, marginBottom: 18 }} />

          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>TARGET AMOUNT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 14, paddingHorizontal: 16, marginBottom: 18 }}>
            <Text style={{ color: t.sub, fontSize: 20, fontWeight: '700', marginRight: 4 }}>{sym}</Text>
            <TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={t.faint} style={{ flex: 1, color: t.text, fontSize: 20, fontWeight: '700', paddingVertical: 15 }} />
          </View>

          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>ALREADY SAVED (OPTIONAL)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 14, paddingHorizontal: 16, marginBottom: 18 }}>
            <Text style={{ color: t.sub, fontSize: 20, fontWeight: '700', marginRight: 4 }}>{sym}</Text>
            <TextInput value={current} onChangeText={setCurrent} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={t.faint} style={{ flex: 1, color: t.text, fontSize: 20, fontWeight: '700', paddingVertical: 15 }} />
          </View>

          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>DEADLINE (OPTIONAL, YYYY-MM-DD)</Text>
          <TextInput value={deadline} onChangeText={setDeadline} placeholder="2026-12-31" placeholderTextColor={t.faint} style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 15, fontSize: 15, color: t.text, marginBottom: 24 }} />

          <Press onPress={save} disabled={busy} style={{ backgroundColor: t.graphite, borderRadius: 16, paddingVertical: 18 }}>
            <Text style={{ color: t.onGraphite, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>{busy ? 'Saving\u2026' : 'Create Goal'}</Text>
          </Press>
        </ScrollView>
      </View>
    </Modal>
  );
}
