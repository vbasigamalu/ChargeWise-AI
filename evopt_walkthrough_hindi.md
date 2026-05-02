# EVOPT — पूरा Project समझो (Hindi Walkthrough)

## 🎯 Project एक Line में
> *"जब लाखों EVs एक साथ शाम को charge होंगे, तो बिजली का grid फट जाएगा। हमारा AI system पहले से बता देता है कि कहाँ खतरा है, कब charge करना safe है, और नए stations कहाँ बनाने चाहिए।"*

---

## पहले ये समझो: Problem क्या है?

सोचो Bengaluru में 6,000 EVs हैं। सब लोग office से शाम 6 बजे घर आते हैं और charger लगा देते हैं। 

**Result?**
- शाम 6-10 PM में electricity demand **rocket** हो जाती है 🚀
- Area का transformer 500 kW handle कर सकता है, लेकिन load 480 kW पहुँच जाता है
- Transformer overload → **Blackout** → पूरे area की बत्ती गुल 🔴

**EVOPT यही solve करता है** — AI की मदद से।

---

## Tab 1: 📊 Dashboard (Home Page)

### ये क्या है?
ये **Control Room** है — जैसे ISRO का Mission Control। एक ही screen पर सब कुछ दिखता है।

### Screen पर क्या-क्या दिखता है?

| Card | क्या दिखाता है | Example |
|---|---|---|
| 🚗 **Registered EVs** | कितनी EVs register हैं system में | 6,000 |
| ⚡ **Charging Stations** | कितने charging stations हैं अभी | 40 |
| 📉 **Peak Load Reduction** | Smart scheduling से kitna % load कम हुआ | 23% |
| 🚨 **Active Alerts** | कितने zones में खतरा है अभी | 5 alerts |

### Charts:
- **Line Chart (Zone-wise Demand):** हर zone की demand 24 घंटे में कैसे बदलती है। शाम को lines ऊपर जाती हैं = demand बढ़ी
- **Bar Chart (Grid Utilization):** हर zone का transformer कितना % भरा है। Red bar = खतरा, Green bar = safe
- **Alerts List:** सबसे dangerous zones की list, सबसे ऊपर सबसे ज़्यादा खतरनाक

### कैसे काम करता है?
Page खुलते ही React **4 API calls** भेजता है:
1. AI से demand prediction माँगता है
2. Grid status check करता है
3. Smart schedule calculate करता है
4. Alerts check करता है

ये चारों **एक साथ** चलते हैं (parallel), इसलिए page जल्दी load होता है।

---

## Tab 2: 🔥 Demand Prediction

### ये क्या है?
ये project का **दिल** है — Main AI Engine। ये बताता है *"कल Koramangala में शाम 7 बजे कितनी electricity लगेगी?"*

### AI कैसे predict करता है? (Step by Step)

**Step 1: Data तैयार करो (Feature Engineering)**

50,000 charging sessions हैं raw data में। AI को raw data नहीं समझ आता। इसलिए हम उसे **17 signals** (features) में बदलते हैं:

| Feature | मतलब | AI को क्यों चाहिए |
|---|---|---|
| `hour` | कितने बजे हैं (0-23) | रात 3 बजे और शाम 7 बजे की demand अलग है |
| `day_of_week` | कौन सा दिन है | Monday और Sunday का pattern अलग है |
| `month` | कौन सा महीना | गर्मी में AC + EV = ज़्यादा load |
| `is_peak` | Peak time है? (6-10 PM) | Evening surge detect करने के लिए |
| `hour_sin`, `hour_cos` | Hour का circular encoding | AI को बताने के लिए कि 23:00 और 0:00 पास-पास हैं |
| `avg_temperature` | Temperature (°C) | गर्मी में ज़्यादा charging |
| `session_count` | कितने लोग charge कर रहे | Direct demand indicator |
| `lag_1h` | 1 घंटा पहले demand कितनी थी | Pattern follow करने के लिए |
| `lag_24h` | कल इसी वक्त demand कितनी थी | Daily pattern |
| `rolling_24h_mean` | पिछले 24 घंटे की average | Trend समझने के लिए |

**Step 2: दो AI Models Train करो**

हम **एक नहीं, दो** models use करते हैं:

🌲 **Random Forest** (200 पेड़):
- जैसे 200 experts की committee
- हर expert अलग-अलग data देखता है
- सबका average = final answer
- Fayde: Noise handle करता है, overfitting कम

🚀 **XGBoost** (300 boosted trees):
- जैसे एक student जो अपनी गलतियों से सीखता है
- पहला tree predict करता है, दूसरा tree पहले की गलती सुधारता है, तीसरा दूसरे की...
- 300 बार सुधार = बहुत accurate
- Fayde: Time-series patterns better पकड़ता है

