document.addEventListener('DOMContentLoaded', function () {
    const video = document.getElementsByClassName('input_video')[0];
    const out = document.getElementsByClassName('output')[0];
    const controlsElement = document.getElementsByClassName('control')[0];
    const canvasCtx = out.getContext('2d');
    const fpsControl = new FPS();
    const spinner = document.querySelector('.loading');
    spinner.ontransitionend = () => {
        spinner.style.display = 'none';
    };

    function extractKeypoints(results) {
        const pose = results.poseLandmarks
            ? results.poseLandmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z, landmark.visibility])
            : new Array(33 * 4).fill(0);
        const face = results.faceLandmarks
            ? results.faceLandmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z])
            : new Array(468 * 3).fill(0);
        const lh = results.leftHandLandmarks
            ? results.leftHandLandmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z])
            : new Array(21 * 3).fill(0);
        const rh = results.rightHandLandmarks
            ? results.rightHandLandmarks.flatMap(landmark => [landmark.x, landmark.y, landmark.z])
            : new Array(21 * 3).fill(0);
        return pose.concat(face, lh, rh);
    }

    function onResultsHolistic(results) {
        document.body.classList.add('loaded');
        fpsControl.tick();
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, out.width, out.height);
        canvasCtx.drawImage(results.image, 0, 0, out.width, out.height);
        canvasCtx.lineWidth = 1;
        drawConnectors(
            canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            {color: '#C0C0C070'});
        drawLandmarks(
            canvasCtx, results.poseLandmarks,
            {color: '#C0C0C070', fillColor: '#C0C0C070', radius: 5});
        drawConnectors(
            canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
            {color: '#C0C0C070'});
        drawLandmarks(
            canvasCtx, results.rightHandLandmarks, {
                color: '#C0C0C070',
                fillColor: '#C0C0C070',
                lineWidth: 2,
                radius: 5
            });
        drawConnectors(
            canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
            {color: '#C0C0C070'});
        drawLandmarks(
            canvasCtx, results.leftHandLandmarks, {
                color: '#C0C0C070',
                fillColor: '#C0C0C070',
                lineWidth: 2,
                radius: 5
            });
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
            {color: '#C0C0C070', lineWidth: 1});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
            {color: '#C0C0C070'});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
            {color: '#C0C0C070'});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
            {color: '#C0C0C070'});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
            {color: '#C0C0C070'});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
            {color: '#C0C0C070'});
        drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_LIPS,
            {color: '#C0C0C070'});

        canvasCtx.restore();
        const keypoints = extractKeypoints(results);
        fetch('/process_keypoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({keypoints: keypoints})
        });
    }

    const holistic = new Holistic({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.1/${file}`;
        }
    });
    holistic.onResults(onResultsHolistic);

    const camera = new Camera(video, {
        onFrame: async () => {
            await holistic.send({image: video});
        },
        width: 600,
        height: 600
    });
    camera.start();

    new ControlPanel(controlsElement, {
        upperBodyOnly: false,
        smoothLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    })
        .add([
            new StaticText({title: 'MediaPipe Holistic'}),
            fpsControl,
            new Toggle({title: 'Upper-body Only', field: 'upperBodyOnly'}),
            new Toggle(
                {title: 'Smooth Landmarks', field: 'smoothLandmarks'}),
            new Slider({
                title: 'Min Detection Confidence',
                field: 'minDetectionConfidence',
                range: [0, 1],
                step: 0.01
            }),
            new Slider({
                title: 'Min Tracking Confidence',
                field: 'minTrackingConfidence',
                range: [0, 1],
                step: 0.01
            }),
        ])
        .on(options => {
            holistic.setOptions(options);
        });
})