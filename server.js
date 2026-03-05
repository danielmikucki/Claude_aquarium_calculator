const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// DANE (przeniesione z frontendu)
// ---------------------------------------------------------------------------

const FERTILIZERS = [
  {
    name: 'Azot (NO₃)',
    type: 'macro',
    product: 'Np. KNO₃ (saletra potasowa)',
    targetPPM: { planted: 20, medium: 12, low: 6 },
    dosePer100L: { planted: 1.8, medium: 1.1, low: 0.55 },
    unit: 'g',
  },
  {
    name: 'Fosfor (PO₄)',
    type: 'macro',
    product: 'Np. KH₂PO₄ (jednopodstawowy fosforan potasu)',
    targetPPM: { planted: 2, medium: 1.2, low: 0.6 },
    dosePer100L: { planted: 0.28, medium: 0.17, low: 0.085 },
    unit: 'g',
  },
  {
    name: 'Potas (K)',
    type: 'macro',
    product: 'Np. K₂SO₄ (siarczan potasu)',
    targetPPM: { planted: 30, medium: 18, low: 9 },
    dosePer100L: { planted: 2.2, medium: 1.3, low: 0.65 },
    unit: 'g',
  },
  {
    name: 'Magnez (Mg)',
    type: 'macro',
    product: 'Np. MgSO₄·7H₂O (siarczan magnezu, sól Epsom)',
    targetPPM: { planted: 10, medium: 6, low: 3 },
    dosePer100L: { planted: 1.0, medium: 0.6, low: 0.3 },
    unit: 'g',
  },
  {
    name: 'Żelazo (Fe)',
    type: 'micro',
    product: 'Np. Chelat Fe-EDTA lub Fe-DTPA (Seachem Flourish Iron)',
    targetPPM: { planted: 0.5, medium: 0.3, low: 0.1 },
    dosePer100L: { planted: 2.5, medium: 1.5, low: 0.5 },
    unit: 'ml',
  },
  {
    name: 'Mikroelementy (mix)',
    type: 'micro',
    product: 'Np. Seachem Flourish / Tropica Specialised',
    targetPPM: { planted: null, medium: null, low: null },
    dosePer100L: { planted: 5, medium: 3, low: 1.5 },
    unit: 'ml',
  },
  {
    name: 'Dwutlenek węgla (CO₂)',
    type: 'micro',
    product: 'Butla CO₂ z dyfuzorem lub fermentacja (DIY)',
    targetPPM: { planted: 25, medium: 15, low: null },
    dosePer100L: null,
    unit: 'mg/L',
  },
];

const REMINERALS = [
  {
    name: 'GH Booster',
    product: 'Np. Seachem Equilibrium',
    dosePer100L: { planted: 16, medium: 12, low: 8 },
    unit: 'g',
    effect: 'Podnosi GH (Ca, Mg, K) – celem GH 6°dH',
  },
  {
    name: 'Wodorowęglan sodu (NaHCO₃)',
    product: 'Soda oczyszczona (spożywcza)',
    dosePer100L: { planted: 1.68, medium: 1.26, low: 0.84 },
    unit: 'g',
    effect: 'Podnosi KH o ~1°dKH na 1 g/100L → cel KH 2–3°dKH',
  },
  {
    name: 'Siarczan wapnia (CaSO₄)',
    product: 'Gips akwariowy / Gips spożywczy',
    dosePer100L: { planted: 2.5, medium: 1.8, low: 1.2 },
    unit: 'g',
    effect: 'Dodatkowy wapń bez wpływu na KH',
  },
  {
    name: 'Siarczan magnezu (MgSO₄)',
    product: 'Sól Epsom (7H₂O)',
    dosePer100L: { planted: 2.0, medium: 1.4, low: 0.9 },
    unit: 'g',
    effect: 'Dodatkowy magnez – cel Mg: 3–5 mg/L',
  },
];

