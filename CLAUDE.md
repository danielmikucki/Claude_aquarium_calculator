# Aquarium Fertilizer Calculator

Kalkulator dawkowania nawozów do akwarium słodkowodnego z wodą RO.

## Struktura projektu

- `index.html` – cała aplikacja (HTML + CSS + JS w jednym pliku)
- `tests/calculator.spec.js` – testy Playwright (E2E)
- `playwright.config.js` – konfiguracja testów (Chromium + Firefox)

## Uruchamianie testów

```bash
npm test                  # testy headless (Chromium + Firefox)
npm run test:headed       # testy z oknem przeglądarki
npm run test:report       # testy + raport HTML
```

## Kluczowe elementy HTML (selektory używane w testach)

| Selektor | Opis |
|---|---|
| `#tankVolume` | Objętość zbiornika (domyślnie: 100) |
| `#filterVolume` | Objętość filtra (domyślnie: 0) |
| `#tankType` | Typ zbiornika: `planted` / `medium` / `low` |
| `#doseSchedule` | Schemat dozowania: `daily` / `x3weekly` / `weekly` |
| `#fertBody tr` | Wiersze tabeli nawozów (powinno być 7) |
| `.dose-cell` | Komórki z dawkami (wartość liczbowa lub `–`) |
| `#resultsCard` | Karta z wynikami (ukryta po Reset) |
| `#targetCard` | Karta z parametrami docelowymi |
| `#targetGrid .result-item` | Pozycje parametrów docelowych (powinno być 9) |

## Ważne zachowania kalkulatora

- Całkowita objętość wody = `tankVolume + filterVolume`
- Domyślna objętość: 100L zbiornik + 0L filtr = **100L**
- Test "podwojenie objętości" używa: 190L zbiornik + 10L filtr = **200L** (= 2× domyślne 100L)
- Tryb `low` daje mniejsze dawki niż `planted`, `medium` jest pomiędzy
- Schemat `weekly` daje dawki 3× większe niż `daily` (tygodniowa porcja vs dzienna)
- Reset przywraca: `tankVolume=100`, `filterVolume=0`, `tankType=planted`, ukrywa `#resultsCard`

## Gałąź deweloperska

```
claude/aquarium-fertilizer-calculator-kcMj2
```
