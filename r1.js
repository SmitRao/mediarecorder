const videoElem = document.getElementById("video");
const audioElem = document.getElementById("audio");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");

// Options for getDisplayMedia()

var displayMediaOptions = {
  video: {
    cursor: "always",
  },
  audio: false,
};

var audioMediaOptions = {
  video: false,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};

// Set event listeners for the start and stop buttons
startElem.addEventListener(
  "click",
  function (evt) {
    startCapture();
  },
  false
);

stopElem.addEventListener(
  "click",
  function (evt) {
    stopCapture();
  },
  false
);

console.log = (msg) => (logElem.innerHTML += `${msg}<br>`);
console.error = (msg) =>
  (logElem.innerHTML += `<span class="error">${msg}</span><br>`);
console.warn = (msg) =>
  (logElem.innerHTML += `<span class="warn">${msg}<span><br>`);
console.info = (msg) =>
  (logElem.innerHTML += `<span class="info">${msg}</span><br>`);

var recordedChunks = [];

async function startCapture() {
  logElem.innerHTML = "";

  try {
    videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );

    audioElem.srcObject = await navigator.mediaDevices.getUserMedia(
      audioMediaOptions
    );

    let options;

    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      options = { mimeType: "video/webm;codecs=vp9,opus" };
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      options = { mimeType: "video/webm; codecs=vp8,opus" };
    } else {
      options = { mimeType: "video/webm;codecs=h264,opus" };
    }

    mediaRecorder = new MediaRecorder(
      new MediaStream([
        ...audioElem.srcObject.getAudioTracks(),
        ...videoElem.srcObject.getVideoTracks(),
      ]),
      options
    );
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();

    // to timeout after 1 hour
    setTimeout((event) => {
      console.log("stopping");
      mediaRecorder.stop();
    }, 3600000);

    dumpOptionsInfo();
  } catch (err) {
    console.error("Error: " + err);
  }
}

function stopCapture(evt) {
  let videoTracks = videoElem.srcObject.getTracks();
  videoTracks.forEach((track) => track.stop());
  videoElem.srcObject = null;

  let audioTracks = audioElem.srcObject.getTracks();
  audioTracks.forEach((track) => track.stop());
  videoElem.srcObject = null;

  logElem.innerHTML = ``;
  recordedChunks = [];
}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];

  console.info("Track settings:");
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info("Track constraints:");
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

function handleDataAvailable(event) {
  console.log("data-available");
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
    download();
  } else {
    // ...
  }
}
function download() {
  var blob = new Blob(recordedChunks, {
    type: "video/webm",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "test.webm";
  a.click();
  window.URL.revokeObjectURL(url);
}
