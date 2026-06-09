import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Modal, useColorScheme,
  ActivityIndicator, Alert, Animated, StatusBar, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabaseClient';
import Tools from '../../components/Tools';
import Goals from '../../components/Goals';

WebBrowser.maybeCompleteAuthSession();

const ASSET_KINDS = [
  ['cash', 'Cash', 'cash-outline'],
  ['bank', 'Bank', 'card-outline'],
  ['crypto', 'Crypto', 'logo-bitcoin'],
  ['real_estate', 'Real estate', 'home-outline'],
  ['business', 'Business', 'briefcase-outline'],
  ['investments', 'Investments', 'trending-up-outline'],
];
const ASSET_LABEL = { cash: 'Cash', bank: 'Bank', crypto: 'Crypto', real_estate: 'Real estate', business: 'Business', investments: 'Investments' };
const ASSET_ICON = { cash: 'cash-outline', bank: 'card-outline', crypto: 'logo-bitcoin', real_estate: 'home-outline', business: 'briefcase-outline', investments: 'trending-up-outline' };

/* ============================================================
   THEME
   ============================================================ */
const palette = (dark) => ({
  bg: dark ? '#090A0C' : '#F8F7F3',
  bg2: dark ? '#131519' : '#EFEEE8',
  card: dark ? '#15171C' : '#FFFFFF',
  cardLine: dark ? '#262A31' : '#E3E0D7',
  text: dark ? '#F7F5EF' : '#151515',
  sub: dark ? '#B5B3AB' : '#6F6A61',
  faint: dark ? '#747168' : '#A29B90',
  graphite: dark ? '#F2EFE4' : '#171A20',
  onGraphite: dark ? '#101115' : '#FFFFFF',
  blue: '#3A79FF',
  green: '#34C759',
  gold: '#B9852C',
  mint: '#2DBE9F',
  warn: dark ? '#FF7A70' : '#C8443A',
  input: dark ? '#111318' : '#F2F0EA',
  shadow: dark ? 'rgba(0, 0, 0, 0)' : 'rgba(34, 26, 12, 0.12)',
});

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'RUB', 'CAD', 'AUD', 'JPY', 'CHF'];
const SYMBOL = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', AED: 'AED ', RUB: '\u20BD', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', CHF: 'CHF ' };
const sym0 = (c) => SYMBOL[c] || '$';
// approximate static rates per 1 USD (no API; refine later with live rates)
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, RUB: 92, CAD: 1.36, AUD: 1.52, JPY: 150, CHF: 0.88 };
const convert = (amt, from, to) => (Number(amt) / (RATES[from] || 1)) * (RATES[to] || 1);
const parseMoney = (v) => {
  const n = parseFloat(String(v || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const formatMoney = (n, sym = '$', digits = 0) => `${sym}${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const tap = () => Haptics.selectionAsync().catch(() => {});

const TX_TYPES = ['Spend', 'Subscription', 'Rent', 'Insurance', 'Utilities', 'Salary', 'Investment', 'Savings', 'Other'];
const RECURRING = ['Subscription', 'Rent', 'Insurance'];
const INFLOW = ['Salary', 'Investment'];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Education', 'Travel', 'Bills'];
const CAT_ICON = {
  Food: 'restaurant-outline', Transport: 'car-outline', Shopping: 'bag-outline',
  Health: 'fitness-outline', Entertainment: 'film-outline', Education: 'school-outline',
  Travel: 'airplane-outline', Bills: 'receipt-outline', Other: 'ellipsis-horizontal',
};
const FREQ = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

/* ============================================================
   i18n
   ============================================================ */
const LANGS = [['en', 'English'], ['ru', '\u0420\u0443\u0441\u0441\u043A\u0438\u0439'], ['es', 'Espa\u00F1ol'], ['fr', 'Fran\u00E7ais']];

const STRINGS = {
  en: {
    tagline: 'Financial clarity, simplified.', email: 'Email', password: 'Password',
    continueEmail: 'Continue with Email', pleaseWait: 'Please wait\u2026', createAccount: 'Create Account',
    preferredName: 'Preferred name',
    or: 'OR', continueApple: 'Continue with Apple', continueGoogle: 'Continue with Google',
    legalShort: 'Privacy Policy   \u00B7   Terms of Service',
    greet: { morning: 'Good Morning', afternoon: 'Good Afternoon', evening: 'Good Evening' },
    thisMonth: 'This Month', ofTarget: '% of target', noTarget: 'No target set', spent: 'Spent',
    overTarget: "You've spent more than your monthly target.", leftOf: 'left of your', targetWord: 'target',
    currentBalance: 'Current Balance', changeBalance: 'Change Balance', addTransaction: 'Add Transaction',
    topCategories: 'Top Categories', transactions: 'Transactions', txSubtitle: 'Every transaction, with precision.',
    noTx: 'No transactions yet.', deleteQ: 'Delete?', cancel: 'Cancel', del: 'Delete',
    analytics: 'Analytics', spentThisMonth: 'Spent this month', byCategory: 'By Category',
    noSpending: 'No spending recorded this month.', recurring: 'Recurring', active: 'active', cycle: 'cycle',
    subscriptions: 'Subscriptions', subsSubtitle: 'Upcoming charges & recurring payments.',
    soonest: 'Soonest', largest: 'Largest', az: 'A\u2013Z', noSubs: 'No subscriptions yet. Add one via Add Transaction.', next: 'next',
    settings: 'Settings', appearance: 'APPEARANCE', automatic: 'Automatic', light: 'Light', dark: 'Dark',
    account: 'ACCOUNT', baseCurrency: 'Base currency', plan: 'Plan', free: 'Free', languageWord: 'Language',
    languageCaps: 'LANGUAGE', helpCenter: 'Help Center', signOut: 'Sign Out', legalFull: 'Privacy \u00B7 Terms \u00B7 Data Policy',
    type: 'TYPE', amount: 'AMOUNT', description: 'DESCRIPTION', category: 'CATEGORY',
    nextChargeCaps: 'NEXT CHARGE (YYYY-MM-DD)', frequency: 'FREQUENCY', save: 'Save', saving: 'Saving\u2026',
    amountReq: 'Amount required', enterAmount: 'Enter an amount.', dateReq: 'Date required', enterDate: 'Enter the next charge date (YYYY-MM-DD).',
    willCharge: 'will charge', on: 'on', phRec: 'e.g. Netflix', phSpend: 'e.g. Lunch',
    balanceTarget: 'Balance & Target', currentBalanceCaps: 'CURRENT BALANCE', monthlyTargetCaps: 'MONTHLY SPEND TARGET', baseCurrencyCaps: 'BASE CURRENCY',
  },
  ru: {
    tagline: '\u0424\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u0430\u044F \u044F\u0441\u043D\u043E\u0441\u0442\u044C \u2014 \u044D\u0442\u043E \u043F\u0440\u043E\u0441\u0442\u043E.', email: '\u042D\u043B. \u043F\u043E\u0447\u0442\u0430', password: '\u041F\u0430\u0440\u043E\u043B\u044C',
    continueEmail: '\u0412\u043E\u0439\u0442\u0438 \u043F\u043E \u044D\u043B. \u043F\u043E\u0447\u0442\u0435', pleaseWait: '\u041F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435\u2026', createAccount: '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442',
    or: '\u0418\u041B\u0418', continueApple: '\u0412\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Apple', continueGoogle: '\u0412\u043E\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Google',
    legalShort: '\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430   \u00B7   \u0423\u0441\u043B\u043E\u0432\u0438\u044F',
    greet: { morning: '\u0414\u043E\u0431\u0440\u043E\u0435 \u0443\u0442\u0440\u043E', afternoon: '\u0414\u043E\u0431\u0440\u044B\u0439 \u0434\u0435\u043D\u044C', evening: '\u0414\u043E\u0431\u0440\u044B\u0439 \u0432\u0435\u0447\u0435\u0440' },
    thisMonth: '\u042D\u0442\u043E\u0442 \u043C\u0435\u0441\u044F\u0446', ofTarget: '% \u043E\u0442 \u043B\u0438\u043C\u0438\u0442\u0430', noTarget: '\u041B\u0438\u043C\u0438\u0442 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D', spent: '\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E',
    overTarget: '\u0412\u044B \u043F\u0440\u0435\u0432\u044B\u0441\u0438\u043B\u0438 \u043C\u0435\u0441\u044F\u0447\u043D\u044B\u0439 \u043B\u0438\u043C\u0438\u0442.', leftOf: '\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0438\u0437 \u043B\u0438\u043C\u0438\u0442\u0430', targetWord: '',
    currentBalance: '\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441', changeBalance: '\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441', addTransaction: '\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044E',
    topCategories: '\u0422\u043E\u043F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439', transactions: '\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0438', txSubtitle: '\u041A\u0430\u0436\u0434\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u2014 \u0441 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C\u044E.',
    noTx: '\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439.', deleteQ: '\u0423\u0434\u0430\u043B\u0438\u0442\u044C?', cancel: '\u041E\u0442\u043C\u0435\u043D\u0430', del: '\u0423\u0434\u0430\u043B\u0438\u0442\u044C',
    analytics: '\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430', spentThisMonth: '\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E \u0437\u0430 \u043C\u0435\u0441\u044F\u0446', byCategory: '\u041F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C',
    noSpending: '\u041D\u0435\u0442 \u0440\u0430\u0441\u0445\u043E\u0434\u043E\u0432 \u0437\u0430 \u044D\u0442\u043E\u0442 \u043C\u0435\u0441\u044F\u0446.', recurring: '\u0420\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u0435', active: '\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445', cycle: '\u0446\u0438\u043A\u043B',
    subscriptions: '\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0438', subsSubtitle: '\u041F\u0440\u0435\u0434\u0441\u0442\u043E\u044F\u0449\u0438\u0435 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u0438 \u043F\u043B\u0430\u0442\u0435\u0436\u0438.',
    soonest: '\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435', largest: '\u041A\u0440\u0443\u043F\u043D\u0435\u0439\u0448\u0438\u0435', az: '\u0410\u2013\u042F', noSubs: '\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043F\u043E\u0434\u043F\u0438\u0441\u043E\u043A. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u00AB\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044E\u00BB.', next: '\u0441\u043B\u0435\u0434.',
    settings: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438', appearance: '\u0412\u0418\u0414', automatic: '\u0410\u0432\u0442\u043E', light: '\u0421\u0432\u0435\u0442\u043B\u0430\u044F', dark: '\u0422\u0451\u043C\u043D\u0430\u044F',
    account: '\u0410\u041A\u041A\u0410\u0423\u041D\u0422', baseCurrency: '\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0432\u0430\u043B\u044E\u0442\u0430', plan: '\u0422\u0430\u0440\u0438\u0444', free: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E', languageWord: '\u042F\u0437\u044B\u043A',
    languageCaps: '\u042F\u0417\u042B\u041A', helpCenter: '\u041F\u043E\u043C\u043E\u0449\u044C', signOut: '\u0412\u044B\u0439\u0442\u0438', legalFull: '\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u00B7 \u0423\u0441\u043B\u043E\u0432\u0438\u044F \u00B7 \u0414\u0430\u043D\u043D\u044B\u0435',
    type: '\u0422\u0418\u041F', amount: '\u0421\u0423\u041C\u041C\u0410', description: '\u041E\u041F\u0418\u0421\u0410\u041D\u0418\u0415', category: '\u041A\u0410\u0422\u0415\u0413\u041E\u0420\u0418\u042F',
    nextChargeCaps: '\u0421\u041B\u0415\u0414. \u0421\u041F\u0418\u0421\u0410\u041D\u0418\u0415 (\u0413\u0413\u0413\u0413-\u041C\u041C-\u0414\u0414)', frequency: '\u0427\u0410\u0421\u0422\u041E\u0422\u0410', save: '\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C', saving: '\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u2026',
    amountReq: '\u041D\u0443\u0436\u043D\u0430 \u0441\u0443\u043C\u043C\u0430', enterAmount: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0441\u0443\u043C\u043C\u0443.', dateReq: '\u041D\u0443\u0436\u043D\u0430 \u0434\u0430\u0442\u0430', enterDate: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u0430\u0442\u0443 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F (\u0413\u0413\u0413\u0413-\u041C\u041C-\u0414\u0414).',
    willCharge: '\u0441\u043F\u0438\u0448\u0435\u0442', on: '', phRec: '\u043D\u0430\u043F\u0440. Netflix', phSpend: '\u043D\u0430\u043F\u0440. \u043E\u0431\u0435\u0434',
    balanceTarget: '\u0411\u0430\u043B\u0430\u043D\u0441 \u0438 \u043B\u0438\u043C\u0438\u0442', currentBalanceCaps: '\u0422\u0415\u041A\u0423\u0429\u0418\u0419 \u0411\u0410\u041B\u0410\u041D\u0421', monthlyTargetCaps: '\u041C\u0415\u0421\u042F\u0427\u041D\u042B\u0419 \u041B\u0418\u041C\u0418\u0422', baseCurrencyCaps: '\u041E\u0421\u041D\u041E\u0412\u041D\u0410\u042F \u0412\u0410\u041B\u042E\u0422\u0410',
  },
  es: {
    tagline: 'Claridad financiera, simplificada.', email: 'Correo', password: 'Contrase\u00F1a',
    continueEmail: 'Continuar con correo', pleaseWait: 'Espera\u2026', createAccount: 'Crear cuenta',
    or: 'O', continueApple: 'Continuar con Apple', continueGoogle: 'Continuar con Google',
    legalShort: 'Privacidad   \u00B7   T\u00E9rminos',
    greet: { morning: 'Buenos d\u00EDas', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
    thisMonth: 'Este mes', ofTarget: '% del objetivo', noTarget: 'Sin objetivo', spent: 'Gastado',
    overTarget: 'Has superado tu objetivo mensual.', leftOf: 'restan de tu objetivo de', targetWord: '',
    currentBalance: 'Saldo actual', changeBalance: 'Cambiar saldo', addTransaction: 'A\u00F1adir transacci\u00F3n',
    topCategories: 'Categor\u00EDas principales', transactions: 'Transacciones', txSubtitle: 'Cada transacci\u00F3n, con precisi\u00F3n.',
    noTx: 'A\u00FAn no hay transacciones.', deleteQ: '\u00BFEliminar?', cancel: 'Cancelar', del: 'Eliminar',
    analytics: 'An\u00E1lisis', spentThisMonth: 'Gastado este mes', byCategory: 'Por categor\u00EDa',
    noSpending: 'Sin gastos este mes.', recurring: 'Recurrentes', active: 'activas', cycle: 'ciclo',
    subscriptions: 'Suscripciones', subsSubtitle: 'Pr\u00F3ximos cargos y pagos recurrentes.',
    soonest: 'Pr\u00F3ximos', largest: 'Mayores', az: 'A\u2013Z', noSubs: 'A\u00FAn no hay suscripciones. A\u00F1ade una con A\u00F1adir transacci\u00F3n.', next: 'pr\u00F3x.',
    settings: 'Ajustes', appearance: 'APARIENCIA', automatic: 'Autom\u00E1tico', light: 'Claro', dark: 'Oscuro',
    account: 'CUENTA', baseCurrency: 'Moneda base', plan: 'Plan', free: 'Gratis', languageWord: 'Idioma',
    languageCaps: 'IDIOMA', helpCenter: 'Centro de ayuda', signOut: 'Cerrar sesi\u00F3n', legalFull: 'Privacidad \u00B7 T\u00E9rminos \u00B7 Datos',
    type: 'TIPO', amount: 'IMPORTE', description: 'DESCRIPCI\u00D3N', category: 'CATEGOR\u00CDA',
    nextChargeCaps: 'PR\u00D3XIMO CARGO (AAAA-MM-DD)', frequency: 'FRECUENCIA', save: 'Guardar', saving: 'Guardando\u2026',
    amountReq: 'Importe requerido', enterAmount: 'Introduce un importe.', dateReq: 'Fecha requerida', enterDate: 'Introduce la fecha del pr\u00F3ximo cargo (AAAA-MM-DD).',
    willCharge: 'cobrar\u00E1', on: 'el', phRec: 'p. ej. Netflix', phSpend: 'p. ej. almuerzo',
    balanceTarget: 'Saldo y objetivo', currentBalanceCaps: 'SALDO ACTUAL', monthlyTargetCaps: 'OBJETIVO MENSUAL', baseCurrencyCaps: 'MONEDA BASE',
  },
  fr: {
    tagline: 'La clart\u00E9 financi\u00E8re, simplifi\u00E9e.', email: 'E-mail', password: 'Mot de passe',
    continueEmail: "Continuer avec l'e-mail", pleaseWait: 'Veuillez patienter\u2026', createAccount: 'Cr\u00E9er un compte',
    or: 'OU', continueApple: 'Continuer avec Apple', continueGoogle: 'Continuer avec Google',
    legalShort: 'Confidentialit\u00E9   \u00B7   Conditions',
    greet: { morning: 'Bonjour', afternoon: 'Bon apr\u00E8s-midi', evening: 'Bonsoir' },
    thisMonth: 'Ce mois-ci', ofTarget: "% de l'objectif", noTarget: 'Aucun objectif', spent: 'D\u00E9pens\u00E9',
    overTarget: 'Vous avez d\u00E9pass\u00E9 votre objectif mensuel.', leftOf: 'restants sur votre objectif de', targetWord: '',
    currentBalance: 'Solde actuel', changeBalance: 'Modifier le solde', addTransaction: 'Ajouter une transaction',
    topCategories: 'Cat\u00E9gories principales', transactions: 'Transactions', txSubtitle: 'Chaque transaction, avec pr\u00E9cision.',
    noTx: 'Aucune transaction pour l\u2019instant.', deleteQ: 'Supprimer ?', cancel: 'Annuler', del: 'Supprimer',
    analytics: 'Analyses', spentThisMonth: 'D\u00E9pens\u00E9 ce mois-ci', byCategory: 'Par cat\u00E9gorie',
    noSpending: 'Aucune d\u00E9pense ce mois-ci.', recurring: 'R\u00E9currents', active: 'actifs', cycle: 'cycle',
    subscriptions: 'Abonnements', subsSubtitle: 'Prochains pr\u00E9l\u00E8vements et paiements r\u00E9currents.',
    soonest: 'Plus t\u00F4t', largest: 'Plus \u00E9lev\u00E9s', az: 'A\u2013Z', noSubs: 'Aucun abonnement. Ajoutez-en un via Ajouter une transaction.', next: 'proch.',
    settings: 'Param\u00E8tres', appearance: 'APPARENCE', automatic: 'Automatique', light: 'Clair', dark: 'Sombre',
    account: 'COMPTE', baseCurrency: 'Devise de base', plan: 'Forfait', free: 'Gratuit', languageWord: 'Langue',
    languageCaps: 'LANGUE', helpCenter: "Centre d'aide", signOut: 'Se d\u00E9connecter', legalFull: 'Confidentialit\u00E9 \u00B7 Conditions \u00B7 Donn\u00E9es',
    type: 'TYPE', amount: 'MONTANT', description: 'DESCRIPTION', category: 'CAT\u00C9GORIE',
    nextChargeCaps: 'PROCHAIN PR\u00C9L\u00C8VEMENT (AAAA-MM-JJ)', frequency: 'FR\u00C9QUENCE', save: 'Enregistrer', saving: 'Enregistrement\u2026',
    amountReq: 'Montant requis', enterAmount: 'Saisissez un montant.', dateReq: 'Date requise', enterDate: 'Saisissez la date du prochain pr\u00E9l\u00E8vement (AAAA-MM-JJ).',
    willCharge: 'pr\u00E9l\u00E8vera', on: 'le', phRec: 'ex. Netflix', phSpend: 'ex. d\u00E9jeuner',
    balanceTarget: 'Solde et objectif', currentBalanceCaps: 'SOLDE ACTUEL', monthlyTargetCaps: 'OBJECTIF MENSUEL', baseCurrencyCaps: 'DEVISE DE BASE',
  },
};

const TYPE_LABEL = {
  en: { Spend: 'Spend', Subscription: 'Subscription', Rent: 'Rent', Insurance: 'Insurance', Utilities: 'Utilities', Salary: 'Salary', Investment: 'Investment', Savings: 'Savings', Other: 'Other' },
  ru: { Spend: '\u0420\u0430\u0441\u0445\u043E\u0434', Subscription: '\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0430', Rent: '\u0410\u0440\u0435\u043D\u0434\u0430', Insurance: '\u0421\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430', Utilities: '\u041A\u043E\u043C\u043C\u0443\u043D\u0430\u043B\u043A\u0430', Salary: '\u0417\u0430\u0440\u043F\u043B\u0430\u0442\u0430', Investment: '\u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0438', Savings: '\u0421\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u044F', Other: '\u0414\u0440\u0443\u0433\u043E\u0435' },
  es: { Spend: 'Gasto', Subscription: 'Suscripci\u00F3n', Rent: 'Alquiler', Insurance: 'Seguro', Utilities: 'Servicios', Salary: 'Salario', Investment: 'Inversi\u00F3n', Savings: 'Ahorro', Other: 'Otro' },
  fr: { Spend: 'D\u00E9pense', Subscription: 'Abonnement', Rent: 'Loyer', Insurance: 'Assurance', Utilities: 'Charges', Salary: 'Salaire', Investment: 'Investissement', Savings: '\u00C9pargne', Other: 'Autre' },
};
const CAT_LABEL = {
  en: { Food: 'Food', Transport: 'Transport', Shopping: 'Shopping', Health: 'Health', Entertainment: 'Entertainment', Education: 'Education', Travel: 'Travel', Bills: 'Bills', Other: 'Other' },
  ru: { Food: '\u0415\u0434\u0430', Transport: '\u0422\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442', Shopping: '\u041F\u043E\u043A\u0443\u043F\u043A\u0438', Health: '\u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435', Entertainment: '\u0420\u0430\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u0438\u044F', Education: '\u041E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435', Travel: '\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u044F', Bills: '\u0421\u0447\u0435\u0442\u0430', Other: '\u0414\u0440\u0443\u0433\u043E\u0435' },
  es: { Food: 'Comida', Transport: 'Transporte', Shopping: 'Compras', Health: 'Salud', Entertainment: 'Ocio', Education: 'Educaci\u00F3n', Travel: 'Viajes', Bills: 'Facturas', Other: 'Otro' },
  fr: { Food: 'Nourriture', Transport: 'Transport', Shopping: 'Achats', Health: 'Sant\u00E9', Entertainment: 'Loisirs', Education: '\u00C9ducation', Travel: 'Voyages', Bills: 'Factures', Other: 'Autre' },
};
const FREQ_LABEL = {
  en: { Weekly: 'Weekly', Monthly: 'Monthly', Quarterly: 'Quarterly', Yearly: 'Yearly' },
  ru: { Weekly: '\u0415\u0436\u0435\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u043E', Monthly: '\u0415\u0436\u0435\u043C\u0435\u0441\u044F\u0447\u043D\u043E', Quarterly: '\u0415\u0436\u0435\u043A\u0432\u0430\u0440\u0442\u0430\u043B\u044C\u043D\u043E', Yearly: '\u0415\u0436\u0435\u0433\u043E\u0434\u043D\u043E' },
  es: { Weekly: 'Semanal', Monthly: 'Mensual', Quarterly: 'Trimestral', Yearly: 'Anual' },
  fr: { Weekly: 'Hebdo', Monthly: 'Mensuel', Quarterly: 'Trimestriel', Yearly: 'Annuel' },
};

/* ============================================================
   Primitives
   ============================================================ */
function AnimatedNumber({ value, prefix = '', t, size = 44, weight = '700' }) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, { toValue: value || 0, duration: 850, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim, value]);
  return (
    <Text style={{ fontSize: size, fontWeight: weight, color: t.text, letterSpacing: 0, fontVariant: ['tabular-nums'] }}>
      {prefix}{display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </Text>
  );
}

function Press({ children, onPress, disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    tap();
    onPress && onPress();
  };
  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start()}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function FadeIn({ children, delay = 0, y = 14, style }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, { toValue: 1, duration: 650, delay, useNativeDriver: true }).start();
  }, [delay, value]);
  return (
    <Animated.View style={[{
      opacity: value,
      transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
}

function FieldBox({ t, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize = 'none', prefix }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.input, borderRadius: 16, borderWidth: 1, borderColor: t.cardLine, paddingHorizontal: 16 }}>
      {prefix ? <Text style={{ color: t.sub, fontSize: 18, fontWeight: '700', marginRight: 6 }}>{prefix}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 16 }}
      />
    </View>
  );
}

function PremiumButton({ t, children, onPress, disabled, secondary, icon }) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: secondary ? 'transparent' : t.graphite,
        borderColor: secondary ? t.cardLine : t.graphite,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {icon ? <Ionicons name={icon} size={18} color={secondary ? t.text : t.onGraphite} style={{ marginRight: 8 }} /> : null}
      <Text style={{ color: secondary ? t.text : t.onGraphite, fontWeight: '700', fontSize: 15 }}>{children}</Text>
    </Press>
  );
}

function AuthScreen({ t, dark, L, email, password, signupName, busy, showPolicy, setEmail, setPassword, setSignupName, setShowPolicy, login, signUp, signInWithGoogle }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior="padding">
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 34, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 24, backgroundColor: t.graphite, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <Ionicons name="shield-checkmark" size={34} color={t.onGraphite} />
          </View>
        </FadeIn>

        <FadeIn delay={90}>
          <Text style={{ color: t.text, textAlign: 'center', fontSize: compact ? 36 : 42, fontWeight: '800', letterSpacing: 0 }}>Sentinel</Text>
          <Text style={{ color: t.sub, textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 30 }}>{L.tagline}</Text>
        </FadeIn>

        <FadeIn delay={170}>
          <View style={{ backgroundColor: t.card, borderRadius: 24, borderWidth: 1, borderColor: t.cardLine, padding: 18, gap: 12, boxShadow: dark ? 'none' : '0 18px 44px rgba(34, 26, 12, 0.10)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: t.cardLine }} />
              <Text style={{ color: t.faint, fontSize: 12, fontWeight: '700' }}>PRIVATE FINANCE OS</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: t.cardLine }} />
            </View>
            <FieldBox t={t} value={signupName} onChangeText={setSignupName} placeholder={L.preferredName || 'Preferred name'} autoCapitalize="words" />
            <FieldBox t={t} value={email} onChangeText={setEmail} placeholder={L.email} keyboardType="email-address" />
            <FieldBox t={t} value={password} onChangeText={setPassword} placeholder={L.password} secureTextEntry />
            <PremiumButton t={t} onPress={login} disabled={busy} icon="mail-outline">{busy ? L.pleaseWait : L.continueEmail}</PremiumButton>
            <PremiumButton t={t} onPress={signUp} disabled={busy} secondary icon="sparkles-outline">{L.createAccount}</PremiumButton>
          </View>
        </FadeIn>

        <FadeIn delay={260}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 22 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.cardLine }} />
            <Text style={{ color: t.faint, marginHorizontal: 14, fontSize: 12 }}>{L.or}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.cardLine }} />
          </View>
          <PremiumButton t={t} onPress={() => Alert.alert('Apple', 'TestFlight / App Store only.')} icon="logo-apple">
            {L.continueApple}
          </PremiumButton>
          <View style={{ height: 12 }} />
          <PremiumButton t={t} onPress={signInWithGoogle} disabled={busy} secondary icon="logo-google">
            {L.continueGoogle}
          </PremiumButton>
          <Pressable onPress={() => setShowPolicy(true)}>
            <Text style={{ textAlign: 'center', color: t.faint, fontSize: 12, marginTop: 26, textDecorationLine: 'underline' }}>{L.legalShort}</Text>
          </Pressable>
        </FadeIn>
      </ScrollView>
      <PolicyModal visible={showPolicy} onClose={() => setShowPolicy(false)} t={t} />
    </KeyboardAvoidingView>
  );
}

function OnboardingFlow({ t, dark, name, userId, baseCur, onFinish }) {
  const [step, setStep] = useState(0);
  const [goalName, setGoalName] = useState('Emergency fund');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalCreated, setGoalCreated] = useState(false);
  const [saving, setSaving] = useState(false);
  const stage = useRef(new Animated.Value(0)).current;
  const sym = SYMBOL[baseCur] || '$';

  useEffect(() => {
    stage.setValue(0);
    Animated.spring(stage, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 4 }).start();
  }, [stage, step]);

  const saveGoalIfNeeded = async () => {
    if (saving) return;
    const target = parseMoney(goalTarget);
    const current = parseMoney(goalSaved);
    if (target > 0 && userId && !goalCreated) {
      setSaving(true);
      const { error } = await supabase.from('goals').insert([{
        user_id: userId,
        name: goalName.trim() || 'First goal',
        target_amount: target,
        current_amount: current,
        currency: baseCur,
        icon: 'flag-outline',
      }]);
      setSaving(false);
      if (error) { Alert.alert('Goal not saved', error.message); return false; }
      setGoalCreated(true);
    }
    return true;
  };

  const finish = async () => {
    const ok = await saveGoalIfNeeded();
    if (!ok) return;
    onFinish();
  };

  const next = async () => {
    if (step === 2) {
      const ok = await saveGoalIfNeeded();
      if (!ok) return;
      tap();
      setStep(3);
    } else if (step >= 3) {
      finish();
    } else {
      tap();
      setStep((s) => s + 1);
    }
  };
  const back = () => { if (step > 0) { tap(); setStep((s) => s - 1); } };
  const skip = () => { tap(); onFinish(); };

  const translateX = stage.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const pages = [
    {
      eyebrow: 'Welcome',
      title: `Hi, ${name || 'there'}.`,
      body: 'Sentinel is ready. We will keep the setup light, calm, and useful.',
      icon: 'sparkles-outline',
      content: (
        <View style={{ gap: 10, marginTop: 28 }}>
          {['Private by default', 'Built around goals', 'Designed for quick daily check-ins'].map((x, i) => (
            <FadeIn key={x} delay={220 + i * 90}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: t.cardLine }}>
                <Ionicons name="checkmark-circle" size={18} color={t.green} style={{ marginRight: 10 }} />
                <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '600' }}>{x}</Text>
              </View>
            </FadeIn>
          ))}
        </View>
      ),
    },
    {
      eyebrow: 'What Sentinel Watches',
      title: 'Your money picture, condensed.',
      body: 'Net worth, spend targets, upcoming charges, cash flow, and alerts live together so you do not have to hunt for context.',
      icon: 'analytics-outline',
      content: (
        <View style={{ gap: 12, marginTop: 26 }}>
          {[
            ['wallet-outline', 'Net worth', 'Track cash, bank, investments, crypto, property, and business assets.'],
            ['pulse-outline', 'Alerts', 'See overspending, negative cash flow, and goals that may need attention.'],
            ['calculator-outline', 'Tools', 'Use calculators and currency conversion without leaving the app.'],
          ].map(([icon, title, body]) => (
            <View key={title} style={{ flexDirection: 'row', backgroundColor: t.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.cardLine }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name={icon} size={19} color={t.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
                <Text style={{ color: t.sub, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      ),
    },
    {
      eyebrow: 'First Goal',
      title: 'Choose something to build toward.',
      body: 'Start with one target. You can edit it later, and you can skip this now.',
      icon: 'flag-outline',
      content: (
        <View style={{ backgroundColor: t.card, borderRadius: 22, borderWidth: 1, borderColor: t.cardLine, padding: 18, gap: 12, marginTop: 26 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['Emergency fund', '6000'],
              ['New car', '25000'],
              ['Vacation', '3000'],
            ].map(([label, amount]) => (
              <Press key={label} onPress={() => { setGoalName(label); setGoalTarget(amount); }} style={{ backgroundColor: goalName === label ? t.graphite : t.bg2, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12 }}>
                <Text style={{ color: goalName === label ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '700' }}>{label}</Text>
              </Press>
            ))}
          </View>
          <FieldBox t={t} value={goalName} onChangeText={setGoalName} placeholder="Goal name" autoCapitalize="words" />
          <FieldBox t={t} value={goalTarget} onChangeText={setGoalTarget} placeholder="Target amount" keyboardType="decimal-pad" prefix={sym} />
          <FieldBox t={t} value={goalSaved} onChangeText={setGoalSaved} placeholder="Already saved (optional)" keyboardType="decimal-pad" prefix={sym} />
          {parseMoney(goalTarget) > 0 ? (
            <Text style={{ color: t.sub, fontSize: 13, lineHeight: 18 }}>
              Sentinel will track {formatMoney(parseMoney(goalSaved), sym)} saved toward {formatMoney(parseMoney(goalTarget), sym)}.
            </Text>
          ) : null}
        </View>
      ),
    },
    {
      eyebrow: 'Daily Rhythm',
      title: 'Three taps to stay clear.',
      body: 'Add transactions as they happen, review alerts when the badge appears, and open Goals when you want to update progress.',
      icon: 'compass-outline',
      content: (
        <View style={{ gap: 12, marginTop: 26 }}>
          {[
            ['add-circle-outline', 'Add', 'Record spend, income, subscriptions, rent, insurance, and utilities.'],
            ['shield-checkmark-outline', 'Review', 'Use the home screen as your morning summary.'],
            ['flag-outline', 'Update', 'Keep your goals current so the app can guide you.'],
          ].map(([icon, title, body], i) => (
            <View key={title} style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: t.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: t.cardLine }}>
              <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: i === 0 ? t.graphite : t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
                <Ionicons name={icon} size={17} color={i === 0 ? t.onGraphite : t.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
                <Text style={{ color: t.sub, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      ),
    },
  ];
  const page = pages[step];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 54, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }}>
          <Pressable onPress={back} disabled={step === 0} style={{ opacity: step === 0 ? 0 : 1, padding: 8 }}>
            <Ionicons name="chevron-back" size={24} color={t.text} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {pages.map((_, i) => <View key={i} style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 7, backgroundColor: i === step ? t.graphite : t.cardLine }} />)}
          </View>
          <Pressable onPress={skip} style={{ padding: 8 }}>
            <Text style={{ color: t.sub, fontSize: 13, fontWeight: '700' }}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View style={{ flex: 1, opacity: stage, transform: [{ translateX }] }}>
          <View style={{ width: 68, height: 68, borderRadius: 24, backgroundColor: t.graphite, alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
            <Ionicons name={page.icon} size={31} color={t.onGraphite} />
          </View>
          <Text style={{ color: t.gold, fontSize: 12, fontWeight: '800', letterSpacing: 0, marginBottom: 12 }}>{page.eyebrow.toUpperCase()}</Text>
          <Text style={{ color: t.text, fontSize: 38, lineHeight: 43, fontWeight: '800', letterSpacing: 0 }}>{page.title}</Text>
          <Text style={{ color: t.sub, fontSize: 16, lineHeight: 24, marginTop: 14 }}>{page.body}</Text>
          {page.content}
        </Animated.View>

        <View style={{ marginTop: 28, gap: 12 }}>
          <PremiumButton t={t} onPress={next} disabled={saving} icon={step >= 3 ? 'checkmark-outline' : 'arrow-forward-outline'}>
            {saving ? 'Saving...' : step === 2 ? (parseMoney(goalTarget) > 0 ? 'Save goal and continue' : 'Continue without goal') : step >= 3 ? 'Enter Sentinel' : 'Continue'}
          </PremiumButton>
          <Pressable onPress={skip} style={{ paddingVertical: 8 }}>
            <Text style={{ color: t.faint, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>Skip setup</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Sentinel() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto');
  const dark = themeMode === 'auto' ? systemScheme === 'dark' : themeMode === 'dark';
  const t = palette(dark);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');
  const [lang, setLang] = useState('en');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const [balance, setBalance] = useState(0);
  const [target, setTarget] = useState(0);
  const [baseCur, setBaseCur] = useState('USD');
  const [txs, setTxs] = useState([]);
  const [subs, setSubs] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showBal, setShowBal] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [subSort, setSubSort] = useState('soonest');
  const [assets, setAssets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [displayName, setDisplayName] = useState('');
  const [signupName, setSignupName] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  const pendingName = useRef(null);

  const L = STRINGS[lang] || STRINGS.en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadAll();
      setLoading(false);
    });
    const { data: l } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) {
        if (pendingName.current) {
          await supabase.from('user_settings').upsert({ user_id: s.user.id, display_name: pendingName.current, updated_at: new Date().toISOString() });
          setDisplayName(pendingName.current);
          setOnboardingName(pendingName.current);
          setOnboardingActive(true);
          pendingName.current = null;
        }
        loadAll();
      }
    });
    return () => l?.subscription.unsubscribe();
    // The auth subscription should only be installed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => { loadSettings(); loadTxs(); loadSubs(); loadAssets(); loadGoals(); };
  const loadAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('updated_at', { ascending: false });
    if (data) setAssets(data);
  };
  const loadGoals = async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (data) setGoals(data);
  };
  const loadSettings = async () => {
    const { data } = await supabase.from('user_settings').select('*').maybeSingle();
    if (data) {
      setBalance(Number(data.balance) || 0); setTarget(Number(data.target_spend) || 0);
      setBaseCur(data.base_currency || 'USD'); setLang(data.language || 'en');
      setDisplayName(data.display_name || '');
    }
  };
  const loadTxs = async () => {
    const { data } = await supabase.from('transactions').select('*').order('tx_date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setTxs(data);
  };
  const loadSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('next_charge_date', { ascending: true });
    if (data) setSubs(data);
  };

  const setBalanceDB = async (newBal) => {
    setBalance(newBal);
    if (session) await supabase.from('user_settings').upsert({ user_id: session.user.id, balance: newBal, updated_at: new Date().toISOString() });
  };
  const changeLang = async (l) => {
    setLang(l);
    if (session) await supabase.from('user_settings').upsert({ user_id: session.user.id, language: l, updated_at: new Date().toISOString() });
  };

  const signUp = async () => {
    const cleanName = signupName.trim();
    if (!cleanName) { Alert.alert('Name required', 'Add your preferred name so Sentinel can personalize setup.'); return; }
    if (!email.trim() || !password.trim()) { Alert.alert('Details required', 'Enter your email and password to create the account.'); return; }
    setBusy(true);
    pendingName.current = cleanName;
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (!error) {
      setOnboardingName(cleanName);
      if (data.session) {
        await supabase.from('user_settings').upsert({ user_id: data.user.id, display_name: cleanName, updated_at: new Date().toISOString() });
        setDisplayName(cleanName);
        setOnboardingActive(true);
        pendingName.current = null;
      } else {
        Alert.alert('Check your email', 'Confirm your account, then sign in and Sentinel will finish setup.');
      }
    } else {
      pendingName.current = null;
      Alert.alert('Error', error.message);
    }
    setBusy(false);
  };
  const editName = () => {
    Alert.prompt(
      (L.preferredName || 'Preferred name'), '',
      async (text) => {
        const v = (text || '').trim();
        setDisplayName(v);
        if (session) await supabase.from('user_settings').upsert({ user_id: session.user.id, display_name: v, updated_at: new Date().toISOString() });
      },
      'plain-text', displayName
    );
  };
  const login = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setBusy(false);
  };
  const signInWithGoogle = async () => {
    try {
      setBusy(true);
      const redirectUrl = Linking.createURL('');
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl, skipBrowserRedirect: true } });
      if (error) { Alert.alert('Error', error.message); setBusy(false); return; }
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (res.type === 'success' && res.url) {
        const params = new URLSearchParams(res.url.split('#')[1] || res.url.split('?')[1] || '');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) await supabase.auth.setSession({ access_token, refresh_token });
      }
    } catch (e) { Alert.alert('Error', String(e)); } finally { setBusy(false); }
  };

  /* derived */
  const now = new Date();
  const thisMonth = (d) => { const x = new Date(d); return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear(); };
  const outflowTxs = txs.filter((x) => !INFLOW.includes(x.type) && x.type !== 'Savings');
  const monthSpend = outflowTxs.filter((x) => thisMonth(x.tx_date)).reduce((s, x) => s + convert(x.amount, x.currency || 'USD', baseCur), 0);
  const over = target > 0 && monthSpend > target;
  const pct = target > 0 ? Math.min(monthSpend / target, 1) : 0;
  const byCat = {};
  outflowTxs.filter((x) => thisMonth(x.tx_date)).forEach((x) => { const c = x.category || 'Other'; byCat[c] = (byCat[c] || 0) + convert(x.amount, x.currency || 'USD', baseCur); });
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const catMax = topCats.length ? topCats[0][1] : 1;

  /* net worth from assets */
  const netWorth = assets.reduce((s, a) => s + convert(Number(a.amount) || 0, a.currency || 'USD', baseCur), 0);
  const assetByKind = {};
  assets.forEach((a) => { const k = a.kind || 'cash'; assetByKind[k] = (assetByKind[k] || 0) + convert(Number(a.amount) || 0, a.currency || 'USD', baseCur); });

  /* monthly cash flow */
  const monthInflow = txs.filter((x) => INFLOW.includes(x.type) && thisMonth(x.tx_date)).reduce((s, x) => s + convert(x.amount, x.currency || 'USD', baseCur), 0);
  const cashFlow = monthInflow - monthSpend;

  /* upcoming charges within 7 days */
  const daysUntil = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((x - n) / 86400000); };
  const upcoming = subs.filter((s) => { const dd = daysUntil(s.next_charge_date); return dd >= 0 && dd <= 7; }).sort((a, b) => new Date(a.next_charge_date) - new Date(b.next_charge_date));
  const upcomingTotal = upcoming.reduce((s, x) => s + convert(x.amount, baseCur, baseCur), 0);

  /* Sentinel Alerts \u2014 computed from real data */
  const alerts = [];
  if (over) alerts.push({ icon: 'warning-outline', tone: 'warn', title: 'Spending over target', body: `You've spent ${sym0(baseCur)}${monthSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} \u2014 past your ${sym0(baseCur)}${target.toLocaleString()} monthly target.` });
  else if (target > 0 && pct >= 0.85) alerts.push({ icon: 'alert-circle-outline', tone: 'warn', title: 'Almost at your target', body: `You're at ${Math.round(pct * 100)}% of your monthly spending target.` });
  if (cashFlow < 0) alerts.push({ icon: 'trending-down-outline', tone: 'warn', title: 'Negative cash flow', body: `You're spending ${sym0(baseCur)}${Math.abs(cashFlow).toLocaleString(undefined, { maximumFractionDigits: 0 })} more than you earned this month.` });
  upcoming.forEach((s) => { const dd = daysUntil(s.next_charge_date); alerts.push({ icon: 'time-outline', tone: 'info', title: `${s.name} due ${dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : `in ${dd} days`}`, body: `${sym0(baseCur)}${Number(s.amount).toFixed(2)} on ${s.next_charge_date}.` }); });
  goals.forEach((g) => {
    const gp = Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0;
    if (g.deadline) { const d = new Date(g.deadline), nn = new Date(); const ml = (d.getFullYear() - nn.getFullYear()) * 12 + (d.getMonth() - nn.getMonth()); if (ml >= 0 && ml <= 2 && gp < 0.9) alerts.push({ icon: 'flag-outline', tone: 'warn', title: `Goal "${g.name}" falling behind`, body: `${Math.round(gp * 100)}% saved with ${ml === 0 ? 'less than a month' : ml + ' months'} left.` }); }
  });

  const sym = SYMBOL[baseCur] || '$';
  const name = displayName || (session?.user?.email ? session.user.email.split('@')[0] : '');
  const greeting = now.getHours() < 12 ? L.greet.morning : now.getHours() < 18 ? L.greet.afternoon : L.greet.evening;

  if (loading) {
    return (<View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={t.graphite} /></View>);
  }

  /* LOGIN */
  if (!session) {
    return (
      <AuthScreen
        t={t}
        dark={dark}
        L={L}
        email={email}
        password={password}
        signupName={signupName}
        busy={busy}
        showPolicy={showPolicy}
        setEmail={setEmail}
        setPassword={setPassword}
        setSignupName={setSignupName}
        setShowPolicy={setShowPolicy}
        login={login}
        signUp={signUp}
        signInWithGoogle={signInWithGoogle}
      />
    );
  }

  if (onboardingActive) {
    return (
      <OnboardingFlow
        t={t}
        dark={dark}
        name={onboardingName || name}
        userId={session.user.id}
        baseCur={baseCur}
        onFinish={() => {
          setOnboardingActive(false);
          loadAll();
        }}
      />
    );
  }

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: t.card, borderRadius: 22, padding: 22, borderWidth: dark ? 1 : 0, borderColor: t.cardLine, boxShadow: dark ? 'none' : '0 16px 36px rgba(34, 26, 12, 0.08)' }, style]}>{children}</View>
  );

  const Home = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.sub, fontSize: 14, fontWeight: '600' }}>{greeting},</Text>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800', letterSpacing: 0, marginTop: 3, textTransform: 'capitalize' }}>{name}</Text>
        </View>
        <Press onPress={() => setTab('alerts')} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: alerts.length ? t.warn : t.card, borderWidth: alerts.length ? 0 : 1, borderColor: t.cardLine, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={alerts.length ? 'notifications' : 'notifications-outline'} size={20} color={alerts.length ? '#fff' : t.text} />
        </Press>
      </View>

      {/* NET WORTH */}
      <Card style={{ marginBottom: 14, padding: 24, backgroundColor: t.graphite }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View>
            <Text style={{ color: t.onGraphite, opacity: 0.74, fontSize: 13, fontWeight: '700' }}>NET WORTH</Text>
            <Text style={{ color: t.onGraphite, opacity: 0.58, fontSize: 12.5, marginTop: 3 }}>Assets tracked by Sentinel</Text>
          </View>
          <Ionicons name="shield-checkmark" size={18} color={t.onGraphite} />
        </View>
        <AnimatedNumber value={netWorth} prefix={sym} t={{ ...t, text: t.onGraphite }} size={46} weight="800" />
        {assets.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
            {Object.entries(assetByKind).filter(([, v]) => v > 0).map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.14)', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 11, marginRight: 8, marginBottom: 8 }}>
                <Ionicons name={ASSET_ICON[k]} size={13} color={t.onGraphite} style={{ marginRight: 6 }} />
                <Text style={{ color: t.onGraphite, opacity: 0.86, fontSize: 12.5, fontWeight: '700' }}>{ASSET_LABEL[k]} {sym}{v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ))}
          </View>
        )}
        <Press onPress={() => setShowAssets(true)} style={{ marginTop: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.24)', borderRadius: 13, paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="layers-outline" size={15} color={t.onGraphite} style={{ marginRight: 7 }} />
          <Text style={{ color: t.onGraphite, fontSize: 13.5, fontWeight: '700' }}>Manage Assets</Text>
        </Press>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <Press onPress={() => setShowAdd(true)} style={{ flex: 1, backgroundColor: t.graphite, borderRadius: 18, paddingVertical: 17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="add" size={20} color={t.onGraphite} />
          <Text style={{ color: t.onGraphite, fontWeight: '700', fontSize: 15, marginLeft: 6 }}>{L.addTransaction}</Text>
        </Press>
        <Press onPress={() => setTab('goals')} style={{ width: 58, backgroundColor: t.card, borderWidth: 1, borderColor: t.cardLine, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flag-outline" size={20} color={t.text} />
        </Press>
      </View>

      {/* MONTHLY SPEND vs TARGET */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{L.thisMonth}</Text>
          <Text style={{ color: over ? t.warn : t.sub, fontSize: 13, fontWeight: '600' }}>{target > 0 ? `${Math.round(pct * 100)}${L.ofTarget}` : L.noTarget}</Text>
        </View>
        <Text style={{ color: over ? t.warn : t.text, fontSize: 31, fontWeight: '800', letterSpacing: 0, marginBottom: 14, fontVariant: ['tabular-nums'] }}>{sym}{monthSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View style={{ height: 9, borderRadius: 5, backgroundColor: t.bg2, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(pct * 100, target > 0 ? 4 : 0)}%`, height: '100%', borderRadius: 5, backgroundColor: over ? t.warn : t.mint }} />
        </View>
        {target > 0 && !over && <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 12 }}>{sym}{(target - monthSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })} {L.leftOf} {sym}{target.toLocaleString()} {L.targetWord}</Text>}
        {over && <Text style={{ color: t.warn, fontSize: 12.5, marginTop: 12 }}>{L.overTarget}</Text>}
      </Card>

      {/* CASH FLOW */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 14 }}>Monthly Cash Flow</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            ['In', monthInflow, t.green, 'arrow-down-left'],
            ['Out', monthSpend, t.text, 'arrow-up-right'],
            ['Net', Math.abs(cashFlow), cashFlow >= 0 ? t.green : t.warn, cashFlow >= 0 ? 'trending-up' : 'trending-down'],
          ].map(([label, value, color, icon]) => (
            <View key={label} style={{ flex: 1, backgroundColor: t.bg2, borderRadius: 14, padding: 12 }}>
              <Ionicons name={icon} size={15} color={color} />
              <Text style={{ color: t.sub, fontSize: 12, marginTop: 8 }}>{label}</Text>
              <Text style={{ color, fontSize: 16, fontWeight: '800', marginTop: 3, fontVariant: ['tabular-nums'] }}>{label === 'Net' && cashFlow >= 0 ? '+' : label === 'Net' ? '\u2212' : ''}{sym}{Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* UPCOMING CHARGES */}
      <Press onPress={() => setTab('subs')}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: upcoming.length ? 14 : 0 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Next 7 Days</Text>
            <Text style={{ color: t.sub, fontSize: 13, fontWeight: '600' }}>{sym}{upcomingTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
          {upcoming.length === 0 ? <Text style={{ color: t.faint, fontSize: 13.5 }}>No charges coming up. You are clear.</Text> : upcoming.slice(0, 3).map((s) => {
            const dd = daysUntil(s.next_charge_date);
            return (
              <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 }}>
                <Text style={{ color: t.text, fontSize: 14 }}>{s.name}</Text>
                <Text style={{ color: t.sub, fontSize: 13 }}>{dd === 0 ? 'Today' : dd === 1 ? 'Tomorrow' : `${dd}d`} {'\u00B7'} {sym}{Number(s.amount).toFixed(0)}</Text>
              </View>
            );
          })}
        </Card>
      </Press>

      {/* SENTINEL ALERTS */}
      <Press onPress={() => setTab('alerts')}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: alerts.length ? 14 : 0 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Sentinel Alerts</Text>
            {alerts.length > 0 && <View style={{ backgroundColor: t.warn, borderRadius: 10, minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{alerts.length}</Text></View>}
          </View>
          {alerts.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="checkmark-circle" size={17} color="#34C759" style={{ marginRight: 8 }} /><Text style={{ color: t.sub, fontSize: 13.5 }}>All clear. Nothing needs your attention.</Text></View>
          ) : alerts.slice(0, 3).map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7 }}>
              <Ionicons name={a.icon} size={16} color={a.tone === 'warn' ? t.warn : t.sub} style={{ marginRight: 10, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{a.title}</Text>
                <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 1 }}>{a.body}</Text>
              </View>
            </View>
          ))}
        </Card>
      </Press>

      {/* GOALS PROGRESS */}
      <Press onPress={() => setTab('goals')}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: goals.length ? 16 : 0 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Goals</Text>
            <Ionicons name="chevron-forward" size={16} color={t.faint} />
          </View>
          {goals.length === 0 ? <Text style={{ color: t.faint, fontSize: 13.5 }}>No goals yet. Tap to set your first target.</Text> : goals.slice(0, 2).map((g) => {
            const gp = Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0;
            return (
              <View key={g.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: t.sub, fontSize: 13.5 }}>{g.name}</Text>
                  <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '600' }}>{Math.round(gp * 100)}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bg2, overflow: 'hidden' }}><View style={{ width: `${Math.min(gp * 100, 100)}%`, height: '100%', backgroundColor: gp >= 1 ? '#34C759' : t.graphite, borderRadius: 3 }} /></View>
              </View>
            );
          })}
        </Card>
      </Press>

      {/* TOP CATEGORIES */}
      {topCats.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 18 }}>{L.topCategories}</Text>
          {topCats.map(([c, v]) => (
            <View key={c} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: t.sub, fontSize: 13.5 }}>{(CAT_LABEL[lang] && CAT_LABEL[lang][c]) || c}</Text>
                <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '600' }}>{sym}{v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bg2, overflow: 'hidden' }}><View style={{ width: `${(v / catMax) * 100}%`, height: '100%', backgroundColor: t.graphite, borderRadius: 3 }} /></View>
            </View>
          ))}
        </Card>
      )}

      {/* SENTINEL BRIEF (premium teaser) */}
      <Card style={{ opacity: 0.85 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>Sentinel Brief</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10 }}>
            <Ionicons name="lock-closed" size={12} color={t.sub} style={{ marginRight: 5 }} />
            <Text style={{ color: t.sub, fontSize: 11.5, fontWeight: '700' }}>PREMIUM</Text>
          </View>
        </View>
        <Text style={{ color: t.sub, fontSize: 13.5, marginTop: 10, lineHeight: 19 }}>Your daily 2-minute finance briefing - markets, crypto, currencies and economy, summarized. Arriving with Sentinel Premium.</Text>
      </Card>
    </ScrollView>
  );

  const AlertsScreen = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Press onPress={() => setTab('home')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <Ionicons name="chevron-back" size={22} color={t.text} /><Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginLeft: 2 }}>Home</Text>
      </Press>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 4 }}>Sentinel Alerts</Text>
      <Text style={{ color: t.sub, fontSize: 14, marginBottom: 24 }}>What needs your attention.</Text>
      {alerts.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Ionicons name="checkmark-circle-outline" size={30} color="#34C759" /></View>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>All clear</Text>
          <Text style={{ color: t.sub, fontSize: 13.5, textAlign: 'center', paddingHorizontal: 30 }}>Nothing needs your attention right now. Sentinel will let you know.</Text>
        </View>
      ) : alerts.map((a, i) => (
        <Card key={i} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', padding: 18 }}>
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: a.tone === 'warn' ? (dark ? '#2A1515' : '#FBEAEA') : t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Ionicons name={a.icon} size={18} color={a.tone === 'warn' ? t.warn : t.text} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{a.title}</Text>
            <Text style={{ color: t.sub, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{a.body}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const Transactions = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 4 }}>{L.transactions}</Text>
      <Text style={{ color: t.sub, fontSize: 14, marginBottom: 24 }}>{L.txSubtitle}</Text>
      {txs.length === 0 ? (<Text style={{ color: t.faint, textAlign: 'center', marginTop: 60 }}>{L.noTx}</Text>) : txs.map((x) => (
        <Card key={x.id} style={{ marginBottom: 12, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Ionicons name={CAT_ICON[x.category] || 'card-outline'} size={19} color={t.text} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{x.description || (TYPE_LABEL[lang] && TYPE_LABEL[lang][x.type]) || x.type}</Text>
            <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 2 }}>{(CAT_LABEL[lang] && CAT_LABEL[lang][x.category]) || x.category || x.type} {'\u00B7'} {x.tx_date}</Text>
          </View>
          <Text style={{ color: INFLOW.includes(x.type) ? '#34C759' : t.text, fontSize: 15.5, fontWeight: '700' }}>{INFLOW.includes(x.type) ? '+' : '\u2212'}{SYMBOL[x.currency] || '$'}{Number(x.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Press onPress={() => { Alert.alert(L.deleteQ, x.description || x.type, [{ text: L.cancel }, { text: L.del, style: 'destructive', onPress: async () => {
            await supabase.from('transactions').delete().eq('id', x.id);
            const deltaBase = convert(x.amount, x.currency || 'USD', baseCur);
            const newBal = INFLOW.includes(x.type) ? balance - deltaBase : balance + deltaBase;
            await setBalanceDB(newBal); loadTxs();
          } }]); }} style={{ marginLeft: 10, padding: 4 }}><Ionicons name="trash-outline" size={17} color={t.faint} /></Press>
        </Card>
      ))}
    </ScrollView>
  );

  const Analytics = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 24 }}>{L.analytics}</Text>
      <Card style={{ marginBottom: 18 }}>
        <Text style={{ color: t.sub, fontSize: 13, marginBottom: 6 }}>{L.spentThisMonth}</Text>
        <Text style={{ color: over ? t.warn : t.text, fontSize: 38, fontWeight: '700', letterSpacing: 0, fontVariant: ['tabular-nums'] }}>{sym}{monthSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </Card>
      <Card style={{ marginBottom: 18 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 18 }}>{L.byCategory}</Text>
        {topCats.length === 0 ? <Text style={{ color: t.faint }}>{L.noSpending}</Text> : topCats.map(([c, v]) => (
          <View key={c} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: t.sub, fontSize: 13.5 }}>{(CAT_LABEL[lang] && CAT_LABEL[lang][c]) || c}</Text>
              <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '600' }}>{sym}{v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: t.bg2, overflow: 'hidden' }}><View style={{ width: `${(v / catMax) * 100}%`, height: '100%', backgroundColor: t.graphite, borderRadius: 3 }} /></View>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{L.recurring}</Text>
        <Text style={{ color: t.sub, fontSize: 13.5 }}>{subs.length} {L.active} {'\u00B7'} {sym}{subs.reduce((s, x) => s + convert(x.amount, baseCur, baseCur), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} / {L.cycle}</Text>
      </Card>
    </ScrollView>
  );

  const sortedSubs = [...subs].sort((a, b) => {
    if (subSort === 'largest') return Number(b.amount) - Number(a.amount);
    if (subSort === 'alpha') return (a.name || '').localeCompare(b.name || '');
    return new Date(a.next_charge_date) - new Date(b.next_charge_date);
  });

  const Subscriptions = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Press onPress={() => setTab('home')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <Ionicons name="chevron-back" size={22} color={t.text} /><Text style={{ color: t.text, fontSize: 16, fontWeight: '600', marginLeft: 2 }}>Home</Text>
      </Press>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 4 }}>{L.subscriptions}</Text>
      <Text style={{ color: t.sub, fontSize: 14, marginBottom: 18 }}>{L.subsSubtitle}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[['soonest', L.soonest], ['largest', L.largest], ['alpha', L.az]].map(([k, lbl]) => (
          <Press key={k} onPress={() => setSubSort(k)} style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, backgroundColor: subSort === k ? t.graphite : t.bg2 }}>
            <Text style={{ color: subSort === k ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '600' }}>{lbl}</Text>
          </Press>
        ))}
      </View>
      {sortedSubs.length === 0 ? (<Text style={{ color: t.faint, textAlign: 'center', marginTop: 40 }}>{L.noSubs}</Text>) : sortedSubs.map((s) => (
        <Card key={s.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{s.name}</Text>
            <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 3 }}>{(TYPE_LABEL[lang] && TYPE_LABEL[lang][s.category]) || s.category || 'Subscription'} {'\u00B7'} {L.next} {s.next_charge_date}</Text>
          </View>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', marginRight: 10 }}>{sym}{Number(s.amount).toFixed(2)}</Text>
          <Press onPress={() => { Alert.alert(L.deleteQ, s.name, [{ text: L.cancel }, { text: L.del, style: 'destructive', onPress: async () => { await supabase.from('subscriptions').delete().eq('id', s.id); loadSubs(); } }]); }} style={{ padding: 4 }}><Ionicons name="trash-outline" size={17} color={t.faint} /></Press>
        </Card>
      ))}
    </ScrollView>
  );

  const SettingsRow = ({ icon, label, value, onPress, danger }) => (
    <Press onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.cardLine }}>
      <Ionicons name={icon} size={19} color={danger ? t.warn : t.text} style={{ marginRight: 14 }} />
      <Text style={{ flex: 1, color: danger ? t.warn : t.text, fontSize: 15 }}>{label}</Text>
      {value ? <Text style={{ color: t.sub, fontSize: 14 }}>{value}</Text> : <Ionicons name="chevron-forward" size={17} color={t.faint} />}
    </Press>
  );

  const Settings = () => (
    <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: 0, marginBottom: 24 }}>{L.settings}</Text>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 6, marginLeft: 4 }}>{L.appearance}</Text>
      <Card style={{ marginBottom: 22, paddingVertical: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, padding: 8 }}>
          {[['auto', L.automatic], ['light', L.light], ['dark', L.dark]].map(([k, lbl]) => (
            <Press key={k} onPress={() => setThemeMode(k)} style={{ flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: themeMode === k ? t.graphite : t.bg2 }}>
              <Text style={{ color: themeMode === k ? t.onGraphite : t.sub, textAlign: 'center', fontSize: 13.5, fontWeight: '600' }}>{lbl}</Text>
            </Press>
          ))}
        </View>
      </Card>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 6, marginLeft: 4 }}>{L.languageCaps}</Text>
      <Card style={{ marginBottom: 22, paddingVertical: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 }}>
          {LANGS.map(([k, lbl]) => (
            <Press key={k} onPress={() => changeLang(k)} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: lang === k ? t.graphite : t.bg2 }}>
              <Text style={{ color: lang === k ? t.onGraphite : t.sub, fontSize: 13.5, fontWeight: '600' }}>{lbl}</Text>
            </Press>
          ))}
        </View>
      </Card>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 6, marginLeft: 4 }}>{L.account}</Text>
      <Card style={{ marginBottom: 22, paddingVertical: 4 }}>
        <SettingsRow icon="person-outline" label={L.email} value={session.user.email} />
        <SettingsRow icon="happy-outline" label={L.preferredName || 'Preferred name'} value={displayName || '\u2014'} onPress={editName} />
        <SettingsRow icon="card-outline" label={L.baseCurrency} value={baseCur} onPress={() => setShowBal(true)} />
        <View style={{ height: 1 }} />
      </Card>
      <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 6, marginLeft: 4 }}>SENTINEL</Text>
      <Card style={{ marginBottom: 22, paddingVertical: 4 }}>
        <SettingsRow icon="diamond-outline" label={L.plan} value={L.free} onPress={() => Alert.alert('Sentinel', '\u2192 soon')} />
        <SettingsRow icon="help-circle-outline" label={L.helpCenter} onPress={() => Alert.alert('Support', 'support@sentinel.app')} />
      </Card>
      <Press onPress={() => supabase.auth.signOut()} style={{ borderWidth: 1, borderColor: t.cardLine, borderRadius: 14, paddingVertical: 15 }}>
        <Text style={{ color: t.warn, textAlign: 'center', fontWeight: '600', fontSize: 15 }}>{L.signOut}</Text>
      </Press>
      <Pressable onPress={() => setShowPolicy(true)}>
        <Text style={{ textAlign: 'center', color: t.faint, fontSize: 12, marginTop: 20, textDecorationLine: 'underline' }}>{L.legalFull}</Text>
      </Pressable>
    </ScrollView>
  );

  const ToolsScreen = () => <Tools t={t} baseCur={baseCur} />;
  const GoalsScreen = () => <Goals t={t} baseCur={baseCur} userId={session.user.id} goals={goals} reload={loadGoals} />;

  const screens = { home: Home, tx: Transactions, analytics: Analytics, tools: ToolsScreen, goals: GoalsScreen, settings: Settings, subs: Subscriptions, alerts: AlertsScreen };
  const Active = screens[tab] || Home;
  const NAV = [['home', 'home-outline', 'home'], ['tx', 'receipt-outline', 'receipt'], ['tools', 'calculator-outline', 'calculator'], ['goals', 'flag-outline', 'flag'], ['settings', 'settings-outline', 'settings']];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <Active />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.cardLine, flexDirection: 'row', paddingTop: 10, paddingBottom: 28, paddingHorizontal: 8 }}>
        {NAV.map(([key, out, fill]) => (
          <Pressable key={key} onPress={() => setTab(key)} style={{ flex: 1, alignItems: 'center' }}><Ionicons name={tab === key ? fill : out} size={23} color={tab === key ? t.text : t.faint} /></Pressable>
        ))}
      </View>
      <AddSheet visible={showAdd} onClose={() => setShowAdd(false)} t={t} L={L} lang={lang} baseCur={baseCur} balance={balance} userId={session.user.id} onSaved={() => { loadTxs(); loadSubs(); }} onBalanceChange={setBalanceDB} />
      <BalanceSheet visible={showBal} onClose={() => setShowBal(false)} t={t} L={L} userId={session.user.id} balance={balance} target={target} baseCur={baseCur} onSaved={(b, tg, c) => { setBalance(b); setTarget(tg); setBaseCur(c); }} />
      <AssetsSheet visible={showAssets} onClose={() => setShowAssets(false)} t={t} userId={session.user.id} baseCur={baseCur} assets={assets} reload={loadAssets} />
      <PolicyModal visible={showPolicy} onClose={() => setShowPolicy(false)} t={t} />
    </View>
  );
}

/* ============================================================
   ADD TRANSACTION SHEET
   ============================================================ */
function AddSheet({ visible, onClose, t, L, lang, baseCur, balance, userId, onSaved, onBalanceChange }) {
  const [type, setType] = useState('Spend');
  const [amount, setAmount] = useState('');
  const [cur, setCur] = useState(baseCur);
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Food');
  const [date, setDate] = useState('');
  const [freq, setFreq] = useState('Monthly');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setCur(baseCur); }, [baseCur, visible]);
  const recurring = RECURRING.includes(type);

  const save = async () => {
    if (!amount.trim()) { Alert.alert(L.amountReq, L.enterAmount); return; }
    setBusy(true);
    let error;
    if (recurring) {
      if (!date.trim()) { Alert.alert(L.dateReq, L.enterDate); setBusy(false); return; }
      ({ error } = await supabase.from('subscriptions').insert([{ user_id: userId, name: desc || type, amount: parseFloat(amount), next_charge_date: date, category: type, status: 'active' }]));
    } else {
      ({ error } = await supabase.from('transactions').insert([{ user_id: userId, type, amount: parseFloat(amount), currency: cur, description: desc || type, category: cat, tx_date: new Date().toISOString().slice(0, 10) }]));
      if (!error) {
        const deltaBase = convert(parseFloat(amount), cur, baseCur);
        const newBal = INFLOW.includes(type) ? balance + deltaBase : balance - deltaBase;
        await onBalanceChange(newBal);
      }
    }
    setBusy(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setAmount(''); setDesc(''); setDate('');
    onSaved(); onClose();
  };

  const Chip = ({ label, active, onPress }) => (
    <Press onPress={onPress} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 11, marginRight: 8, marginBottom: 8, backgroundColor: active ? t.graphite : t.bg2 }}>
      <Text style={{ color: active ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Press>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 22 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{L.addTransaction}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={26} color={t.sub} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.type}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 22 }}>{TX_TYPES.map((x) => <Chip key={x} label={(TYPE_LABEL[lang] && TYPE_LABEL[lang][x]) || x} active={type === x} onPress={() => setType(x)} />)}</View>
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.amount}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg2, borderRadius: 16, paddingHorizontal: 18, marginBottom: 14 }}>
            <Text style={{ color: t.text, fontSize: 30, fontWeight: '700' }}>{SYMBOL[cur] || '$'}</Text>
            <TextInput placeholder="0.00" placeholderTextColor={t.faint} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={{ flex: 1, color: t.text, fontSize: 30, fontWeight: '700', paddingVertical: 18, marginLeft: 4 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
            {CURRENCIES.map((c) => (<Press key={c} onPress={() => setCur(c)} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 9, marginRight: 8, backgroundColor: cur === c ? t.graphite : t.bg2 }}><Text style={{ color: cur === c ? t.onGraphite : t.sub, fontSize: 12.5, fontWeight: '600' }}>{c}</Text></Press>))}
          </ScrollView>
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.description}</Text>
          <TextInput placeholder={recurring ? L.phRec : L.phSpend} placeholderTextColor={t.faint} value={desc} onChangeText={setDesc} style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 15, fontSize: 15, color: t.text, marginBottom: 22 }} />
          {!recurring && (<>
            <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.category}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 22 }}>{CATEGORIES.map((c) => <Chip key={c} label={(CAT_LABEL[lang] && CAT_LABEL[lang][c]) || c} active={cat === c} onPress={() => setCat(c)} />)}</View>
          </>)}
          {recurring && (<>
            <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.nextChargeCaps}</Text>
            <TextInput placeholder="2026-06-14" placeholderTextColor={t.faint} value={date} onChangeText={setDate} style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 15, fontSize: 15, color: t.text, marginBottom: 18 }} />
            <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.frequency}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 }}>{FREQ.map((f) => <Chip key={f} label={(FREQ_LABEL[lang] && FREQ_LABEL[lang][f]) || f} active={freq === f} onPress={() => setFreq(f)} />)}</View>
            {amount.trim() !== '' && date.trim() !== '' && (<Text style={{ color: t.sub, fontSize: 13.5, marginBottom: 10 }}>{desc || type} {L.willCharge} {SYMBOL[cur] || '$'}{amount} {L.on} {date}.</Text>)}
          </>)}
          <Press onPress={save} disabled={busy} style={{ backgroundColor: t.graphite, borderRadius: 16, paddingVertical: 18, marginTop: 6 }}><Text style={{ color: t.onGraphite, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>{busy ? L.saving : L.save}</Text></Press>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================
   CHANGE BALANCE SHEET
   ============================================================ */
function BalanceSheet({ visible, onClose, t, L, userId, balance, target, baseCur, onSaved }) {
  const [bal, setBal] = useState(String(balance || ''));
  const [tg, setTg] = useState(String(target || ''));
  const [cur, setCur] = useState(baseCur);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setBal(String(balance || '')); setTg(String(target || '')); setCur(baseCur); }, [visible, balance, target, baseCur]);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from('user_settings').upsert({ user_id: userId, balance: parseFloat(bal) || 0, target_spend: parseFloat(tg) || 0, base_currency: cur, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { Alert.alert('Error', error.message); return; }
    onSaved(parseFloat(bal) || 0, parseFloat(tg) || 0, cur); onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 22 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{L.balanceTarget}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={26} color={t.sub} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.currentBalanceCaps}</Text>
          <TextInput placeholder="0.00" placeholderTextColor={t.faint} value={bal} onChangeText={setBal} keyboardType="decimal-pad" style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 16, fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 22 }} />
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.monthlyTargetCaps}</Text>
          <TextInput placeholder="0.00" placeholderTextColor={t.faint} value={tg} onChangeText={setTg} keyboardType="decimal-pad" style={{ backgroundColor: t.bg2, borderRadius: 14, padding: 16, fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 22 }} />
          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>{L.baseCurrencyCaps}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28 }}>
            {CURRENCIES.map((c) => (<Press key={c} onPress={() => setCur(c)} style={{ paddingVertical: 9, paddingHorizontal: 15, borderRadius: 10, marginRight: 8, backgroundColor: cur === c ? t.graphite : t.bg2 }}><Text style={{ color: cur === c ? t.onGraphite : t.sub, fontSize: 13, fontWeight: '600' }}>{c}</Text></Press>))}
          </ScrollView>
          <Press onPress={save} disabled={busy} style={{ backgroundColor: t.graphite, borderRadius: 16, paddingVertical: 18 }}><Text style={{ color: t.onGraphite, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>{busy ? L.saving : L.save}</Text></Press>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================
   POLICY / LEGAL MODAL
   ============================================================ */
function PolicyModal({ visible, onClose, t }) {
  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 26 }}>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginBottom: 10 }}>{title}</Text>
      <Text style={{ color: t.sub, fontSize: 14, lineHeight: 21 }}>{children}</Text>
    </View>
  );
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 22 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>Legal</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={26} color={t.sub} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: t.faint, fontSize: 12, marginBottom: 22 }}>Last updated: June 2026</Text>

          <Section title="Privacy Policy">
            Sentinel collects only what it needs to run: your email address, an optional preferred name, and the financial entries you choose to add (amounts, categories, dates, and subscriptions). This information is stored securely and is tied to your account. Each account can only access its own data, enforced at the database level. We do not sell your data, and we do not share it with third parties for advertising. You can request deletion of your account and all associated data at any time by contacting support.
          </Section>

          <Section title="Terms of Service">
            Sentinel is a personal finance tracking tool provided as is. It helps you record and review your own spending, balances, and recurring payments. Sentinel is not a bank, is not financial advice, and does not move or hold money. You are responsible for the accuracy of the information you enter. You agree not to misuse the service, attempt unauthorized access, or use it for unlawful purposes. We may update the app and these terms over time; continued use means you accept the current version.
          </Section>

          <Section title="Data Policy">
            Your data is stored on secure cloud infrastructure (Supabase). Currency conversions in the app use approximate, periodically-updated rates and are estimates only, not exact financial figures. We retain your data for as long as your account is active. You may request a copy of your data, or its permanent deletion, by contacting support. Removing the app from your device does not automatically delete your stored account data.
          </Section>

          <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            Questions about any of the above? Contact support@sentinel.app
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ============================================================
   ASSETS / NET WORTH SHEET
   ============================================================ */
function AssetsSheet({ visible, onClose, t, userId, baseCur, assets, reload }) {
  const sym = SYMBOL[baseCur] || '$';
  const netWorth = assets.reduce((s, a) => s + convert(Number(a.amount) || 0, a.currency || 'USD', baseCur), 0);

  const addAsset = (kind, label) => {
    Alert.prompt(`Add ${label}`, `Value in ${baseCur}`, async (text) => {
      const v = parseFloat(String(text).replace(/,/g, ''));
      if (isNaN(v)) return;
      await supabase.from('assets').insert([{ user_id: userId, kind, label, amount: v, currency: baseCur }]);
      reload && reload();
    }, 'plain-text', '');
  };
  const editAsset = (a) => {
    Alert.prompt(a.label || ASSET_LABEL[a.kind], `Value in ${a.currency || baseCur}`, async (text) => {
      const v = parseFloat(String(text).replace(/,/g, ''));
      if (isNaN(v)) return;
      await supabase.from('assets').update({ amount: v, updated_at: new Date().toISOString() }).eq('id', a.id);
      reload && reload();
    }, 'plain-text', String(a.amount || ''));
  };
  const removeAsset = (a) => {
    Alert.alert('Remove?', a.label || ASSET_LABEL[a.kind], [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('assets').delete().eq('id', a.id); reload && reload(); } }]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 22 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>Total Assets</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={26} color={t.sub} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: t.bg2, borderRadius: 18, padding: 20, marginBottom: 24 }}>
            <Text style={{ color: t.sub, fontSize: 13, marginBottom: 6 }}>Net Worth</Text>
            <Text style={{ color: t.text, fontSize: 36, fontWeight: '700', letterSpacing: 0, fontVariant: ['tabular-nums'] }}>{sym}{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>

          <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>ADD AN ASSET</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
            {ASSET_KINDS.map(([kind, label, icon]) => (
              <Press key={kind} onPress={() => addAsset(kind, label)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8, marginBottom: 8, backgroundColor: t.bg2 }}>
                <Ionicons name={icon} size={15} color={t.text} style={{ marginRight: 7 }} />
                <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '600' }}>{label}</Text>
                <Ionicons name="add" size={15} color={t.sub} style={{ marginLeft: 5 }} />
              </Press>
            ))}
          </View>

          {assets.length > 0 && <Text style={{ color: t.faint, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>YOUR ASSETS</Text>}
          {assets.map((a) => (
            <Press key={a.id} onPress={() => editAsset(a)} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderRadius: 16, padding: 16, borderWidth: t.bg === '#0B0B0B' ? 1 : 0, borderColor: t.cardLine }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name={ASSET_ICON[a.kind] || 'cube-outline'} size={18} color={t.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{a.label || ASSET_LABEL[a.kind]}</Text>
                  <Text style={{ color: t.sub, fontSize: 12.5, marginTop: 2 }}>{ASSET_LABEL[a.kind]}</Text>
                </View>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginRight: 10 }}>{SYMBOL[a.currency] || sym}{Number(a.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                <Pressable onPress={() => removeAsset(a)} hitSlop={8}><Ionicons name="trash-outline" size={17} color={t.faint} /></Pressable>
              </View>
            </Press>
          ))}
          {assets.length === 0 && <Text style={{ color: t.faint, fontSize: 13.5, textAlign: 'center', marginTop: 20 }}>Add what you own above to see your net worth.</Text>}
        </ScrollView>
      </View>
    </Modal>
  );
}
