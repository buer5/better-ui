# Original ambient score for the promo: pad + plucks + sub, whooshes on cuts, clicks synced to cursor clicks.
import numpy as np, wave, os
TMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tmp")  # reads sfx.json from capture.js, writes music.wav
SR, DUR = 48000, 41.0
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def env_adsr(n, a, d, s, r, sus_len):
    a, d, r = int(a*SR), int(d*SR), int(r*SR); sl = max(0, int(sus_len*SR))
    return np.concatenate([np.linspace(0, 1, a, False), np.linspace(1, s, d, False), np.full(sl, s), np.linspace(s, 0, r)])
def lowpass(x, cut):
    a = np.exp(-2*np.pi*cut/SR); y = np.zeros_like(x); acc = 0.0
    # one-pole, twice
    for _ in range(2):
        y = np.empty_like(x); acc = 0.0
        for k in range(0, len(x), 4096):
            seg = x[k:k+4096]
            from scipy.signal import lfilter  # noqa
            out, _z = lfilter([1-a], [1, -a], seg, zi=[acc*a] if False else [acc])
            y[k:k+4096] = out; acc = out[-1]
        x = y
    return y

try:
    from scipy.signal import lfilter, butter, sosfilt, fftconvolve
    HAVE_SCIPY = True
except ImportError:
    HAVE_SCIPY = False
print("scipy", HAVE_SCIPY)
def lp(x, cut, order=2):
    if not HAVE_SCIPY: return x
    return sosfilt(butter(order, cut, "low", fs=SR, output="sos"), x)
def hp(x, cut, order=2):
    if not HAVE_SCIPY: return x
    return sosfilt(butter(order, cut, "high", fs=SR, output="sos"), x)

# --- pad: detuned saws, filtered, slow chord changes (D major-ish, airy) ---
chords = [(0.0, [50, 57, 62, 64, 69]),      # Dadd9
          (6.2, [47, 54, 59, 62, 66]),      # Bm7
          (11.2, [43, 50, 55, 59, 62, 66]), # Gmaj7
          (16.0, [45, 52, 57, 61, 64]),     # A
          (23.5, [47, 54, 59, 62, 66, 69]), # Bm9-ish
          (28.0, [43, 50, 55, 59, 62, 66]), # Gmaj7
          (32.5, [45, 52, 57, 61, 64, 69]), # A
          (36.7, [50, 57, 62, 66, 69, 76])] # D (resolve)
pad = np.zeros(N)
for ci, (st, notes) in enumerate(chords):
    en = chords[ci+1][0] if ci+1 < len(chords) else DUR
    ln = en - st + 1.5
    tt = np.arange(int(ln*SR)) / SR
    sig = np.zeros_like(tt)
    for n in notes:
        for det in (-0.07, 0.0, 0.07):
            f = hz(n) * 2 ** (det/12)
            ph = rng.random()
            sig += (2 * ((tt*f + ph) % 1) - 1) * 0.5 + np.sin(2*np.pi*f*tt + ph*6)  # saw + sine
    sig /= len(notes) * 3
    e = np.minimum(1, tt/1.2) * np.clip((ln - tt)/1.5, 0, 1)
    seg = lp(sig * e, 900 + 500*np.sin(ci))
    i = int(st*SR); j = min(N, i+len(seg)); pad[i:j] += seg[:j-i]
pad *= np.clip(t/2.5, 0, 1)
add(pad, 0, 0, 0.55)

# --- plucks: soft bell-ish arpeggio from the logo onward, 96 bpm eighths ---
bpm = 96; step = 60/bpm/2
def pluck(f, ln=1.4):
    tt = np.arange(int(ln*SR))/SR
    s = (np.sin(2*np.pi*f*tt) + 0.35*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*6) + 0.12*np.sin(2*np.pi*3.01*f*tt)*np.exp(-tt*9))
    return s * np.exp(-tt*3.2) * np.minimum(1, tt/0.004)