**Step 3: दोनों को मिलाओ (Ensemble)**

```
Final Answer = 40% × Random Forest + 60% × XGBoost
```

XGBoost को ज़्यादा weightage क्यों? क्योंकि tabular data पर XGBoost generally better perform करता है। लेकिन RF "safety net" है — अगर XGBoost कहीं गलत हो, RF balance कर देता है।

**Confidence Score:**
अगर दोनों models **एक जैसा** बोलें = High Confidence ✅
अगर दोनों models **अलग-अलग** बोलें = Low Confidence ⚠️ (operator को manually check करना चाहिए)

### Screen पर क्या दिखता है?

- **Total Predicted kWh:** पूरे दिन में कुल कितनी बिजली लगेगी
- **Peak Hour:** सबसे ज़्यादा demand किस बजे होगी
- **Peak Zone:** कौन से area में सबसे ज़्यादा demand
- **Line Chart:** 24 घंटे की demand curve — जहाँ line ऊपर जाती है, वहाँ danger
- **Heatmap Table:** Rows = zones, Columns = hours, Red cell = ज़्यादा demand, Green cell = कम demand

---

## Tab 3: ⏱️ Smart Scheduling

### ये क्या है?
Demand Prediction ने बता दिया *"क्या होगा"*। Smart Scheduling बताता है *"क्या करना चाहिए"*।

**Simple भाषा में:** अगर सब लोग शाम 7 बजे charge करें तो grid crash। लेकिन अगर कुछ लोगों को रात 2 बजे charge करने के लिए convince करें (सस्ती rate पर), तो grid safe।

### कैसे काम करता है?

हर zone के लिए:

1. **पहले देखो pattern:** 24 घंटे में demand कैसी है
2. **Peak Hours निकालो:** वो hours जहाँ demand 80th percentile से ऊपर (e.g., 18:00-22:00)
3. **Off-Peak Hours निकालो:** वो hours जहाँ demand 40th percentile से नीचे (e.g., 0:00-8:00)
4. **Calculate करो:** कितना load shift हो सकता है
   - Peak hours से **maximum 45%** load हटा सकते हैं (सबको force नहीं कर सकते)
   - Off-peak hours में **maximum 80%** extra load डाल सकते हैं (वहाँ भी limit है)
5. **Simulate करो:** Peak hours से 35% load कम करो, off-peak में बराबर बाँटो

### Screen पर क्या दिखता है?

- **Red Line (Before):** अभी demand curve कैसी है — ऊँची peaks
- **Green Dashed Line (After):** Optimization के बाद — peaks कम, रात को थोड़ी demand बढ़ी
- **Peak Hours (Red badges):** 18:00, 19:00, 20:00, 21:00, 22:00
- **Off-Peak Hours (Green badges):** 0:00-8:00
- **35% Peak Load Reduction:** Peak demand 35% कम हो गई
- **Recommendations:**
  - *"Shift 150 kWh from peak to off-peak"*
  - *"Offer 30% discount for night charging"*
  - *"Stagger charging start times"*

---

## Tab 4: 📍 Station Planner (Map)

### ये क्या है?
India में अभी ~6,000 public charging stations हैं, 2030 तक ~4,00,000 चाहिए। सवाल है: **कहाँ बनाएं?** Random जगह बनाने से पैसे बर्बाद। AI बताता है best locations।

### कैसे काम करता है?

**Step 1: Candidate Locations ढूँढो (Clustering)**

दो algorithms मिलकर "candidate spots" ढूँढते हैं:
- **K-Means:** सारे EVs की locations को clusters में बाँटता है। हर cluster का center = एक candidate
- **DBSCAN:** Dense pockets ढूँढता है जो K-Means miss कर सकता है (irregular shapes)

**Step 2: Duplicates हटाओ**
अगर दो candidates 500 meter के अंदर हैं, तो एक रखो (दो stations पास-पास बनाने का कोई sense नहीं)

**Step 3: हर Candidate को Score दो**

| Factor | Weight | मतलब |
|---|---|---|
| **EV Density** | 35% | इस area में कितनी EVs हैं (ज़्यादा = ज़्यादा demand) |
| **Coverage Gap** | 25% | सबसे नज़दीक station कितना दूर है (दूर = गैप ज़्यादा = ज़रूरत ज़्यादा) |
| **Demand Growth** | 20% | Recent registrations कितनी तेज़ बढ़ रही हैं |
| **Grid Headroom** | 20% | Transformer में कितनी spare capacity है (ज़्यादा = safe) |

