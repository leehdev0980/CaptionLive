import torch
from transformers import MarianTokenizer, MarianMTModel

MODEL_NAME = "Helsinki-NLP/opus-mt-en-sw"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Loading translation model on {device}...")

tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
model = MarianMTModel.from_pretrained(MODEL_NAME).to(device)

# Simple cache for repeated phrases
cache = {}

def translate_to_swahili(text: str) -> str:
    if not text.strip():
        return ""
    if text in cache:
        return cache[text]
    inputs = tokenizer(text, return_tensors="pt", truncation=True).to(device)
    outputs = model.generate(**inputs)
    translation = tokenizer.decode(outputs[0], skip_special_tokens=True)
    cache[text] = translation
    if len(cache) > 100:
        cache.pop(next(iter(cache)))
    return translation