pattern = [0, 2, 4, 3, 1, 4, 2, 3]
k = 0; tm = 2.95
while tm < 39.2:
    if 6.1 < tm < 6.35 or 36.4 < tm < 36.85: tm += step; k += 1; continue
    notes = [c for c in chords if c[0] <= tm][-1][1]
    up = [n + 12 for n in notes[1:]]
    n = up[pattern[k % 8] % len(up)]
    vel = 0.55 + 0.25*((k % 4) == 0)
    if tm < 6.2: vel *= 0.6
    add(pluck(hz(n)), tm, pan=np.sin(k*1.7)*0.5, gain=0.16*vel)
    tm += step; k += 1

# --- sub pulse on downbeats from 7s ---
def kick(ln=0.6):
    tt = np.arange(int(ln*SR))/SR
    f = 42 + 60*np.exp(-tt*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt*6)
tm = 6.25
while tm < 36.3:
    add(kick(), tm, 0, 0.32); tm += step*4

# --- whoosh swells into cuts, impacts on the logo & end card ---
def whoosh(ln):
    n = rng.standard_normal(int(ln*SR)); tt = np.arange(len(n))/SR
    e = (tt/ln)**2.5 * np.exp(-np.maximum(0, tt-ln*0.92)*40)
    return hp(lp(n, 2500), 300) * e
for at, ln, g in [(3.0, 1.4, 0.10), (6.3, 1.2, 0.08), (11.3, 0.9, 0.05), (16.2, 1.1, 0.07), (23.6, 0.9, 0.05), (24.5, 1.3, 0.06), (28.1, 0.9, 0.05), (32.7, 0.9, 0.06), (36.8, 1.4, 0.10)]:
    add(whoosh(ln), at-ln, 0, g)
def impact():
    tt = np.arange(int(2.5*SR))/SR
    b = np.sin(2*np.pi*np.cumsum(38 + 80*np.exp(-tt*18))/SR) * np.exp(-tt*2.2)
    sh = lp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt*5) * 0.3
    return b + sh
add(impact(), 3.02, 0, 0.45); add(impact(), 36.87, 0, 0.45)

# --- UI clicks, synced with the cursor clicks in stage.js ---
def click():
    tt = np.arange(int(0.05*SR))/SR
    return (hp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt*260) * 0.6 + np.sin(2*np.pi*1900*tt)*np.exp(-tt*180))
import json
for c in json.load(open(os.path.join(TMP, "sfx.json"))):
    add(click(), c, rng.uniform(-.35, .35), 0.17)
# soft ticks as each callout lands
for c in [17.7, 18.05, 18.4, 18.75, 19.1, 19.45, 22.1]:
    add(pluck(hz(93), 0.6), c + 0.45, rng.uniform(-.3, .3), 0.035)
# a soft chime when the theme flips & when the end switch turns on
add(pluck(hz(86), 2.0), 24.55, 0.3, 0.10); add(pluck(hz(93), 2.0), 24.7, -0.3, 0.07)
add(pluck(hz(81), 2.5), 37.55, 0, 0.12); add(pluck(hz(88), 2.5), 37.7, 0, 0.09)
# typing ticks under the code card
tk = 33.5
while tk < 35.0:
    add(click()*0.5, tk, rng.uniform(-.4,.4), 0.06 + 0.03*rng.random()); tk += rng.uniform(0.035, 0.08)

# --- reverb: convolve with decaying noise IR ---
if HAVE_SCIPY:
    ir_t = np.arange(int(2.8*SR))/SR
    irL = rng.standard_normal(len(ir_t)) * np.exp(-ir_t*2.3); irR = rng.standard_normal(len(ir_t)) * np.exp(-ir_t*2.3)
    irL = lp(irL, 5000); irR = lp(irR, 5000); irL /= np.abs(irL).sum()**0.5*30; irR /= np.abs(irR).sum()**0.5*30
    wL = fftconvolve(L, irL)[:N]; wR = fftconvolve(R, irR)[:N]
    L, R = L + wL*0.9, R + wR*0.9

fade = np.clip((DUR - t)/1.6, 0, 1) * np.clip(t/0.3, 0, 1)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); g = 0.89 / peak
L, R = np.tanh(L*g*1.1)/np.tanh(1.1), np.tanh(R*g*1.1)/np.tanh(1.1)
out = (np.stack([L, R], 1) * 32767 * 0.9).astype(np.int16)
with wave.open(os.path.join(TMP, "music.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print("ok")
