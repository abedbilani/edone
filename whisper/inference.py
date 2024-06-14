import os
import shutil

# Directory and file paths
dir_path = './models-v1'
inference_file_path = os.path.join(dir_path, 'code/inference.py')
requirements_file_path = os.path.join(dir_path, 'code/requirements.txt')

# Create the directory structure
os.makedirs(os.path.dirname(inference_file_path), exist_ok=True)

# Inference.py content
inference_content = '''
# inference.py
import io
import json
import logging
import os
import tempfile
import time
import boto3
import torch
import whisperx

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
s3 = boto3.client('s3')

def model_fn(model_dir, context=None):
    """
    Load and return the WhisperX model necessary for audio transcription.
    """
    print("Entering model_fn")

    logging.info("Loading WhisperX model")
    model = whisperx.load_model(whisper_arch=f"{model_dir}/guillaumekln/faster-whisper-large-v2",
                                device=DEVICE,
                                compute_type="float16",
                                vad_options={'model_fp': f"{model_dir}/whisperx/vad/pytorch_model.bin"})

    print("Loaded WhisperX model")

    print("Exiting model_fn with model loaded")
    return {
        'model': model
    }

def input_fn(request_body, request_content_type):
    """
    Process and load audio from S3, given the request body containing S3 bucket and key.
    """
    print("Entering input_fn")
    if request_content_type != 'application/json':
        raise ValueError("Invalid content type. Must be application/json")

    request = json.loads(request_body)
    s3_bucket = request['s3bucket']
    s3_key = request['s3key']
    language_code = request.get('language_code', 'en')

    # Download the file from S3
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    s3.download_file(Bucket=s3_bucket, Key=s3_key, Filename=temp_file.name)
    print(f"Downloaded audio from S3: {s3_bucket}/{s3_key}")

    print("Exiting input_fn")
    return temp_file.name, language_code

def predict_fn(input_data, model, context=None):
    """
    Perform transcription on the provided audio file and delete the file afterwards.
    """
    print("Entering predict_fn")
    start_time = time.time()

    whisperx_model = model['model']

    # Unpacking the input data
    audio_file_path, language_code = input_data

    logging.info("Loading audio")
    audio = whisperx.load_audio(audio_file_path)

    logging.info("Transcribing audio")
    transcription_result = whisperx_model.transcribe(audio, language=language_code, batch_size=16)

    try:
        os.remove(audio_file_path)  # input_data contains the path to the temp file
        print(f"Temporary file {audio_file_path} deleted.")
    except OSError as e:
        print(f"Error: {audio_file_path} : {e.strerror}")

    end_time = time.time()
    elapsed_time = end_time - start_time
    logging.info(f"Transcription took {int(elapsed_time)} seconds")

    print(f"Exiting predict_fn, processing took {int(elapsed_time)} seconds")
    return transcription_result

def output_fn(prediction, accept, context=None):
    """
    Prepare the prediction result for the response.
    """
    print("Entering output_fn")
    if accept != "application/json":
        raise ValueError("Accept header must be application/json")

    print(f"prediction: {prediction}")
    # Initialize a dictionary to store timeRange: text pairs
    time_range_text = []

    # Iterate through each segment and extract the time range and text
    for entry in prediction['segments']:
        formatted_entry = {'time': round(entry['start'] / 60, 2), 'content': entry['text']}
        time_range_text.append(formatted_entry)

    response_body = time_range_text

    print("Exiting output_fn with response prepared")
    return response_body, accept
'''

# Write the inference.py file
with open(inference_file_path, 'w') as file:
    file.write(inference_content)

# Requirements.txt content
requirements_content = '''speechbrain==0.5.16
faster-whisper==0.7.1
git+https://github.com/m-bain/whisperx.git@1b092de19a1878a8f138f665b1467ca21b076e7e
ffmpeg-python
'''

# Write the requirements.txt file
with open(requirements_file_path, 'w') as file:
    file.write(requirements_content)

shutil.make_archive('./modelv1', 'gztar', './models-v1')
