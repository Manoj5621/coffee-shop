import google.generativeai as genai

genai.configure(api_key="AIzaSyAg7fNI599-VQtjQVkhNRo6T6WRpp62O8s")

models = genai.list_models()

for model in models:
    print(f"Name: {model.name}")
    print(f"  Description: {model.description}")
    print(f"  Supported generation methods: {model.supported_generation_methods}")
    print("-" * 40)
