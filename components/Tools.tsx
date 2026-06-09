import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SYMBOL = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', AED: 'AED ', RUB: '\u20BD', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', CHF: 'CHF ' };
const CUR_LIST = ['USD', 'EUR', 'GBP', 'AED', 'RUB', 'CAD', 'AUD', 'JPY', 'CHF', 'INR', 'CNY', 'SAR'];
const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
const money = (n, s = '$') => `${s}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

const TOOLS = [
  { key: 'fx', name: 'Currency Converter', sub: 'Live exchange rates', icon: 'swap-horizontal-outline' },
  { key: 'profit', name: 'Profit Calculator', sub: 'Revenue minus cost', icon: 'trending-up-outline' },
  { key: 'margin', name: 'Margin Calculator', sub: 'Profit margin %', icon: 'pie-chart-outline' },
  { key: 'markup', name: 'Markup Calculator', sub: 'Cost to selling price', icon: 'pricetag-outline' },
  { key: 'vat', name: 'VAT Calculator', sub: 'Add or remove VAT', icon: 'receipt-outline' },
  { key: 'breakeven', name: 'Break-even Calculator', sub: 'Units to break even', icon: 'analytics-outline' },
  { key: 'projection', name: 'Revenue Projection', sub: 'Forecast growth', icon: 'rocket-outline' },
];

export default function Tools({ t, baseCur = 'USD' }) {
  const [active, setActive] = useState(null);
  const sym = SYMBOL[baseCur] || '$';

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: t.card, borderRadius: 22, padding: 20, borderWidth: t.bg === '#0B0B0B' ? 1 : 0, borderColor: t.cardLine, shadowColor: '#000', shadowOpacity: t.bg === '#0B0B0B' ? 0 : 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: t.bg === '#0B0B0B' ? 0 : 3 }, style]}>{children}</View>
  );

  if (active) {
    const tool = TOOLS.find((x) => x.key === active);
    return (
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Press onPress={() => setActive(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginLeft: 2 }}>Tools</Text>
        </Press>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 }}>{tool.name}</Text>
        <Text style={{ color: t.sub, fontSize: 14, marginBottom: 24 }}>{tool.sub}</Text>
        {active === 'fx' && <FX t={t} Card={Card} />}
        {active === 'profit' && <Profit t={t} Card={Card} sym={sym} />}
        {active === 'margin' && <Margin t={t} Card={Card} sym={sym} />}
        {active === 'markup' && <Markup t={t} Card={Card} sym={sym} />}
        {active === 'vat' && <VAT t={t} Card={Card} sym={sym} />}
        {active === 'breakeven' && <BreakEven t={t} Card={Card} sym={sym} />}
        {active === 'projection' && <Projection t={t} Card={Card} sym={sym} />}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 }}>Tools</Text>
      <Text style={{ color: t.sub, fontSize: 14, marginBottom: 24 }}>Your finance toolkit.</Text>
      {TOOLS.map((tool) => (
        <Press key={tool.key} onPress={() => setActive(tool.key)} style={{ marginBottom: 12 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Ionicons name={tool.icon} size={21} color={t.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tool.name}</Text>
              <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>{tool.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.faint} />
          </Card>
        </Press>
      ))}
    </ScrollView>
  );
}

/* ---------- shared field + result primitives ---------- */
function Field({ t, label, value, onChange, prefix, suffix, placeholder = '0' }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 14, paddingHorizontal: 16 }}>
        {prefix ? <Text style={{ color: t.sub, fontSize: 18, fontWeight: '700', marginRight: 4 }}>{prefix}</Text> : null}
        <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder={placeholder} placeholderTextColor={t.faint}
          style={{ flex: 1, color: t.text, fontSize: 18, fontWeight: '700', paddingVertical: 15 }} />
        {suffix ? <Text style={{ color: t.sub, fontSize: 16, fontWeight: '600', marginLeft: 4 }}>{suffix}</Text> : null}
      </View>
    </View>
  );
}
function ResultRow({ t, label, value, big, accent }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: big ? 4 : 8 }}>
      <Text style={{ color: t.sub, fontSize: big ? 15 : 14 }}>{label}</Text>
      <Text style={{ color: accent ? '#34C759' : t.text, fontSize: big ? 30 : 16, fontWeight: '700', letterSpacing: big ? -0.8 : 0 }}>{value}</Text>
    </View>
  );
}
function Explain({ t, children }) {
  return <Text style={{ color: t.faint, fontSize: 12.5, lineHeight: 18, marginTop: 14 }}>{children}</Text>;
}

/* ---------- 1. Currency Converter (live) ---------- */
function FX({ t, Card }) {
  const [rates, setRates] = useState(null);
  const [updated, setUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('AED');

  const load = async () => {
    try {
      setLoading(true); setErr(false);
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const j = await r.json();
      if (j && j.rates) { setRates(j.rates); setUpdated(j.time_last_update_utc || ''); }
      else setErr(true);
    } catch { setErr(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pair = (f, to2) => (rates ? (rates[to2] || 0) / (rates[f] || 1) : 0);
  const converted = num(amount) * pair(from, to);
  const FAVS = [['USD', 'AED'], ['USD', 'EUR'], ['EUR', 'GBP'], ['USD', 'RUB']];

  const CurRow = ({ value, onPick }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      {CUR_LIST.map((c) => (
        <Press key={c} onPress={() => onPick(c)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, marginRight: 8, backgroundColor: value === c ? t.graphite : t.bg2 }}>
          <Text style={{ color: value === c ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '600' }}>{c}</Text>
        </Press>
      ))}
    </ScrollView>
  );

  if (loading) return <Card><View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.graphite} /><Text style={{ color: t.sub, marginTop: 12, fontSize: 13 }}>Fetching live rates...</Text></View></Card>;
  if (err) return <Card><Text style={{ color: t.text, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Could not load rates</Text><Text style={{ color: t.sub, fontSize: 13, marginBottom: 16 }}>Check your connection and try again.</Text><Press onPress={load} style={{ backgroundColor: t.graphite, borderRadius: 14, paddingVertical: 14 }}><Text style={{ color: t.onGraphite, textAlign: 'center', fontWeight: '600' }}>Retry</Text></Press></Card>;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Field t={t} label="AMOUNT" value={amount} onChange={setAmount} prefix={SYMBOL[from] || ''} />
        <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>FROM</Text>
        <CurRow value={from} onPick={setFrom} />
        <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>TO</Text>
        <CurRow value={to} onPick={setTo} />
        <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 14 }} />
        <Text style={{ color: t.sub, fontSize: 13, marginBottom: 4 }}>{money(num(amount), SYMBOL[from] || '')} {from} =</Text>
        <Text style={{ color: t.text, fontSize: 34, fontWeight: '700', letterSpacing: -1 }}>{money(converted, SYMBOL[to] || '')} <Text style={{ fontSize: 18, color: t.sub }}>{to}</Text></Text>
        <Text style={{ color: t.faint, fontSize: 12.5, marginTop: 10 }}>1 {from} = {pair(from, to).toFixed(4)} {to}</Text>
        {updated ? <Text style={{ color: t.faint, fontSize: 11, marginTop: 4 }}>Updated {updated.replace(' (UTC)', ' UTC')}</Text> : null}
      </Card>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10, marginLeft: 4 }}>FAVORITE PAIRS</Text>
      {FAVS.map(([f, to2]) => (
        <Card key={f + to2} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{f}/{to2}</Text>
            <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 2 }}>1 {f} = {pair(f, to2).toFixed(4)} {to2}</Text>
          </View>
          <Press onPress={() => { setFrom(f); setTo(to2); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg2 }}>
            <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '600' }}>Use</Text>
          </Press>
        </Card>
      ))}
      <Press onPress={load} style={{ marginTop: 6, paddingVertical: 12 }}><Text style={{ color: t.sub, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Refresh rates</Text></Press>
    </>
  );
}

/* ---------- 2. Profit ---------- */
function Profit({ t, Card, sym }) {
  const [rev, setRev] = useState(''); const [cost, setCost] = useState('');
  const profit = num(rev) - num(cost);
  const margin = num(rev) > 0 ? (profit / num(rev)) * 100 : 0;
  return (
    <Card>
      <Field t={t} label="REVENUE" value={rev} onChange={setRev} prefix={sym} />
      <Field t={t} label="COST" value={cost} onChange={setCost} prefix={sym} />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label="Profit" value={money(profit, sym)} big accent={profit >= 0} />
      <ResultRow t={t} label="Margin" value={`${margin.toFixed(1)}%`} />
      <Explain t={t}>Profit = Revenue − Cost. Margin = Profit ÷ Revenue. Every {sym}1 of sales keeps {sym}{(margin / 100).toFixed(2)} as profit.</Explain>
    </Card>
  );
}

/* ---------- 3. Margin ---------- */
function Margin({ t, Card, sym }) {
  const [price, setPrice] = useState(''); const [cost, setCost] = useState('');
  const profit = num(price) - num(cost);
  const margin = num(price) > 0 ? (profit / num(price)) * 100 : 0;
  const markup = num(cost) > 0 ? (profit / num(cost)) * 100 : 0;
  return (
    <Card>
      <Field t={t} label="SELLING PRICE" value={price} onChange={setPrice} prefix={sym} />
      <Field t={t} label="COST" value={cost} onChange={setCost} prefix={sym} />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label="Margin" value={`${margin.toFixed(1)}%`} big />
      <ResultRow t={t} label="Profit" value={money(profit, sym)} accent={profit >= 0} />
      <ResultRow t={t} label="Markup" value={`${markup.toFixed(1)}%`} />
      <Explain t={t}>Margin is profit as a share of the price. Markup is profit as a share of the cost - they are different numbers for the same sale.</Explain>
    </Card>
  );
}

/* ---------- 4. Markup ---------- */
function Markup({ t, Card, sym }) {
  const [cost, setCost] = useState(''); const [markup, setMarkup] = useState('');
  const profit = num(cost) * (num(markup) / 100);
  const price = num(cost) + profit;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  return (
    <Card>
      <Field t={t} label="COST" value={cost} onChange={setCost} prefix={sym} />
      <Field t={t} label="MARKUP" value={markup} onChange={setMarkup} suffix="%" />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label="Selling price" value={money(price, sym)} big />
      <ResultRow t={t} label="Profit" value={money(profit, sym)} accent={profit >= 0} />
      <ResultRow t={t} label="Equivalent margin" value={`${margin.toFixed(1)}%`} />
      <Explain t={t}>Add {num(markup).toFixed(0)}% on top of cost to set your price. A {num(markup).toFixed(0)}% markup equals a {margin.toFixed(1)}% margin.</Explain>
    </Card>
  );
}

/* ---------- 5. VAT ---------- */
function VAT({ t, Card, sym }) {
  const [amount, setAmount] = useState(''); const [rate, setRate] = useState('5'); const [mode, setMode] = useState('add');
  const r = num(rate) / 100;
  let net, vat, gross;
  if (mode === 'add') { net = num(amount); vat = net * r; gross = net + vat; }
  else { gross = num(amount); net = gross / (1 + r); vat = gross - net; }
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        {[['add', 'Add VAT'], ['remove', 'Remove VAT']].map(([k, lbl]) => (
          <Press key={k} onPress={() => setMode(k)} style={{ flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: mode === k ? t.graphite : t.bg2 }}>
            <Text style={{ color: mode === k ? t.onGraphite : t.sub, textAlign: 'center', fontSize: 13.5, fontWeight: '600' }}>{lbl}</Text>
          </Press>
        ))}
      </View>
      <Field t={t} label={mode === 'add' ? 'NET AMOUNT' : 'GROSS AMOUNT'} value={amount} onChange={setAmount} prefix={sym} />
      <Field t={t} label="VAT RATE" value={rate} onChange={setRate} suffix="%" />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label="Net" value={money(net, sym)} />
      <ResultRow t={t} label="VAT" value={money(vat, sym)} />
      <ResultRow t={t} label="Gross" value={money(gross, sym)} big />
      <Explain t={t}>{mode === 'add' ? `Adds ${num(rate)}% VAT on top of the net amount.` : `Extracts the ${num(rate)}% VAT already included in the gross amount.`} UAE standard VAT is 5%.</Explain>
    </Card>
  );
}

/* ---------- 6. Break-even ---------- */
function BreakEven({ t, Card, sym }) {
  const [fixed, setFixed] = useState(''); const [price, setPrice] = useState(''); const [varc, setVarc] = useState('');
  const contribution = num(price) - num(varc);
  const units = contribution > 0 ? num(fixed) / contribution : 0;
  const revenue = units * num(price);
  return (
    <Card>
      <Field t={t} label="FIXED COSTS" value={fixed} onChange={setFixed} prefix={sym} />
      <Field t={t} label="PRICE PER UNIT" value={price} onChange={setPrice} prefix={sym} />
      <Field t={t} label="VARIABLE COST PER UNIT" value={varc} onChange={setVarc} prefix={sym} />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label="Break-even units" value={contribution > 0 ? Math.ceil(units).toLocaleString() : '\u2014'} big />
      <ResultRow t={t} label="Break-even revenue" value={contribution > 0 ? money(revenue, sym) : '\u2014'} />
      <ResultRow t={t} label="Contribution / unit" value={money(contribution, sym)} accent={contribution > 0} />
      <Explain t={t}>{contribution > 0 ? `You need to sell ${Math.ceil(units).toLocaleString()} units to cover your fixed costs. After that, each unit adds ${money(contribution, sym)} profit.` : 'Price must be higher than the variable cost per unit to ever break even.'}</Explain>
    </Card>
  );
}

/* ---------- 7. Revenue Projection ---------- */
function Projection({ t, Card, sym }) {
  const [start, setStart] = useState(''); const [growth, setGrowth] = useState(''); const [months, setMonths] = useState('12');
  const g = num(growth) / 100; const m = Math.min(Math.max(Math.round(num(months)), 0), 120);
  const final = num(start) * Math.pow(1 + g, m);
  let total = 0; for (let i = 0; i < m; i++) total += num(start) * Math.pow(1 + g, i);
  return (
    <Card>
      <Field t={t} label="STARTING MONTHLY REVENUE" value={start} onChange={setStart} prefix={sym} />
      <Field t={t} label="MONTHLY GROWTH" value={growth} onChange={setGrowth} suffix="%" />
      <Field t={t} label="MONTHS" value={months} onChange={setMonths} />
      <View style={{ height: 1, backgroundColor: t.cardLine, marginVertical: 8 }} />
      <ResultRow t={t} label={`Revenue in month ${m}`} value={money(final, sym)} big />
      <ResultRow t={t} label={`Total over ${m} months`} value={money(total, sym)} accent />
      <Explain t={t}>Compounds {num(growth)}% growth each month. At this rate revenue roughly {g > 0 ? `${(Math.pow(1 + g, 12)).toFixed(2)}\u00D7 per year` : 'stays flat'}.</Explain>
    </Card>
  );
}
