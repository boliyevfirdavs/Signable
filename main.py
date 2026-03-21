import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import time
from flask import Flask, render_template, jsonify, request, Response, stream_with_context
import json
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

actions = np.array(["no_event", 'brother', 'Hi,', 'My', 'there.', "plays", "soccer."])

model = Sequential()
model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 1662)))
model.add(LSTM(128, return_sequences=True, activation='relu'))
model.add(LSTM(64, return_sequences=False, activation='relu'))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(actions.shape[0], activation='softmax'))

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

model.load_weights('action.h5')

sequence = []
sentence = [""]
predictions = []
threshold = 0.999
draw_landmarks = True


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/reset_variables', methods=['POST'])
def reset_variables():
    global sequence, sentence, predictions
    sequence = []
    sentence = []
    predictions = []
    return jsonify({'status': 'variables reset'})


@app.route('/process_keypoints', methods=['POST'])
def process_keypoints():
    global sequence, sentence, predictions

    data = request.json
    keypoints = data.get('keypoints')

    if not keypoints:
        return jsonify({'status': 'error', 'message': 'No keypoints provided'}), 400

    sequence.append(keypoints)
    sequence = sequence[-30:]

    if len(sequence) == 30:
        res = model.predict(np.expand_dims(sequence, axis=0))[0]
        predicted_index = np.argmax(res)
        confidence = res[predicted_index]
        predictions.append(predicted_index)
        predictions = predictions[-5:]
        if len(predictions) == 5 and np.unique(predictions)[0] == predicted_index:
            if confidence > threshold:
                action = actions[predicted_index]
                if action != "no_event":
                    if not sentence or action != sentence[-1]:
                        sentence.append(action)
                        if len(sentence) > 20:
                            sentence = sentence[-20:]
    return jsonify({'status': 'success'})


@app.route('/toggle_landmarks', methods=['POST'])
def toggle_landmarks():
    global draw_landmarks
    data = request.json
    draw_landmarks = data.get('draw_landmarks', True)
    return jsonify({'status': 'success'})


@app.route('/get_sentence')
def get_sentence():
    return jsonify(sentence)


@app.route('/sentence_stream')
def sentence_stream():
    def generate():
        last_sent = None
        while True:
            current = list(sentence)  # snapshot
            if current != last_sent:
                yield f"data: {json.dumps(current)}\n\n"
                last_sent = current
            time.sleep(0.5)

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

if __name__ == "__main__":
    app.run()
