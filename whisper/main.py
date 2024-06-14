import huggingface_hub
import os
import urllib.request

def download_hf_model(model_name: str, hf_token: str, local_model_dir: str) -> str:
    """
    Fetches the provided model from HuggingFace and returns the subdirectory it is downloaded to.
    """
    model_subdir = model_name.split('@')[0]
    huggingface_hub.snapshot_download(model_subdir, token=hf_token, local_dir=f"{local_model_dir}/{model_subdir}", local_dir_use_symlinks=False)
    return model_subdir

def fetch_models(hf_token: str, local_model_dir="./models"):
    """
    Fetches models required for WhisperX transcription without diarization.
    """
    WHISPERX_MODEL = "guillaumekln/faster-whisper-large-v2"
    VAD_MODEL_URL = "https://whisperx.s3.eu-west-2.amazonaws.com/model_weights/segmentation/0b5b3216d60a2d32fc086b47ea8c67589aaeb26b7e07fcbe620d6d0b83e209ea/pytorch_model.bin"

    # Fetch WhisperX model
    download_hf_model(model_name=WHISPERX_MODEL, hf_token=hf_token, local_model_dir=local_model_dir)

    # Fetch VAD Segmentation model
    vad_model_dir = "whisperx/vad"
    if not os.path.exists(f"{local_model_dir}/{vad_model_dir}"):
        os.makedirs(f"{local_model_dir}/{vad_model_dir}")
    urllib.request.urlretrieve(VAD_MODEL_URL, f"{local_model_dir}/{vad_model_dir}/pytorch_model.bin")

fetch_models(
    hf_token="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",
    local_model_dir="./models-v1"
);