const SCHEDULE_TEMPLATES = {
  daily: {
    label: 'Codziennie',
    macro_days: ['Pon', 'Śr', 'Pt'],
    micro_days: ['Wt', 'Czw', 'Sob'],
    wc_day: 'Ndz',
    divisor: 3,
  },
  '3x': {
    label: '3× w tygodniu',
    macro_days: ['Pon', 'Śr', 'Pt'],
    micro_days: ['Wt', 'Czw', 'Sob'],
    wc_day: 'Ndz',
    divisor: 3,
  },
  weekly: {
    label: 'Raz w tygodniu',
    macro_days: ['Pon'],
    micro_days: ['Czw'],
    wc_day: 'Ndz',
    divisor: 1,
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.post('/api/calculate', (req, res) => {
  const {
    tankVolume = 100,
    filterVolume = 0,
    tankType = 'planted',
    doseSchedule = 'daily',
  } = req.body;

  const vol = parseFloat(tankVolume) + parseFloat(filterVolume);
  const type = tankType;
  const schedData = SCHEDULE_TEMPLATES[doseSchedule];

  if (!schedData) {
    return res.status(400).json({ error: 'Invalid doseSchedule' });
  }

  // Nawozy
  const fertilizers = FERTILIZERS.map(f => {
    const weekDose = f.dosePer100L ? f.dosePer100L[type] * vol / 100 : null;
    const perDose = weekDose !== null ? weekDose / schedData.divisor : null;
    const ppm = f.targetPPM && f.targetPPM[type] !== null ? f.targetPPM[type] : null;
    return {
      name: f.name,
      type: f.type,
      product: f.product,
      perDose,
      weekDose,
      unit: f.unit,
      ppm,
    };
  });

  // Remineralizacja
  const reminerals = REMINERALS.map(r => ({
    name: r.name,
    product: r.product,
    dose: parseFloat((r.dosePer100L[type] * vol / 100).toFixed(1)),
    unit: r.unit,
    effect: r.effect,
  }));

  // Harmonogram
  const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
  const schedule = days.map(day => {
    const actions = [];
    if (schedData.macro_days.includes(day)) {
      FERTILIZERS.filter(f => f.type === 'macro' && f.dosePer100L).forEach(f => {
        const dose = (f.dosePer100L[type] * vol / 100 / schedData.divisor).toFixed(2);
        actions.push({ text: `${f.name.split(' ')[0]}: ${dose} ${f.unit}`, kind: 'macro' });
      });
    }
    if (schedData.micro_days.includes(day)) {
      FERTILIZERS.filter(f => f.type === 'micro' && f.dosePer100L).forEach(f => {
        const dose = (f.dosePer100L[type] * vol / 100 / schedData.divisor).toFixed(2);
        actions.push({ text: `${f.name.split(' ')[0]}: ${dose} ${f.unit}`, kind: 'micro' });
      });
    }
    if (day === schedData.wc_day) {
      actions.push({ text: '💧 Podmiana wody 30–50%', kind: 'wc' });
    }
    return { day, actions };
  });

  // Parametry docelowe
  const targets = [
    { label: 'pH',          value: '6.8 – 7.2',   cls: 'ok' },
    { label: 'GH',          value: '4 – 8 °dH',   cls: 'ok' },
    { label: 'KH',          value: '2 – 4 °dKH',  cls: 'ok' },
    { label: 'NO₃',         value: type === 'planted' ? '10–20 mg/L' : type === 'medium' ? '5–15 mg/L' : '3–8 mg/L', cls: '' },
    { label: 'PO₄',         value: type === 'planted' ? '1–2 mg/L' : '0.5–1 mg/L', cls: '' },
    { label: 'K',           value: '10–30 mg/L',  cls: '' },
    { label: 'Fe',          value: '0.1–0.5 mg/L', cls: '' },
    { label: 'CO₂',         value: type === 'low' ? 'brak / DIY' : '20–30 mg/L', cls: type === 'low' ? '' : 'ok' },
    { label: 'Temperatura', value: '22 – 26 °C',  cls: 'ok' },
  ];

  res.json({ fertilizers, reminerals, schedule, targets });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
