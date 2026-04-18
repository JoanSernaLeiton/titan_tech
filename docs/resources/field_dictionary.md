# Field Dictionary — Provider → Canonical KPI Standard

Defines the canonical KPI schema and the field mapping from each provider to it.
Add a new section per provider when integrating a new data source.

---

## Canonical KPI Standard

| Field | Type | Unit | Description |
|---|---|---|---|
| `status` | enum | — | `online` / `offline` / `fault` / `standby` / `unknown` |
| `energy_today_kwh` | number | kWh | Daily energy yield |
| `energy_total_kwh` | number | kWh | Lifetime cumulative yield |
| `ac_voltage_v` | `{ l1, l2, l3 }` | V | AC output voltage per phase |
| `ac_current_a` | `{ l1, l2, l3 }` | A | AC output current per phase |
| `ac_frequency_hz` | number | Hz | Grid frequency |
| `power_factor` | number | 0.0–1.0 | Always normalized (not %) |
| `active_power_kw` | number | kW | Active AC output power |
| `temperature_c` | number | °C | Inverter internal temperature |
| `device_sn` | string | — | Device serial number |
| `device_type` | enum | — | `inverter` / `micro_inverter` / `meter` / `battery` / `unknown` |
| `provider` | enum | — | `growatt` / `huawei` / `deye` |
| `timestamp` | string | ISO 8601 | Reading collection time |
| `_raw` | object | — | Original provider payload (keep for debugging and non-standard fields) |

> **Single-phase devices**: populate `l1` only; set `l2` and `l3` to `null`.

---

## Design Rules

1. **Power unit is always kW.** Growatt returns `pac` in W → divide by 1000. Huawei returns `active_power` already in kW.
2. **Power factor is always 0.0–1.0.** If a provider returns 0–100, divide by 100.
3. **Always attach `_raw`.** Fields outside the standard (PV string voltages, MPPT data, reactive power) live there.
4. **Status is always the canonical enum.** Map every provider's numeric/string state to it — never expose raw status codes to consumers.

---

## Growatt

**Endpoint:** `GET /v1/device/inverter/last_new_data?device_sn=<SN>`
**Middleware:** `https://techos.thetribu.dev/growatt/v1/device/inverter/last_new_data?device_sn=<SN>`

| Canonical Field | Growatt Field | Transformation |
|---|---|---|
| `status` | `status` (int) | `1` → `online`, `0` → `offline`, `3` → `fault` |
| `energy_today_kwh` | `powerToday` | direct |
| `energy_total_kwh` | `powerTotal` | direct |
| `ac_voltage_v.l1` | `vacr` or `vac1` | direct (V) |
| `ac_voltage_v.l2` | `vac2` | direct (V) |
| `ac_voltage_v.l3` | `vac3` | direct (V) |
| `ac_current_a.l1` | `lacr` or `iac1` | direct (A) |
| `ac_current_a.l2` | `iac2` | direct (A) |
| `ac_current_a.l3` | `iac3` | direct (A) |
| `ac_frequency_hz` | `fac` | direct |
| `power_factor` | `pf` | direct |
| `active_power_kw` | `pac` | ÷ 1000 (W → kW) |
| `temperature_c` | `temperature` | direct |

**Batch endpoint (multiple inverters in one call):**
`POST /v1/device/inverter/invs_data` — same fields, keyed by inverter SN. Prefer this for polling 200+ devices.

---

## Huawei FusionSolar

**Endpoint:** `POST /thirdData/getDevRealKpi`
**Middleware:** `https://techos.thetribu.dev/huawei/thirdData/getDevRealKpi`
**Device type ID for string inverter:** `1`

Response fields live inside `dataItemMap` of each device entry.

| Canonical Field | Huawei Field | Transformation |
|---|---|---|
| `status` | `run_state` (int) | `1` → `online`, `0` → `offline` |
| `energy_today_kwh` | `day_cap` | direct (kWh) |
| `energy_total_kwh` | `total_cap` | direct (kWh) |
| `ac_voltage_v.l1` | `a_u` | direct (V) |
| `ac_voltage_v.l2` | `b_u` | direct (V) |
| `ac_voltage_v.l3` | `c_u` | direct (V) |
| `ac_current_a.l1` | `a_i` | direct (A) |
| `ac_current_a.l2` | `b_i` | direct (A) |
| `ac_current_a.l3` | `c_i` | direct (A) |
| `ac_frequency_hz` | `elec_freq` | direct |
| `power_factor` | `power_factor` | direct |
| `active_power_kw` | `active_power` | direct (already kW) |
| `temperature_c` | `temperature` | direct |

**Additional Huawei device types:** `17` = grid meter, `10` = environmental monitor, `38` = residential inverter. Their field names differ — see SmartPVMS API Reference §getDevRealKpi.

---

## DeyeCloud

**Endpoint:** `POST /v1.0/device/latest`
**Middleware:** `https://techos.thetribu.dev/deye/v1.0/device/latest`

DeyeCloud uses a **dynamic key-value** structure. The response contains a `dataList[]` of `{ key, value, unit }` objects where `key` is a human-readable string that can vary by device firmware.

**Before mapping:** call `POST /v1.0/device/measurePoints` per device to discover the exact `key` strings available for that unit. Then match against the aliases below.

| Canonical Field | DeyeCloud `deviceLatestData` field | Notes |
|---|---|---|
| `status` | `deviceState` (int, top-level) | `1` → `online`, `2` → `fault`, `3` → `offline` |
| `timestamp` | `collectionTime` (Unix seconds) | × 1000 → ms → ISO 8601 |

| Canonical Field | `dataList` key aliases | Notes |
|---|---|---|
| `energy_today_kwh` | `"Today's Production"`, `"Daily Energy"`, `"Today Energy"`, `"Daily Production"` | `parseFloat(value)` |
| `energy_total_kwh` | `"Total Production"`, `"Total Energy"`, `"TotalEnergy"` | `parseFloat(value)` |
| `ac_voltage_v.l1` | `"AC Voltage L1"`, `"MI Voltage L1"`, `"Voltage L1"` | key varies by model |
| `ac_voltage_v.l2` | `"AC Voltage L2"`, `"MI Voltage L2"`, `"Voltage L2"` | |
| `ac_voltage_v.l3` | `"AC Voltage L3"`, `"MI Voltage L3"`, `"Voltage L3"` | |
| `ac_current_a.l1` | `"AC Current L1"`, `"MI Current L1"`, `"Current L1"` | |
| `ac_current_a.l2` | `"AC Current L2"`, `"MI Current L2"`, `"Current L2"` | |
| `ac_current_a.l3` | `"AC Current L3"`, `"MI Current L3"`, `"Current L3"` | |
| `ac_frequency_hz` | `"Grid Frequency"`, `"AC Frequency"`, `"Frequency"` | |
| `power_factor` | `"Power Factor"` | |
| `active_power_kw` | `"AC Power"`, `"Output Power"`, `"Active Power"` | check `unit` field — may be W |
| `temperature_c` | `"Temperature"`, `"Inverter Temperature"` | |

> Key names depend on device firmware version. When a device returns an unrecognized key, log it and store it in `_raw` — do not silently discard it.

---

## Adding a New Provider

1. Find the real-time inverter data endpoint in the provider's docs.
2. Identify fields for each canonical KPI above.
3. Note unit differences (W vs kW, % vs 0–1, Unix vs ISO timestamp).
4. Add a new section to this file following the same table format.
5. Implement the mapper referencing this dictionary.
