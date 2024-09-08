from flask import Flask, render_template, Response, jsonify, request
import numpy as np
from keras._tf_keras.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

actions = np.array(["no_event", "bu", 'salom', 'beradi', 'yordam', "kar-soqovlarga", "sun'iy idrok"])

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
threshold = 0.9
draw_landmarks = True


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/reset_variables', methods=['POST'])
def reset_variables():
    global sequence, sentence, predictions
    sequence = []
    sentence = [""]
    predictions = []
    return jsonify({'status': 'variables reset'})


@app.route('/process_keypoints', methods=['POST'])
def process_keypoints():
    global sequence, sentence, predictions

    data = request.json
    keypoints = data['keypoints']

    sequence.append(keypoints)
    sequence = sequence[-30:]

    if len(sequence) == 30:
        res = model.predict(np.expand_dims(sequence, axis=0))[0]
        predictions.append(np.argmax(res))

        # If prediction is consistent for the last 5 predictions
        if np.unique(predictions[-5:])[0] == np.argmax(res):
            if res[np.argmax(res)] > threshold:
                if len(sentence) > 0:
                    if actions[np.argmax(res)] != sentence[-1] and actions[np.argmax(res)] != "no_event":
                        sentence.append(actions[np.argmax(res)])
                else:
                    if actions[np.argmax(res)] != "no_event":
                        sentence.append(actions[np.argmax(res)])

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


if __name__ == "__main__":
    app.run(debug=True)