```
Score = 0.35 × EV_Density + 0.25 × Coverage_Gap + 0.20 × Growth + 0.20 × Grid_Headroom
```

**Step 4: Top 15 Rank करो और Map पर दिखाओ**

### Screen पर क्या दिखता है?
- **Map:** Bengaluru का interactive map
- **Blue markers:** Existing stations (जो पहले से हैं)
- **Green markers:** AI recommended locations (जहाँ नए बनाने चाहिए)
- **Score card:** हर recommendation का score और breakdown

---

## Tab 5: ⚡ Grid Status

### ये क्या है?
हर area में एक **transformer** होता है (वो बड़ा बॉक्स जो pole पर लगा होता है)। उसकी एक maximum capacity होती है, जैसे 500 kW। अगर load उससे ज़्यादा हो गया → **transformer trip** → **blackout**।

ये page हर zone के transformer की "health" दिखाता है।

### कैसे काम करता है?

`grid_capacity.csv` से data पढ़ता है:
- Transformer max capacity (जैसे 500 kW)
- Current load (जैसे 350 kW) — AC, lights, factories सब मिलाकर
- Headroom = Max - Current = कितनी जगह बची

फिर classify करता है:

| Utilization | Status | मतलब |
|---|---|---|
| **≥ 90%** | 🔴 Critical | Transformer फटने वाला है! |
| **75-89%** | 🟠 Warning | खतरे की घंटी |
| **60-74%** | 🟡 Moderate | ध्यान रखो |
| **< 60%** | 🟢 Healthy | सब ठीक |

### Screen पर क्या दिखता है?
- **Circular Gauges:** हर zone का गोल meter — जैसे car का speedometer। ज़्यादा भरा = ज़्यादा खतरा
- **"350.2 / 500 kW":** अभी 350.2 kW load है, max 500 kW handle कर सकता है
- **Color-coded badges:** Critical, Warning, Moderate, Healthy
- **Detailed Table:** सब zones का complete data

---

## Tab 6: 🚨 Surge Alerts

### ये क्या है?
Grid Status **अभी** का हाल बताता है। Surge Alerts **भविष्य** का खतरा बताता है।

सोचो: *"अभी transformer 70% पर है (safe), लेकिन AI predict कर रहा है कि शाम 7 बजे EV demand इतनी बढ़ेगी कि total load 95% पहुँच जाएगा। ALERT!"*

### कैसे काम करता है?

1. **AI से demand prediction लो** (सारे zones, सारे hours)
2. हर zone × hour के लिए calculate करो:
   ```
   Total Load = Base Load (AC, lights) + Predicted EV Demand
   Load % = (Total Load / Transformer Max) × 100
   ```
3. अगर Load ≥ 75% → Alert generate करो:
   - **⚠️ WARNING (75-84%):** "Monitor करो, demand response activate करो"
   - **🔴 CRITICAL (85-94%):** "Load shifting चालू करो, station operators को notify करो"
   - **🚨 EMERGENCY (≥95%):** "तुरंत load shedding करो! नए charging sessions बंद करो!"

### Screen पर क्या दिखता है?
- **Alert cards:** Zone name, hour, load %, severity, recommended action
- **Color dots:** Red = Emergency, Orange = Critical, Yellow = Warning
- **"Electronic City — 92.3% load at 19:00"** = शाम 7 बजे Electronic City का transformer 92.3% भरा होगा

---

## Tab 7: 🔮 Simulation (What-If Game)

### ये क्या है?
ऊपर के सारे tabs **आज** की situation दिखाते हैं। लेकिन government officer पूछेगा: *"अगर अगले साल EV sales 30% बढ़ गईं, 10 नए stations बना दिए, और 50% लोगों ने smart charging adopt कर ली — तो क्या होगा?"*

ये page **"What-If" खेलने** देता है।

### कैसे काम करता है?

3 sliders हैं:
- **EV Growth Rate (0-100%):** कितनी EVs बढ़ेंगी
- **Scheduling Adoption (0-100%):** कितने लोग smart charging use करेंगे
- **Time Horizon (3-36 months):** कितने महीने बाद का scenario

**गणित:**
```
अभी peak demand = 100 kWh
EVs 30% बढ़ीं, 12 महीने में:
→ Projected peak = 100 × 1.30 = 130 kWh (without scheduling)

50% लोगों ने smart charging adopt की, जो 35% peak कम करती है:
→ Savings = 130 × 0.50 × 0.35 = 22.75 kWh
→ Final peak = 130 - 22.75 = 107.25 kWh

Overall change = +7.25% (demand बढ़ी, लेकिन scheduling ने काबू रखा)
```

