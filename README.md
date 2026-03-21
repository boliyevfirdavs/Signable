# Signable

A real-time sign language recognition web app powered by **MediaPipe Holistic**, **TensorFlow LSTM**, and **Flask**.

The app captures webcam input, extracts body and hand keypoints on the client side, sends them to a Flask backend for inference, and displays the recognized words as a live sentence in the browser.

---

## Demo

| Feature | Detail |
|---|--|
| Input | Webcam (live video) |
| Landmarks | Pose (33) + Face (468) + Hands (21 × 2) = **1,662 keypoints/frame** |
| Model | 3-layer LSTM → Dense → Softmax |
| Sequence length | 30 frames |
| Recognized signs | `Hi,` `there.` `My` `brother` `plays` `soccer.` |
| Confidence threshold | 0.9 |

---

## Project Structure

```
Signable/
├── main.py              # Flask backend — inference + SSE sentence stream
├── train.ipynb          # Data collection + model training notebook
├── action.h5            # Trained LSTM model weights
├── requirements.txt     # Python dependencies
├── templates/
│   └── index.html       # Single-page frontend
└── static/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── script.js    # MediaPipe camera + keypoint extraction + fetch
    │   └── neurons.js   # Particle background animation + SSE sentence display
    └── images/
        └── logo.png
```

---

## Requirements

- Python 3.9
- A webcam
- Modern browser (Chrome recommended for MediaPipe WebAssembly support)

---

## Installation

**1. Clone the repository**
```bash
git clone https://github.com/boliyevfirdavs/Signable.git
cd Signable
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv
source venv/bin/activate      # macOS / Linux
venv\Scripts\activate         # Windows
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

---

## Running the App

**Development**
```bash
python main.py
```
Then open [http://localhost:5000](http://localhost:5000) in your browser.

---

## How It Works

```
Browser                          Flask Backend
  │                                    │
  │── MediaPipe Holistic (WASM) ──►    │
  │   extracts 1,662 keypoints/frame   │
  │                                    │
  │── POST /process_keypoints ────────►│
  │   (throttled to ~10 req/sec)       │── buffer 30 frames
  │                                    │── LSTM.predict()
  │                                    │── append word to sentence[]
  │                                    │
  │◄── GET /sentence_stream (SSE) ─────│
  │    server pushes on change only    │
  │    (replaces 1 req/sec polling)    │
```

### Training Pipeline (`train.ipynb`)

1. **Data collection** — records `.mp4` clips per sign, extracts MediaPipe keypoints frame-by-frame, saves as `.npy` arrays under `MP_Data/`
2. **Dataset construction** — loads 30-frame windows per sequence, one-hot encodes labels
3. **Model** — 3 stacked LSTM layers (64 → 128 → 64 units) + 2 Dense layers, trained for 200 epochs with TensorBoard logging
4. **Export** — saves weights to `action.h5`

---

## Known Limitations

- The model is trained on a small dataset (30 sequences × 7 classes). Accuracy in new environments or with different signers may vary.
- The confidence threshold (`0.9`) is very high by design to reduce false positives — lower it in `main.py` if signs are being missed.