### Screen पर क्या दिखता है?
- **3 Sliders:** Parameters adjust करो
- **"Add New Stations":** Specific zone में virtual station add करो
- **Run Simulation button:** Calculate करो
- **Red bar vs Green bar:** Today's peak vs Projected peak
- **"Zones at Risk":** कितने zones 85% से ऊपर जाएंगे
- **"Scheduling Savings":** Smart charging से कितनी kWh/day बचेगी

---

## Tab 8: 🧠 Explainability (SHAP)

### ये क्या है?
Judge पूछेगा: *"तुम्हारे AI ने Koramangala में शाम 7 बजे 25 kWh predict किया — लेकिन क्यों?"*

अगर बोलो "AI ने बोला तो बोला" — judge भरोसा नहीं करेगा। SHAP values **mathematical proof** देता है कि AI ने **कौन सी चीज़ देखकर** ये predict किया।

### SHAP क्या है? (बहुत Simple)

सोचो एक cricket match है। Team ने 300 runs बनाए। अब पूछो: *"Virat ने कितना contribute किया? Rohit ने? Bowlers ने?"*

SHAP exactly यही करता है AI predictions के लिए:
- 17 features हैं (hour, temperature, session count, etc.)
- SHAP हर feature का **individual contribution** calculate करता है
- Positive SHAP = इस feature ने prediction **बढ़ाई**
- Negative SHAP = इस feature ने prediction **घटाई**

### Example:
```
Koramangala, 19:00 → Predicted: 25.69 kWh

Feature Contributions:
  Session Count:    45.1% ↓ (कम sessions → demand कम की)
  Avg Duration:     25.6% ↑ (लंबे sessions → demand बढ़ाई)
  Demand 1h Ago:     7.7% ↑ (पिछले घंटे demand ज़्यादा थी)
  Demand 24h Ago:    7.5% ↑ (कल भी इस वक्त demand थी)
  Temperature:       4.4% ↑ (गर्मी → ज़्यादा charging)
```

**Natural Language:** *"Koramangala demand at 19:00 is moderate because: Session Count (45.1%), Avg Duration (25.6%), Demand 1h Ago (7.7%)"*

### Screen पर क्या दिखता है?
- **Zone & Hour dropdown:** कौन सी prediction explain करनी है
- **"Explain Prediction" button:** SHAP calculate करो (~3 seconds लगते हैं)
- **Base Value: 18.62 kWh:** Average prediction — starting point
- **Prediction: 25.69 kWh:** Actual prediction
- **Green bars:** Features जो demand **बढ़ा** रहे हैं
- **Red bars:** Features जो demand **घटा** रहे हैं
- **% contribution:** हर feature कितना ज़िम्मेदार है

---

## Judge को कैसे समझाओ? (2-minute pitch)

> *"Sir, India में 2030 तक 40 lakh EVs होंगी। अगर सब शाम को charge करें, तो grid crash हो जाएगा।*
>
> *हमने EVOPT बनाया — एक AI system जो:*
> 1. *XGBoost + Random Forest से predict करता है कि कहाँ, कब, कितनी demand आएगी*
> 2. *Smart scheduling से peak load 35% कम करता है — बस charging time shift करके*
> 3. *K-Means clustering से बताता है कि नए stations कहाँ बनाने चाहिए*
> 4. *SHAP values से explain करता है कि AI ने ऐसा क्यों predict किया*
>
> *और ये सब real-time dashboard पर दिखता है जो DISCOM operators use कर सकते हैं।*
>
> *Data synthetic है, लेकिन Bengaluru की real geography और population density पर based है। System architecturally ready है BESCOM smart meter data plug करने के लिए।"*

---

## पूरा System Flow (एक Picture में)

```
📁 CSV Data (50k sessions)
    ↓
🔧 Feature Engineering (17 features बनाओ)
    ↓
🤖 Model Training (RF + XGBoost train करो)
    ↓
📦 Saved Models (.pkl files में save)
    ↓
🐍 Python Scripts (predict, schedule, explain, simulate)
    ↓
🌉 runner.py (JSON input लो, JSON output दो)
    ↓
🔗 Node.js Bridge (Python spawn करो via child_process)
    ↓
🌐 Express API (Port 5000 पर serve करो)
    ↓
⚛️ React Dashboard (Port 5173 पर Chart.js + Leaflet)
```

> हर बार जब तुम browser में कुछ click करते हो, ये पूरी chain चलती है: React → Node.js → Python → ML Model → JSON → वापस React → Chart बनता है।
